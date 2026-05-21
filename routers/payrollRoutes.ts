import express from "express";
import payrollController from "../controllers/payrollController";
import { withUserConnection } from "../middleware/authMiddleware";
import { checkMaNVOwnership } from "../middleware/authorizationMiddleware";

const router = express.Router();

// ===== PAYROLL =====
// Check-in nhân viên (body: maNV)
router.post(
  "/check-in",
  withUserConnection,
  checkMaNVOwnership,
  payrollController.checkIn,
);

// Check-out nhân viên (body: maNV)
router.post(
  "/check-out",
  withUserConnection,
  checkMaNVOwnership,
  payrollController.checkOut,
);

// Lấy danh sách chấm công theo ngày
router.get(
  "/attendance/:date",
  withUserConnection,
  payrollController.getAttendanceByDate,
);

// Lấy chấm công của nhân viên (có thể lọc theo ngày bắt đầu/kết thúc)
router.get(
  "/attendance/employee/:id",
  withUserConnection,
  payrollController.getEmployeeAttendance,
);

// Lấy phiếu lương của cá nhân (id: MaNV). Có thể truyền thêm query ?year=...&month=...
router.get(
  "/employee/:id",
  withUserConnection,
  payrollController.getEmployeePayslip,
);

// Lấy danh sách NV nhận lương theo tháng/năm
router.get(
  "/:year/:month",
  withUserConnection,
  payrollController.getPayrollByMonth,
);

export default router;
