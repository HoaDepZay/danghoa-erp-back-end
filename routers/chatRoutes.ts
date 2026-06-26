import express from "express";
import multer from "multer";
import path from "path";
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

const upload = multer({ storage: storage });

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
      if (!req.file) return res.status(400).json({ success: false, message: "KhÃ´ng tÃ¬m tháº¥y file" });
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ success: true, url: fileUrl, type: req.file.mimetype });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

export default router;

