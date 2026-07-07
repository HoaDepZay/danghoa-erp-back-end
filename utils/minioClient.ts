import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";

// Initialize S3 Client pointing to MinIO
const s3Client = new S3Client({
  region: "us-east-1", // MinIO default region
  endpoint: process.env.MINIO_ENDPOINT || "http://100.109.65.2:9000",
  forcePathStyle: true, // Required for MinIO
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "danghoa",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "31052006Hoa*",
  },
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "danghoa.erp";

/**
 * Upload a file buffer to MinIO
 * @param fileBuffer The file buffer from multer
 * @param originalName The original filename
 * @param mimeType The file mimetype
 * @returns The generated filename stored in MinIO
 */
export const uploadFileToMinIO = async (
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<string> => {
  const ext = path.extname(originalName);
  const uniqueName = `${crypto.randomUUID()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: uniqueName,
    Body: fileBuffer,
    ContentType: mimeType,
    // Note: cdn_erp_setup_guide.md says public-read policy is on bucket, so ACL is not strictly needed,
    // but sometimes required depending on exact MinIO config. We'll omit ACL for simplicity.
  });

  await s3Client.send(command);
  
  return uniqueName;
};
