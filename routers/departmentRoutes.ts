import express from "express";
import departmentController from "../controllers/departmentController";
import withUserConnection from "../middleware/authMiddleware";
import { requireAdmin, requireDirectorOrAdmin, requireDepartmentHead } from "../middleware/authorizationMiddleware";

const router = express.Router();

// Láº¥y chi tiáº¿t phÃ²ng ban cá»§a nhÃ¢n viÃªn chá»‰ Ä‘á»‹nh (kÃ¨m danh sÃ¡ch nhÃ¢n viÃªn)
router.get(
  "/employee/:id/detail",
  withUserConnection,
  departmentController.getEmployeeDepartmentWithMembers,
);

// Láº¥y danh sÃ¡ch phÃ²ng ban cá»§a nhÃ¢n viÃªn chá»‰ Ä‘á»‹nh (khÃ´ng cáº§n admin)
router.get(
  "/employee/:id",
  withUserConnection,
  departmentController.getEmployeeDepartments,
);

// Láº¥y danh sÃ¡ch phÃ²ng ban (cho phÃ©p táº¥t cáº£ nhÃ¢n viÃªn xem Ä‘á»ƒ dÃ¹ng cho sÆ¡ Ä‘á»“ tá»• chá»©c)
router.get(
  "/",
  withUserConnection,
  departmentController.getAllDepartments,
);

// Lấy chi tiết phòng ban theo ID (cho phép mọi nhân viên xem)
router.get(
  "/:id",
  withUserConnection,
  departmentController.getDepartmentById,
);

// ThÃªm má»›i phÃ²ng ban
router.post(
  "/",
  withUserConnection,
  requireAdmin,
  departmentController.createDepartment,
);

// Cáº­p nháº­t phÃ²ng ban
router.put(
  "/:id",
  withUserConnection,
  requireAdmin,
  departmentController.updateDepartment,
);

// XÃ³a phÃ²ng ban
router.delete(
  "/:id",
  withUserConnection,
  requireAdmin,
  departmentController.deleteDepartment,
);

export default router;

