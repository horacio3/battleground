import { PollyClient, SynthesizeSpeechCommand, VoiceId } from "@aws-sdk/client-polly";
import { NextResponse } from "next/server";

export const runtime = "edge";

// Hard coded to us-east-1 until generative vocies are available in other regions
const pollyClient = new PollyClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY ?? "",
  },
});

export async function POST(req: Request, res: Response) {
  const { message, voiceId } = (await req.json()) as {
    voiceId: VoiceId;
    message: string;
  };

  try {
    const pollyRes = await pollyClient.send(
      new SynthesizeSpeechCommand({
        VoiceId: voiceId,
        Text: message,
        Engine: "generative",
        OutputFormat: "mp3",
        TextType: "text",
      }),
    );

    return new NextResponse(pollyRes.AudioStream?.transformToWebStream(), {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (err: any) {
    console.error(err.message);
    return Response.json({ message: err.message }, { status: err.httpStatusCode ?? 500 });
  }
}
