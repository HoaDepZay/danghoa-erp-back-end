"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const msnodesqlv8_1 = __importDefault(require("msnodesqlv8"));
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const authorizationMiddleware_1 = require("../middleware/authorizationMiddleware");
const employeeController_1 = __importDefault(require("../controllers/employeeController"));
const db_1 = require("../config/db");
// ⚠️ ROUTES SPECIFIC PHẢI TRƯỚC GENERIC ROUTES (/:id)
// 1️⃣ SPECIFIC ROUTES (profile, my-projects, coworkers, update-info)
// GET /api/employees/:id - Xem profile/chi tiết nhân viên (thay thế cho /profile/:manv cũ)
// (Defined below in generic routes section)
// GET /api/employees/my-projects/:manv - Xem dự án của tôi (dùng dynamic connection)
router.get("/my-projects/:manv", authMiddleware_1.default, (req, res) => {
    const query = `SELECT da.TENDA, pc.THOIGIAN FROM PHANCONG pc JOIN DUAN da ON pc.MADA = da.MADA WHERE pc.MANV = ?`;
    msnodesqlv8_1.default.query(req.userConnectionString, query, [req.params.manv], (err, rows) => {
        if (err)
            return res.status(500).json({ error: "Lỗi truy vấn hoặc quyền hạn!" });
        res.json(rows);
    });
});
// GET /api/employees/coworkers/:maphg - Xem đồng nghiệp cùng phòng (dùng dynamic connection)
router.get("/coworkers/:maphg", authMiddleware_1.default, (req, res) => {
    msnodesqlv8_1.default.query(req.userConnectionString, "SELECT MANV, HOTEN, CHUCVU FROM NHAN_VIEN WHERE MAPHG = ?", [req.params.maphg], (err, rows) => {
        if (err)
            return res.status(403).json({ error: "Access Denied" });
        res.json(rows);
    });
});
// PUT /api/employees/update-info - Cập nhật thông tin cá nhân (dùng SA connection từ global pool)
router.put("/update-info", async (req, res) => {
    try {
        const { manv, email } = req.body;
        const request = db_1.appPool.request();
        await request
            .input("MaNV", db_1.sql.NVarChar, manv)
            .input("Email", db_1.sql.NVarChar, email)
            .query("UPDATE NHAN_VIEN SET EMAIL = @Email WHERE MANV = @MaNV");
        res.json({ message: "Cập nhật thành công" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 2️⃣ GENERIC ROUTES (list, detail, create, update, delete)
// GET /api/employees - Lấy danh sách nhân viên
router.get("/", authMiddleware_1.default, employeeController_1.default.getAllEmployees);
// POST /api/employees - Thêm nhân viên mới (Admin)
router.post("/", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, employeeController_1.default.createEmployee);
// GET /api/employees/:id - Xem chi tiết 1 nhân viên
router.get("/:id", authMiddleware_1.default, employeeController_1.default.getEmployeeById);
// PUT /api/employees/:id - Cập nhật thông tin nhân viên (Admin)
router.put("/:id", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, employeeController_1.default.updateEmployee);
// DELETE /api/employees/:id - Xóa/Khóa nhân viên (Admin)
router.delete("/:id", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, employeeController_1.default.deleteEmployee);
exports.default = router;
