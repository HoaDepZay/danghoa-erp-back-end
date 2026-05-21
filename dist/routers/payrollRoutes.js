"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payrollController_1 = __importDefault(require("../controllers/payrollController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const authorizationMiddleware_1 = require("../middleware/authorizationMiddleware");
const router = express_1.default.Router();
// ===== PAYROLL =====
// Check-in nhân viên (body: maNV)
router.post("/check-in", authMiddleware_1.withUserConnection, authorizationMiddleware_1.checkMaNVOwnership, payrollController_1.default.checkIn);
// Check-out nhân viên (body: maNV)
router.post("/check-out", authMiddleware_1.withUserConnection, authorizationMiddleware_1.checkMaNVOwnership, payrollController_1.default.checkOut);
// Lấy danh sách chấm công theo ngày
router.get("/attendance/:date", authMiddleware_1.withUserConnection, payrollController_1.default.getAttendanceByDate);
// Lấy chấm công của nhân viên (có thể lọc theo ngày bắt đầu/kết thúc)
router.get("/attendance/employee/:id", authMiddleware_1.withUserConnection, payrollController_1.default.getEmployeeAttendance);
// Lấy phiếu lương của cá nhân (id: MaNV). Có thể truyền thêm query ?year=...&month=...
router.get("/employee/:id", authMiddleware_1.withUserConnection, payrollController_1.default.getEmployeePayslip);
// Lấy danh sách NV nhận lương theo tháng/năm
router.get("/:year/:month", authMiddleware_1.withUserConnection, payrollController_1.default.getPayrollByMonth);
exports.default = router;
