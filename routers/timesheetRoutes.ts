import { Router } from "express";
import { appPool } from "../config/db";
import sql from "mssql";

const router = Router();

// Lấy danh sách timesheet của 1 dự án
router.get("/:maDa", async (req, res) => {
  try {
    const { maDa } = req.params;
    const result = await appPool.request()
      .input("MaDA", sql.Int, parseInt(maDa))
      .query(`
        SELECT t.*, n.HoTen, n.ChucVu
        FROM TIMESHEET_DU_AN t
        JOIN NHAN_VIEN n ON t.MaNV = n.MaNV
        WHERE t.MaDA = @MaDA
        ORDER BY t.Ngay DESC
      `);
    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
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

    await appPool.request()
      .input("MaNV", sql.VarChar, maNv)
      .input("MaDA", sql.Int, maDa)
      .input("Ngay", sql.Date, ngay)
      .input("SoGioLam", sql.Decimal(5, 2), soGioLam)
      .input("NoiDung", sql.NVarChar, noiDungCongViec || '')
      .query(`
        INSERT INTO TIMESHEET_DU_AN (MaNV, MaDA, Ngay, SoGioLam, NoiDungCongViec, TrangThai)
        VALUES (@MaNV, @MaDA, @Ngay, @SoGioLam, @NoiDung, N'Chờ duyệt')
      `);
      
    res.json({ success: true, message: "Đã log giờ làm việc thành công" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Duyệt / Từ chối timesheet (cho quản lý dự án)
router.patch("/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { trangThai, nguoiDuyet } = req.body; // 'Đã duyệt' hoặc 'Từ chối'

    await appPool.request()
      .input("Id", sql.Int, parseInt(id))
      .input("TrangThai", sql.NVarChar, trangThai)
      .input("NguoiDuyet", sql.VarChar, nguoiDuyet)
      .query(`
        UPDATE TIMESHEET_DU_AN
        SET TrangThai = @TrangThai, NguoiDuyet = @NguoiDuyet
        WHERE Id = @Id
      `);
      
    res.json({ success: true, message: "Đã cập nhật trạng thái timesheet" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
