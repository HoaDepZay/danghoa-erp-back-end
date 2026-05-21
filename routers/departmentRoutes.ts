import express from "express";
import departmentController from "../controllers/departmentController";
import withUserConnection from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/authorizationMiddleware";

const router = express.Router();

// Lấy chi tiết phòng ban của nhân viên chỉ định (kèm danh sách nhân viên)
router.get(
  "/employee/:id/detail",
  withUserConnection,
  departmentController.getEmployeeDepartmentWithMembers,
);

// Lấy danh sách phòng ban của nhân viên chỉ định (không cần admin)
router.get(
  "/employee/:id",
  withUserConnection,
  departmentController.getEmployeeDepartments,
);

// Lấy danh sách phòng ban (admin)
router.get(
  "/",
  withUserConnection,
  requireAdmin,
  departmentController.getAllDepartments,
);

// Lấy chi tiết phòng ban theo ID (admin)
router.get(
  "/:id",
  withUserConnection,
  requireAdmin,
  departmentController.getDepartmentById,
);

// Thêm mới phòng ban
router.post(
  "/",
  withUserConnection,
  requireAdmin,
  departmentController.createDepartment,
);

// Cập nhật phòng ban
router.put(
  "/:id",
  withUserConnection,
  requireAdmin,
  departmentController.updateDepartment,
);

// Xóa phòng ban
router.delete(
  "/:id",
  withUserConnection,
  requireAdmin,
  departmentController.deleteDepartment,
);

export default router;
