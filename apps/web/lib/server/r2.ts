import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { requireR2Env } from "./env";

export function getR2Client() {
  const env = requireR2Env();
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey
    }
  });
}

export async function uploadJsonToR2(key: string, data: unknown) {
  const env = requireR2Env();
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: env.bucketName,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json"
    })
  );

  if (env.publicBaseUrl) {
    return `${env.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  return `r2://${env.bucketName}/${key}`;
}
