import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import chatController from "../controllers/chatController";
import withUserConnection from "../middleware/authMiddleware";
import { checkAdminOrPass } from "../middleware/authorizationMiddleware";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 } 
});

router.get("/rooms", withUserConnection, chatController.getMyRooms);
router.post(
  "/direct-room",
  withUserConnection,
  chatController.getOrCreateDirectRoom,
);

router.get(
  "/rooms/:roomId/messages",
  withUserConnection,
  chatController.getRoomMessages,
);
router.get(
  "/rooms/:roomId/messages/latest",
  withUserConnection,
  chatController.getLatestRoomMessage,
);
router.get(
  "/rooms/:roomId/messages/search",
  withUserConnection,
  chatController.searchRoomMessages,
);
router.post(
  "/rooms/:roomId/messages",
  withUserConnection,
  chatController.sendMessage,
);

router.post("/groups", withUserConnection, chatController.createCustomGroup);
router.post(
  "/groups/:roomId/members",
  withUserConnection,
  chatController.addMemberToCustomGroup,
);
router.delete(
  "/groups/:roomId/members/:memberId",
  withUserConnection,
  chatController.removeMemberFromCustomGroup,
);

router.get(
  "/projects/:projectId/room",
  withUserConnection,
  chatController.getOrCreateProjectRoom,
);
router.get(
  "/departments/:departmentId/room",
  withUserConnection,
  checkAdminOrPass,
  chatController.getOrCreateDepartmentRoom,
);

router.post(
  "/upload",
  withUserConnection,
  upload.single('file'),
  (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: "Không tìm thấy file" });
      
      const sizeMB = req.file.size / (1024 * 1024);
      const isImage = req.file.mimetype.startsWith('image/');
      const isVideo = req.file.mimetype.startsWith('video/');

      if (isImage && sizeMB > 150) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: "Hình ảnh tải lên không được vượt quá 150MB!" });
      }
      if (isVideo && sizeMB > 200) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: "Video tải lên không được vượt quá 200MB!" });
      }
      if (!isImage && !isVideo && sizeMB > 20) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: "Tệp tải lên không được vượt quá 20MB!" });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ success: true, url: fileUrl, type: req.file.mimetype });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

export default router;

