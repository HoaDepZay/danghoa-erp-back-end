import express from "express";
import multer from "multer";
import chatController from "../controllers/chatController";
import withUserConnection from "../middleware/authMiddleware";
import { checkAdminOrPass } from "../middleware/authorizationMiddleware";

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } 
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

router.put(
  "/messages/:messageId",
  withUserConnection,
  chatController.editMessage,
);

router.delete(
  "/messages/:messageId/revoke",
  withUserConnection,
  chatController.revokeMessage,
);

router.delete(
  "/messages/:messageId/delete-for-me",
  withUserConnection,
  chatController.deleteMessageForMe,
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

// Upload functionality has been moved to fileRoutes (/api/files/upload)

export default router;

