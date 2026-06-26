import express from "express";
const router = express.Router();
import authController from "../controllers/authController";
import withUserConnection from "../middleware/authMiddleware";

router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtp);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetForgotPassword);
router.put(
  "/change-password",
  withUserConnection,
  authController.changePassword,
);
router.put("/update-profile", withUserConnection, authController.updateProfile);

export default router;

