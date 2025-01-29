import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY!,
  },
});

export const getPresignedUrl = async (
  uri: string,
  expiresIn: number = 60 * 60 * 12, // 12 hours
): Promise<string> => {
  const [, , bucket, ...keyParts] = uri.split("/");
  const key = keyParts.join("/");

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    const presignedUrl = await getSignedUrl(client, command, {
      expiresIn,
    });
    return presignedUrl;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return "";
  }
};
