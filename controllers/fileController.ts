import { Request, Response } from "express";
import { fileService } from "../services/fileService";

const fileController = {
  uploadFile: async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Không tìm thấy file" });
      }

      // Validate size limit (20MB generic, except handled specific max sizes)
      const sizeMB = req.file.size / (1024 * 1024);
      const isImage = req.file.mimetype.startsWith('image/');
      const isVideo = req.file.mimetype.startsWith('video/');

      if (isImage && sizeMB > 150) {
        return res.status(400).json({ success: false, message: "Hình ảnh tải lên không được vượt quá 150MB!" });
      }
      if (isVideo && sizeMB > 200) {
        return res.status(400).json({ success: false, message: "Video tải lên không được vượt quá 200MB!" });
      }
      if (!isImage && !isVideo && sizeMB > 20) {
        return res.status(400).json({ success: false, message: "Tệp tải lên không được vượt quá 20MB!" });
      }

      // Delegate business logic to Service
      const fileUrl = await fileService.uploadFile(
        req.file.buffer, 
        req.file.originalname, 
        req.file.mimetype
      );

      return res.json({ 
        success: true, 
        url: fileUrl, 
        type: req.file.mimetype 
      });
    } catch (err: any) {
      console.error("Lỗi upload file:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

export default fileController;
