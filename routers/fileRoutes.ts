import express from "express";
import multer from "multer";
import fileController from "../controllers/fileController";
import withUserConnection from "../middleware/authMiddleware";

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB max generic limit for multer
});

// POST /api/files/upload
router.post(
  "/upload",
  withUserConnection,
  upload.single('file'),
  fileController.uploadFile
);

export default router;
