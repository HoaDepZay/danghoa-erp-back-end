"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../config/db");
const mssql_1 = __importDefault(require("mssql"));
const router = (0, express_1.Router)();
// Lấy danh sách timesheet của 1 dự án
router.get("/:maDa", async (req, res) => {
    try {
        const { maDa } = req.params;
        const result = await db_1.appPool.request()
            .input("MaDA", mssql_1.default.Int, parseInt(maDa))
            .query(`
        SELECT t.*, n.HoTen, n.ChucVu
        FROM TIMESHEET_DU_AN t
        JOIN NHAN_VIEN n ON t.MaNV = n.MaNV
        WHERE t.MaDA = @MaDA
        ORDER BY t.Ngay DESC
      `);
        res.json({ success: true, data: result.recordset });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
// Thêm timesheet
router.post("/", async (req, res) => {
    try {
        const { maNv, maDa, ngay, soGioLam, noiDungCongViec } = req.body;
        if (!maNv || !maDa || !ngay || !soGioLam) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
        }
        await db_1.appPool.request()
            .input("MaNV", mssql_1.default.VarChar, maNv)
            .input("MaDA", mssql_1.default.Int, maDa)
            .input("Ngay", mssql_1.default.Date, ngay)
            .input("SoGioLam", mssql_1.default.Decimal(5, 2), soGioLam)
            .input("NoiDung", mssql_1.default.NVarChar, noiDungCongViec || '')
            .query(`
        INSERT INTO TIMESHEET_DU_AN (MaNV, MaDA, Ngay, SoGioLam, NoiDungCongViec, TrangThai)
        VALUES (@MaNV, @MaDA, @Ngay, @SoGioLam, @NoiDung, N'Chờ duyệt')
      `);
        res.json({ success: true, message: "Đã log giờ làm việc thành công" });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
// Duyệt / Từ chối timesheet (cho quản lý dự án)
router.patch("/:id/approve", async (req, res) => {
    try {
        const { id } = req.params;
        const { trangThai, nguoiDuyet } = req.body; // 'Đã duyệt' hoặc 'Từ chối'
        await db_1.appPool.request()
            .input("Id", mssql_1.default.Int, parseInt(id))
            .input("TrangThai", mssql_1.default.NVarChar, trangThai)
            .input("NguoiDuyet", mssql_1.default.VarChar, nguoiDuyet)
            .query(`
        UPDATE TIMESHEET_DU_AN
        SET TrangThai = @TrangThai, NguoiDuyet = @NguoiDuyet
        WHERE Id = @Id
      `);
        res.json({ success: true, message: "Đã cập nhật trạng thái timesheet" });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.default = router;
