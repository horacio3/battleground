import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const getPresignedUrl = async (
  uri: string,
  region: string = "us-east-1",
  expiresIn: number = 60 * 60 * 12, // 12 hours
): Promise<string> => {
  const [, , bucket, ...keyParts] = uri.split("/");
  const key = keyParts.join("/");

  const client = new S3Client({ region });

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
