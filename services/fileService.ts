import crypto from "crypto";
import path from "path";
import { minioProvider } from "../providers/storage/minioProvider";

export const fileService = {
  /**
   * Sinh UUID, upload file lên MinIO và trả về full CDN URL
   */
  uploadFile: async (fileBuffer: Buffer, originalName: string, mimeType: string): Promise<string> => {
    const ext = path.extname(originalName);
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    
    // Upload thông qua provider
    await minioProvider.uploadObject(uniqueName, fileBuffer, mimeType);
    
    // Tạo và trả về đường dẫn CDN
    const cdnUrl = process.env.CDN_BASE_URL || "https://cdn.danghoa-erp.site/media";
    return `${cdnUrl}/${uniqueName}`;
  },

  /**
   * Nhận vào CDN URL và xóa file vật lý tương ứng trên MinIO
   */
  deleteFile: async (fileUrl: string): Promise<void> => {
    try {
      if (!fileUrl) return;
      
      if (fileUrl.startsWith("http")) {
        const fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
        if (fileName) {
          await minioProvider.deleteObject(fileName);
        }
      } else {
        // Hỗ trợ xóa các file /uploads/ cũ nếu muốn (tùy chọn)
        const fs = require("fs");
        const path = require("path");
        const filename = path.basename(fileUrl);
        const filepath = path.join(__dirname, "..", "..", "uploads", filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }
    } catch (error) {
      console.error(`Lỗi khi xóa file ${fileUrl}:`, error);
    }
  }
};
