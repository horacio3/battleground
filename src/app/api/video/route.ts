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

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

const videoS3Bucket = process.env.VIDEO_S3_BUCKET;
const internalRateLimitDomain = process.env.INTERNAL_RATE_LIMIT_DOMAIN;

export async function POST(req: NextRequest) {
  const { sessionClaims } = await auth();

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
    region: modelInfo?.region ?? process.env.AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY ?? "",
    },
  });

  try {
    const response = await bedrockClient.send(
      new StartAsyncInvokeCommand({
        modelId,
        modelInput: {
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
        },
        outputDataConfig: {
          s3OutputDataConfig: {
            s3Uri: `s3://${videoS3Bucket}`,
          },
        },
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
    region: modelInfo?.region ?? process.env.AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY ?? "",
    },
  });

  const response = await bedrockClient.send(new GetAsyncInvokeCommand({ invocationArn }));

  if (response.status === "Completed") {
    const uri = `${response.outputDataConfig?.s3OutputDataConfig?.s3Uri}/output.mp4`;
    const url = await getPresignedUrl(uri);
    return new Response(JSON.stringify({ ...response, outputUrl: url }));
  }
  return new Response(JSON.stringify(response));
}
