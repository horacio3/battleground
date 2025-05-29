import { VideoModelId } from "@/lib/model/model.type";
import { videoModels } from "@/lib/model/models";
import { externalRateLimiter, internalRateLimiter } from "@/lib/rate-limiter";
import { BedrockRuntimeClient, GetAsyncInvokeCommand, StartAsyncInvokeCommand } from "@aws-sdk/client-bedrock-runtime";
import { auth } from "@clerk/nextjs/server";
import { Message } from "ai/react";
import { NextRequest } from "next/server";

import { getPresignedUrl } from "@/lib/get-presigned-url";
import { ModelConfig } from "@/lib/model/model-config.type";
import { ipAddress } from "@vercel/functions";

const internalRateLimitDomain = process.env.INTERNAL_RATE_LIMIT_DOMAIN;

const videoBuckets = {
  "us-east-1": process.env.VIDEO_S3_BUCKET_US_EAST_1,
  "us-west-2": process.env.VIDEO_S3_BUCKET_US_WEST_2,
};

const getModelInput = (modelId: VideoModelId, message: Message) => {
  switch (modelId) {
    case "amazon.nova-reel-v1:0":
      return {
        taskType: "TEXT_VIDEO",
        textToVideoParams: {
          text: message.content,
        },
        videoGenerationConfig: {
          durationSeconds: 6,
          fps: 24,
          dimension: "1280x720",
          seed: 0,
        },
      };
    case "luma.ray-v2:0":
      return {
        prompt: message.content,
        aspectRatio: "16:9",
        resolution: "720p",
        duration: "5s",
      };
  }
};

export async function POST(req: NextRequest) {
  const { sessionClaims } = await auth();

  if (!sessionClaims?.email?.endsWith("@caylent.com")) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  // If the user is from the internal rate limit domain, we use a different rate limiter
  if (internalRateLimitDomain && sessionClaims?.email?.endsWith(internalRateLimitDomain)) {
    const { success } = await internalRateLimiter.limit(sessionClaims?.email ?? ipAddress(req) ?? "127.0.0.1");
    if (!success) {
      return new Response(JSON.stringify({ message: "Too many requests" }), { status: 429 });
    }
  } else {
    const { success } = await externalRateLimiter.limit(sessionClaims?.email ?? ipAddress(req) ?? "127.0.0.1");
    if (!success) {
      return new Response(JSON.stringify({ message: "Too many requests" }), { status: 429 });
    }
  }

  const { modelId, message, config } = (await req.json()) as {
    modelId: VideoModelId;
    message: Message;
    config?: ModelConfig;
  };

  const modelInfo = videoModels.find((m) => m.id === modelId);

  const bedrockClient = new BedrockRuntimeClient({
    region: modelInfo?.region ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });

  try {
    const response = await bedrockClient.send(
      new StartAsyncInvokeCommand({
        modelId,
        modelInput: getModelInput(modelId, message) as any,
        outputDataConfig: {
          s3OutputDataConfig: {
            s3Uri: `s3://${videoBuckets[(modelInfo?.region as keyof typeof videoBuckets) ?? "us-east-1"]}`,
          },
        },
        tags: [
          { key: "user", value: sessionClaims?.email },
          { key: "model", value: modelId },
        ],
      }),
    );

    return new Response(JSON.stringify(response));
  } catch (err: any) {
    console.error(err.message);
    return Response.json({ message: err.message }, { status: err.httpStatusCode ?? 500 });
  }
}

export async function GET(req: NextRequest) {
  const modelId = req.nextUrl.searchParams.get("modelId");
  const invocationArn = req.nextUrl.searchParams.get("invocationArn");

  if (!modelId || !invocationArn) {
    return new Response(JSON.stringify({ message: "Missing modelId or invocationArn" }), { status: 400 });
  }

  const modelInfo = videoModels.find((m) => m.id === modelId);

  const bedrockClient = new BedrockRuntimeClient({
    region: modelInfo?.region ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });

  const response = await bedrockClient.send(new GetAsyncInvokeCommand({ invocationArn }));

  if (response.status === "Completed") {
    const uri = `${response.outputDataConfig?.s3OutputDataConfig?.s3Uri}/output.mp4`;
    const url = await getPresignedUrl(uri, modelInfo?.region ?? "us-east-1");
    return new Response(JSON.stringify({ ...response, outputUrl: url }));
  }
  return new Response(JSON.stringify(response));
}
