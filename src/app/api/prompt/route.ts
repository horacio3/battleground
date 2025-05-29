import { BedrockAgentClient, ListPromptsCommand } from "@aws-sdk/client-bedrock-agent";

export const revalidate = 0;

const client = new BedrockAgentClient({
  region: "us-east-1",
});

export async function GET() {
  // TODO: add pagination if needed
  const response = await client.send(new ListPromptsCommand({ maxResults: 100 }));
  return Response.json(response.promptSummaries);
}
