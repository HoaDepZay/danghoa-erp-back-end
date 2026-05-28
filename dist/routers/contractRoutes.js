"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../config/db");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// GET /api/contracts?maNv=xxx  -  Lấy lịch sử hợp đồng của một nhân viên
router.get("/", authMiddleware_1.withUserConnection, async (req, res) => {
    try {
        const { maNv } = req.query;
        const request = db_1.appPool.request();
        if (maNv)
            request.input("MaNV", db_1.sql.VarChar(20), maNv);
        const result = await request.execute("sp_getContracts");
        res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        console.error("Lỗi get contracts:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
});
// GET /api/contracts/expiring?soNgay=30  -  Lấy DS hợp đồng sắp hết hạn
router.get("/expiring", authMiddleware_1.withUserConnection, async (req, res) => {
    try {
        const soNgay = parseInt(req.query.soNgay || "30");
        const result = await db_1.appPool.request()
            .input("SoNgay", db_1.sql.Int, soNgay)
            .execute("sp_getExpiringContracts");
        res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        console.error("Lỗi get expiring contracts:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
});
// POST /api/contracts  -  Tạo hợp đồng mới cho nhân viên
router.post("/", authMiddleware_1.withUserConnection, async (req, res) => {
    try {
        const { maNv, loaiHopDong, tuNgay, denNgay, luongCoBan, ngayKy, ghiChu } = req.body;
        if (!maNv || !loaiHopDong || !tuNgay || !luongCoBan) {
            return res.status(400).json({ success: false, message: "Thiếu dữ liệu bắt buộc" });
        }
        const request = db_1.appPool.request()
            .input("MaNV", db_1.sql.VarChar(20), maNv)
            .input("LoaiHopDong", db_1.sql.NVarChar(100), loaiHopDong)
            .input("TuNgay", db_1.sql.Date, tuNgay)
            .input("LuongCoBan", db_1.sql.Decimal(18, 2), luongCoBan);
        if (denNgay)
            request.input("DenNgay", db_1.sql.Date, denNgay);
        if (ngayKy)
            request.input("NgayKy", db_1.sql.Date, ngayKy);
        if (ghiChu)
            request.input("GhiChu", db_1.sql.NVarChar(500), ghiChu);
        await request.execute("sp_createContract");
        res.json({ success: true, message: "Đã tạo hợp đồng thành công" });
    }
    catch (error) {
        console.error("Lỗi create contract:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
});
// PUT /api/contracts/legal  -  Cập nhật thông tin pháp lý của nhân viên
router.put("/legal", authMiddleware_1.withUserConnection, async (req, res) => {
    try {
        const { maNv, maSoThue, soTaiKhoan, nganHang, soNguoiPhuThuoc } = req.body;
        if (!maNv) {
            return res.status(400).json({ success: false, message: "Thiếu mã nhân viên" });
        }
        const request = db_1.appPool.request().input("MaNV", db_1.sql.VarChar(20), maNv);
        if (maSoThue)
            request.input("MaSoThue", db_1.sql.VarChar(20), maSoThue);
        if (soTaiKhoan)
            request.input("SoTaiKhoan", db_1.sql.VarChar(30), soTaiKhoan);
        if (nganHang)
            request.input("NganHang", db_1.sql.NVarChar(100), nganHang);
        if (soNguoiPhuThuoc !== undefined)
            request.input("SoNguoiPhuThuoc", db_1.sql.Int, soNguoiPhuThuoc);
        await request.execute("sp_updateEmployeeLegal");
        res.json({ success: true, message: "Đã cập nhật thông tin pháp lý" });
    }
    catch (error) {
        console.error("Lỗi update employee legal:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
});
exports.default = router;
