import express, { Request, Response } from "express";
import { appPool, sql } from "../config/db";
import { withUserConnection } from "../middleware/authMiddleware";

const router = express.Router();

// GET /api/contracts?MA_NV=xxx  -  Lấy lịch sử hợp đồng của một nhân viên
router.get("/", withUserConnection, async (req: Request, res: Response) => {
  try {
    const { MA_NV } = req.query;
    const request = appPool.request();
    if (MA_NV) request.input("MaNV", sql.VarChar(20), MA_NV);
    const result = await request.execute("sp_getContracts");
    res.json({ success: true, data: result.recordset });
  } catch (error: any) {
    console.error("Lỗi get contracts:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// GET /api/contracts/expiring?soNgay=30  -  Lấy DS hợp đồng sắp hết hạn
router.get("/expiring", withUserConnection, async (req: Request, res: Response) => {
  try {
    const soNgay = parseInt((req.query.soNgay as string) || "30");
    const result = await appPool.request()
      .input("SoNgay", sql.Int, soNgay)
      .execute("sp_getExpiringContracts");
    res.json({ success: true, data: result.recordset });
  } catch (error: any) {
    console.error("Lỗi get expiring contracts:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// POST /api/contracts  -  Tạo hợp đồng mới cho nhân viên
router.post("/", withUserConnection, async (req: Request, res: Response) => {
  try {
    const { MA_NV, loaiHopDong, tuNgay, denNgay, luongCoBan, ngayKy, ghiChu } = req.body;
    if (!MA_NV || !loaiHopDong || !tuNgay || !luongCoBan) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu bắt buộc" });
    }
    const request = appPool.request()
      .input("MaNV",         sql.VarChar(20),    MA_NV)
      .input("LoaiHopDong",  sql.NVarChar(100),  loaiHopDong)
      .input("TuNgay",       sql.Date,           tuNgay)
      .input("LuongCoBan",   sql.Decimal(18, 2), luongCoBan);
    if (denNgay)  request.input("DenNgay",  sql.Date,         denNgay);
    if (ngayKy)   request.input("NgayKy",   sql.Date,         ngayKy);
    if (ghiChu)   request.input("GhiChu",   sql.NVarChar(500), ghiChu);

    await request.execute("sp_createContract");
    res.json({ success: true, message: "Đã tạo hợp đồng thành công" });
  } catch (error: any) {
    console.error("Lỗi create contract:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// PUT /api/contracts/legal  -  Cập nhật thông tin pháp lý của nhân viên
router.put("/legal", withUserConnection, async (req: Request, res: Response) => {
  try {
    const { MA_NV, maSoThue, soTaiKhoan, nganHang, soNguoiPhuThuoc } = req.body;
    if (!MA_NV) {
      return res.status(400).json({ success: false, message: "Thiếu mã nhân viên" });
    }
    const request = appPool.request().input("MaNV", sql.VarChar(20), MA_NV);
    if (maSoThue)        request.input("MaSoThue",        sql.VarChar(20),    maSoThue);
    if (soTaiKhoan)      request.input("SoTaiKhoan",      sql.VarChar(30),    soTaiKhoan);
    if (nganHang)        request.input("NganHang",        sql.NVarChar(100),  nganHang);
    if (soNguoiPhuThuoc !== undefined)
                         request.input("SoNguoiPhuThuoc", sql.Int, soNguoiPhuThuoc);

    await request.execute("sp_updateEmployeeLegal");
    res.json({ success: true, message: "Đã cập nhật thông tin pháp lý" });
  } catch (error: any) {
    console.error("Lỗi update employee legal:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

export default router;
