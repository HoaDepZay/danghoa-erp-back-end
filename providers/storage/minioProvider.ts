import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

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

export const minioProvider = {
  /**
   * Upload an object to MinIO bucket
   */
  uploadObject: async (key: string, fileBuffer: Buffer, mimeType: string): Promise<void> => {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });
    await s3Client.send(command);
  },

  /**
   * Delete an object from MinIO bucket
   */
  deleteObject: async (key: string): Promise<void> => {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
  }
};
