"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../config/db");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Lấy danh sách các ca làm việc
router.get("/", authMiddleware_1.withUserConnection, async (req, res) => {
    try {
        const result = await db_1.appPool.request().execute("sp_getShifts");
        res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        console.error("Lỗi get shifts:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
});
// Lấy danh sách lịch phân công ca
router.get("/assignments", authMiddleware_1.withUserConnection, async (req, res) => {
    try {
        const { maNv, tuNgay, denNgay } = req.query;
        const request = db_1.appPool.request();
        if (maNv)
            request.input("MaNV", db_1.sql.VarChar(20), maNv);
        if (tuNgay)
            request.input("TuNgay", db_1.sql.Date, tuNgay);
        if (denNgay)
            request.input("DenNgay", db_1.sql.Date, denNgay);
        const result = await request.execute("sp_getShiftAssignments");
        res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        console.error("Lỗi get shift assignments:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
});
// Thêm hoặc cập nhật phân công ca
router.post("/assignments", authMiddleware_1.withUserConnection, async (req, res) => {
    try {
        const { maNv, maCa, ngayLamViec, trangThai } = req.body;
        if (!maNv || !maCa || !ngayLamViec) {
            return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
        }
        const request = db_1.appPool.request()
            .input("MaNV", db_1.sql.VarChar(20), maNv)
            .input("MaCa", db_1.sql.Int, maCa)
            .input("NgayLamViec", db_1.sql.Date, ngayLamViec);
        if (trangThai) {
            request.input("TrangThai", db_1.sql.NVarChar(50), trangThai);
        }
        await request.execute("sp_createShiftAssignment");
        res.json({ success: true, message: "Đã phân công ca làm việc" });
    }
    catch (error) {
        console.error("Lỗi create shift assignment:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
});
// Xóa phân công ca
router.delete("/assignments/:id", authMiddleware_1.withUserConnection, async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.appPool.request()
            .input("ID", db_1.sql.Int, id)
            .execute("sp_deleteShiftAssignment");
        res.json({ success: true, message: "Đã xóa ca làm việc" });
    }
    catch (error) {
        console.error("Lỗi delete shift assignment:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
});
exports.default = router;
