import { AmazonBedrockProviderSettings } from "@ai-sdk/amazon-bedrock";
import { GetSessionTokenCommand, STSClient } from "@aws-sdk/client-sts";

export default async function getSessionToken(region: string) {
  const stsClient = new STSClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });

  const response = await stsClient.send(new GetSessionTokenCommand({ DurationSeconds: 3600 }));

  return {
    region,
    accessKeyId: response.Credentials?.AccessKeyId,
    secretAccessKey: response.Credentials?.SecretAccessKey,
    sessionToken: response.Credentials?.SessionToken,
  } satisfies AmazonBedrockProviderSettings;
}
