import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { env } from '@/config/env';

const globalForS3 = globalThis as unknown as {
  s3: S3Client | undefined;
};

export const s3 = globalForS3.s3 ?? new S3Client({
  endpoint: env().S3_ENDPOINT,
  region: 'us-east-1', // MinIO doesn't care, but SDK requires it
  credentials: {
    accessKeyId: env().S3_ACCESS_KEY,
    secretAccessKey: env().S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

if (process.env.NODE_ENV !== 'production') {
  globalForS3.s3 = s3;
}

export async function uploadToS3(key: string, body: Buffer | string, contentType = 'application/octet-stream') {
  await s3.send(new PutObjectCommand({
    Bucket: env().S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return `${env().S3_ENDPOINT}/${env().S3_BUCKET}/${key}`;
}

export async function getFromS3(key: string) {
  const result = await s3.send(new GetObjectCommand({
    Bucket: env().S3_BUCKET,
    Key: key,
  }));
  return result.Body?.transformToString();
}
