import { Router } from "express";
import { appPool } from "../config/db";
import sql from "mssql";

const router = Router();

// Lấy danh sách timesheet của 1 dự án
router.get("/:MA_DA", async (req, res) => {
  try {
    const { MA_DA } = req.params;
    const result = await appPool.request()
      .input("MaDA", sql.Int, parseInt(MA_DA))
      .query(`
        SELECT t.*, n.HO_TEN AS HoTen, cd.TEN_CHUC_DANH AS ChucVu
        FROM TIMESHEET_DU_AN t
        JOIN NHAN_VIEN n ON t.MA_NV = n.MA_NV
        LEFT JOIN THONG_TIN_CONG_VIEC cv ON n.MA_NV = cv.MA_NV
        LEFT JOIN CHUC_DANH cd ON cv.MA_CHUC_DANH = cd.MA_CHUC_DANH
        WHERE t.MA_DA = @MaDA
        ORDER BY t.NGAY DESC
      `);
    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Thêm timesheet
router.post("/", async (req, res) => {
  try {
    const { MA_NV, MA_DA, ngay, soGioLam, noiDungCongViec } = req.body;
    if (!MA_NV || !MA_DA || !ngay || !soGioLam) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    await appPool.request()
      .input("MaNV", sql.VarChar, MA_NV)
      .input("MaDA", sql.Int, MA_DA)
      .input("Ngay", sql.Date, ngay)
      .input("SoGioLam", sql.Decimal(5, 2), soGioLam)
      .input("NoiDung", sql.NVarChar, noiDungCongViec || '')
      .query(`
        INSERT INTO TIMESHEET_DU_AN (MA_NV, MA_DA, NGAY, SO_GIO_LAM, NOI_DUNG_CONG_VIEC, TRANG_THAI)
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
    const { TRANG_THAI, nguoiDuyet } = req.body; // 'Đã duyệt' hoặc 'Từ chối'

    await appPool.request()
      .input("Id", sql.Int, parseInt(id))
      .input("TrangThai", sql.NVarChar, TRANG_THAI)
      .input("NguoiDuyet", sql.VarChar, nguoiDuyet)
      .query(`
        UPDATE TIMESHEET_DU_AN
        SET TRANG_THAI = @TrangThai, NGUOI_DUYET = @NguoiDuyet
        WHERE ID = @Id
      `);
      
    res.json({ success: true, message: "Đã cập nhật trạng thái timesheet" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
