import express from "express";
import { getNotifications, markAsRead } from "../controllers/notificationController";
import { withUserConnection } from "../middleware/authMiddleware";

const router = express.Router();

router.use(withUserConnection);

router.get("/", getNotifications);
router.put("/:id/read", markAsRead);

export default router;
