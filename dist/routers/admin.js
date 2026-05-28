"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const db_1 = require("../config/db");
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const authorizationMiddleware_1 = require("../middleware/authorizationMiddleware");
const authController_1 = __importDefault(require("../controllers/authController"));
const camelCaseHelper_1 = require("../utils/camelCaseHelper");
// --- QUẢN LÝ NHÂN VIÊN ---
// Danh sách hồ sơ đã xác thực OTP, chờ admin duyệt
router.get("/onboarding/pending", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, authController_1.default.getPendingApprovals);
// Admin duyệt hồ sơ đăng ký và cấp thông tin nhân viên
router.post("/onboarding/accept", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, authController_1.default.acceptPendingRegistration);
// Admin từ chối hồ sơ đăng ký
router.post("/onboarding/reject", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, authController_1.default.rejectPendingRegistration);
// 1. Sửa nhân viên (Admin) - Đã chuyển sang gọi Stored Procedure: sp_updateEmployee
router.put("/nhan-vien/edit", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, async (req, res) => {
    const { manv, hoten, chucvu } = req.body;
    const maphg = req.body.maphg === null ? null : Number(req.body.maphg);
    const luong = Number(req.body.luong || 0);
    if (!manv)
        return res.status(400).json({ error: "Thiếu mã nhân viên!" });
    try {
        await db_1.appPool.request()
            .input("MANV", db_1.sql.VarChar(20), manv)
            .input("HOTEN", db_1.sql.NVarChar(200), hoten || null)
            .input("CHUCVU", db_1.sql.NVarChar(100), chucvu || null)
            .input("LUONG", db_1.sql.Decimal(18, 2), luong)
            .input("MAPHG", db_1.sql.Int, maphg)
            .execute("sp_updateEmployee");
        return res.json({ success: true, message: "Cập nhật nhân sự thành công!" });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// 2. Xóa nhân viên (Admin) - Đã chuyển sang gọi Stored Procedure: sp_deleteEmployeeFull
router.delete("/nhan-vien/:manv", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, async (req, res) => {
    const { manv } = req.params;
    try {
        await db_1.appPool.request()
            .input("MANV", db_1.sql.VarChar(20), manv)
            .execute("sp_deleteEmployeeFull");
        return res.json({ success: true, message: "Xóa nhân viên thành công!" });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// --- QUẢN LÝ PHÒNG BAN ---
// 3. Lấy danh sách phòng ban (Admin) - Đã chuyển sang gọi Stored Procedure: sp_getAllDepartments
router.get("/phong-ban", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, async (req, res) => {
    try {
        const result = await db_1.appPool.request().execute("sp_getAllDepartments");
        return res.json((0, camelCaseHelper_1.keysToCamelCase)(result.recordset));
    }
    catch (err) {
        return res.status(403).json({ error: "Lỗi truy xuất hoặc bạn không có quyền Admin" });
    }
});
// 4. Tạo phòng ban (Admin) - Đã chuyển sang gọi Stored Procedure: sp_createDepartment
router.post("/phong-ban/create", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, async (req, res) => {
    const { tenpb } = req.body;
    if (!tenpb)
        return res.status(400).json({ error: "Vui lòng nhập tên phòng ban!" });
    const maPhongBan = Math.floor(1000 + Math.random() * 9000);
    try {
        await db_1.appPool.request()
            .input("MAPHG", db_1.sql.Int, maPhongBan)
            .input("TENPB", db_1.sql.NVarChar(100), tenpb)
            .execute("sp_createDepartment");
        return res.status(201).json({
            success: true,
            message: `Tạo phòng ${tenpb} thành công!`,
            id: maPhongBan,
        });
    }
    catch (err) {
        if (err.message.includes("PRIMARY KEY"))
            return res.status(500).json({ error: "Trùng ID, thử lại!" });
        return res.status(500).json({ error: err.message });
    }
});
// 5. Sửa phòng ban (Admin) - Đã có sẵn gọi Stored Procedure: sp_updateDepartment
router.put("/phong-ban/edit", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, async (req, res) => {
    try {
        const maphg = Number(req.body.maphg);
        const tenpb = req.body.tenpb;
        const matruongphg = req.body.matruongphg;
        console.log("[ADMIN][UPDATE_DEPARTMENT] Incoming body:", req.body);
        console.log("[ADMIN][UPDATE_DEPARTMENT] Parsed params:", {
            maphg,
            tenpb,
            matruongphg,
            maphgType: typeof maphg,
        });
        if (!maphg) {
            console.warn("[ADMIN][UPDATE_DEPARTMENT] Invalid maphg:", req.body.maphg);
            return res.status(400).json({ error: "Thiếu mã phòng ban!" });
        }
        if (tenpb === undefined && matruongphg === undefined) {
            console.warn("[ADMIN][UPDATE_DEPARTMENT] Missing update fields tenpb/matruongphg");
            return res.status(400).json({
                error: "Thiếu dữ liệu cập nhật! Cần tenpb hoặc matruongphg.",
            });
        }
        const request = db_1.appPool.request();
        request.input("MaPhg", db_1.sql.Int, maphg);
        request.input("TenPb", db_1.sql.NVarChar(100), tenpb ?? null);
        request.input("MaTruongPhg", db_1.sql.VarChar(10), matruongphg ?? null);
        request.output("Status", db_1.sql.Int);
        console.log("[ADMIN][UPDATE_DEPARTMENT] Executing sp_updateDepartment", {
            MaPhg: maphg,
            TenPb: tenpb ?? null,
            MaTruongPhg: matruongphg ?? null,
        });
        const executionResult = await request.execute("sp_updateDepartment");
        const status = executionResult.output?.Status;
        console.log("[ADMIN][UPDATE_DEPARTMENT] SP Status:", status);
        if (status !== 1) {
            const deptCheck = await db_1.appPool
                .request()
                .input("MAPHG", db_1.sql.Int, maphg)
                .execute("sp_getDepartmentById");
            const managerCheck = matruongphg
                ? await db_1.appPool
                    .request()
                    .input("MANV", db_1.sql.VarChar(20), matruongphg)
                    .execute("sp_getEmployeeById")
                : { recordset: [] };
            const currentDepartment = deptCheck.recordset?.[0] || null;
            const managerExists = managerCheck.recordset?.length > 0;
            console.warn("[ADMIN][UPDATE_DEPARTMENT] Update failed with status != 1", {
                status,
                maphg,
                tenpb,
                matruongphg,
            });
            return res.status(400).json({
                success: false,
                message: "Cập nhật thất bại. Kiểm tra mã phòng ban hoặc dữ liệu đầu vào.",
                debug: {
                    spStatus: status,
                    requested: {
                        maphg,
                        tenpb: tenpb ?? null,
                        matruongphg: matruongphg ?? null,
                    },
                    departmentExists: !!currentDepartment,
                    currentDepartment,
                    managerExists,
                },
            });
        }
        console.log("[ADMIN][UPDATE_DEPARTMENT] Update success", {
            maphg,
            status,
        });
        return res.json({ success: true, message: "Cập nhật thành công!" });
    }
    catch (err) {
        console.error("[ADMIN][UPDATE_DEPARTMENT] Exception:", {
            message: err?.message,
            stack: err?.stack,
        });
        return res.status(500).json({ error: err?.message || "Lỗi hệ thống" });
    }
});
// 6. Xóa phòng ban (Admin) - Đã chuyển sang gọi Stored Procedure: sp_deleteDepartment
router.delete("/phong-ban/:maphg", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, async (req, res) => {
    const { maphg } = req.params;
    try {
        const checkRows = await db_1.appPool.request()
            .input("MAPHG", db_1.sql.Int, maphg)
            .execute("sp_getEmployeesByDepartment");
        if (checkRows.recordset.length > 0) {
            return res.status(400).json({ error: "Không thể xóa phòng có nhân viên!" });
        }
        await db_1.appPool.request()
            .input("MAPHG", db_1.sql.Int, maphg)
            .execute("sp_deleteDepartment");
        return res.json({ success: true, message: "Xóa phòng ban thành công!" });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
exports.default = router;
