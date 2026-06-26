import express from "express";
import payrollController from "../controllers/payrollController";
import { withUserConnection } from "../middleware/authMiddleware";
import { 
  checkMaNVOwnership, 
  requireManagerOrAdmin,
  checkMaNVParamOwnershipOrManagerAdmin 
} from "../middleware/authorizationMiddleware";

const router = express.Router();

// ===== PAYROLL =====
// Check-in nhÃ¢n viÃªn (body: maNV)
router.post(
  "/check-in",
  withUserConnection,
  checkMaNVOwnership,
  payrollController.checkIn,
);

// Check-out nhÃ¢n viÃªn (body: maNV)
router.post(
  "/check-out",
  withUserConnection,
  checkMaNVOwnership,
  payrollController.checkOut,
);

// Láº¥y danh sÃ¡ch cháº¥m cÃ´ng theo ngÃ y
router.get(
  "/attendance/:date",
  withUserConnection,
  payrollController.getAttendanceByDate,
);

// Láº¥y cháº¥m cÃ´ng cá»§a nhÃ¢n viÃªn (cÃ³ thá»ƒ lá» c theo ngÃ y báº¯t Ä‘áº§u/káº¿t thÃºc)
router.get(
  "/attendance/employee/:id",
  withUserConnection,
  checkMaNVParamOwnershipOrManagerAdmin,
  payrollController.getEmployeeAttendance,
);

// Láº¥y phiáº¿u lÆ°Æ¡ng cá»§a cÃ¡ nhÃ¢n (id: MaNV). CÃ³ thá»ƒ truyá» n thÃªm query ?year=...&month=...
// Láº¥y phiáº¿u lÆ°Æ¡ng cá»§a cÃ¡ nhÃ¢n (id: MaNV). CÃ³ thá»ƒ truyá» n thÃªm query ?year=...&month=...
router.get(
  "/employee/:id",
  withUserConnection,
  checkMaNVParamOwnershipOrManagerAdmin,
  payrollController.getEmployeePayslip,
);

// Láº¥y danh sÃ¡ch NV nháº­n lÆ°Æ¡ng theo thÃ¡ng/nÄƒm (Chỉ HR/Admin)
router.get(
  "/:year/:month",
  withUserConnection,
  requireManagerOrAdmin,
  payrollController.getPayrollByMonth,
);

// Chá»‘t lÆ°Æ¡ng thÃ¡ng (Chỉ HR/Admin)
router.post(
  "/close/:year/:month",
  withUserConnection,
  requireManagerOrAdmin,
  payrollController.closePayrollForMonth,
);

// Cập nhật lương (Chỉ HR/Admin)
router.put(
  "/salary/:id",
  withUserConnection,
  requireManagerOrAdmin,
  payrollController.updatePayroll,
);

// Kiá»ƒm tra tráº¡ng thÃ¡i chá»‘t lÆ°Æ¡ng (Chỉ HR/Admin)
router.get(
  "/status/:year/:month",
  withUserConnection,
  requireManagerOrAdmin,
  payrollController.checkIfPayrollClosed,
);

export default router;
