import { AmazonBedrockProviderSettings } from "@ai-sdk/amazon-bedrock";
import { GetSessionTokenCommand, STSClient } from "@aws-sdk/client-sts";

export default async function getSessionToken(region: string) {
  const stsClient = new STSClient({ region });

  const response = await stsClient.send(new GetSessionTokenCommand({ DurationSeconds: 3600 }));

  return {
    region,
    accessKeyId: response.Credentials?.AccessKeyId,
    secretAccessKey: response.Credentials?.SecretAccessKey,
    sessionToken: response.Credentials?.SessionToken,
  } satisfies AmazonBedrockProviderSettings;
}
