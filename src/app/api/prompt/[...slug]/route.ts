import { PromptBodyArgs } from "@/types/prompt-body-args";
import {
  BedrockAgentClient,
  CreatePromptCommand,
  CreatePromptVersionCommand,
  DeletePromptCommand,
  GetPromptCommand,
  UpdatePromptCommand,
} from "@aws-sdk/client-bedrock-agent"; // ES Modules import
import { type NextRequest, NextResponse } from "next/server";

const DEFAULT_VARIANT = "BATTLEGROUND";

const client = new BedrockAgentClient({
  region: "us-east-1",
});

// get prompt by id and version
export async function GET(_: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  const [id] = params.slug;
  const response = await client.send(new GetPromptCommand({ promptIdentifier: id }));
  return NextResponse.json(response);
}

export async function POST(req: Request) {
  try {
    const { name, description, prompt, user } = (await req.json()) as PromptBodyArgs;

    const newPrompt = await client.send(
      new CreatePromptCommand({
        name,
        description: !!description?.length ? description : undefined,
        defaultVariant: DEFAULT_VARIANT,
        variants: [
          {
            name: DEFAULT_VARIANT,
            templateType: "TEXT",
            templateConfiguration: {
              text: {
                text: prompt,
              },
            },
            inferenceConfiguration: {
              text: {},
            },
          },
        ],
        tags: {
          application: "Bedrock Battleground",
          createdBy: user ?? "",
        },
      }),
    );

    // create a new version (snapshot) of the prompt
    await client.send(
      new CreatePromptVersionCommand({
        promptIdentifier: newPrompt.id,
        tags: {
          application: "Bedrock Battleground",
          createdBy: user ?? "",
        },
      }),
    );

    return Response.json(newPrompt);
  } catch (error: any) {
    console.error("Error creating prompt:", error);
    return Response.json({ message: error?.message }, { status: error.httpStatusCode ?? 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  const [id] = params.slug;

  try {
    const { name, description, prompt, user } = (await req.json()) as PromptBodyArgs;

    // update the prompt
    const updatedPrompt = await client.send(
      new UpdatePromptCommand({
        promptIdentifier: id,
        name,
        description,
        defaultVariant: DEFAULT_VARIANT,
        variants: [
          {
            name: DEFAULT_VARIANT,
            templateType: "TEXT",
            templateConfiguration: {
              text: {
                text: prompt,
              },
            },
            inferenceConfiguration: {
              text: {},
            },
          },
        ],
      }),
    );

    // create a new version (snapshot) of the prompt
    await client.send(
      new CreatePromptVersionCommand({
        promptIdentifier: updatedPrompt.id,
        tags: {
          application: "Bedrock Battleground",
          createdBy: user ?? "",
        },
      }),
    );

    return Response.json(updatedPrompt);
  } catch (error: any) {
    console.error("Error updating prompt:", error);
    return Response.json({ message: error?.message }, { status: error.httpStatusCode ?? 500 });
  }
}

export async function DELETE(_: Request, props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  const [id] = params.slug;

  try {
    const result = await client.send(new DeletePromptCommand({ promptIdentifier: id }));
    return Response.json(result);
  } catch (error: any) {
    console.error("Error deleting prompt:", error);
    return Response.json({ message: error?.message }, { status: error.httpStatusCode ?? 500 });
  }
}
