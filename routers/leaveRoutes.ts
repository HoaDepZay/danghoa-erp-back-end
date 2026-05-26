import express, { Request, Response } from "express";
import { appPool, sql } from "../config/db";
import { withUserConnection } from "../middleware/authMiddleware";
import { createNotification } from "../controllers/notificationController";
import { emitNotification } from "../server";

const router = express.Router();

// GET / - Lấy danh sách đơn (admin/manager xem tất cả, nhân viên xem của mình)
router.get("/", withUserConnection, async (req: Request, res: Response) => {
  try {
    const { maNv, trangThaiDuyet } = req.query;
    const request = appPool.request();
    if (maNv) request.input("MaNV", sql.VarChar(20), maNv);
    if (trangThaiDuyet) request.input("TrangThaiDuyet", sql.NVarChar(50), trangThaiDuyet);

    const result = await request.execute("sp_getLeaves");
    res.json({ success: true, data: result.recordset });
  } catch (error: any) {
    console.error("Lỗi get leaves:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

router.get("/types", withUserConnection, async (req: Request, res: Response) => {
  try {
    const result = await appPool.request().query("SELECT * FROM LOAI_NGHI_PHEP");
    res.json({ success: true, data: result.recordset });
  } catch (error: any) {
    console.error("Lỗi get leave types:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
});

// Duyệt đơn nghỉ phép (đa cấp)
router.post("/approve", withUserConnection, async (req: Request, res: Response) => {
  try {
    const { maDon, capDuyet, trangThai, lyDoTuChoi } = req.body;
    // req.user được gán từ withUserConnection (middleware)
    // Lấy mã NV của người duyệt
    const nguoiDuyet = (req as any).user?.MANV || "ADMIN";

    if (!maDon || !capDuyet || !trangThai) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
    }

    const request = appPool.request()
      .input("MaDon", sql.Int, maDon)
      .input("NguoiDuyet", sql.VarChar(20), nguoiDuyet)
      .input("CapDuyet", sql.Int, capDuyet)
      .input("TrangThai", sql.NVarChar(50), trangThai);

    if (lyDoTuChoi) {
      request.input("LyDoTuChoi", sql.NVarChar(500), lyDoTuChoi);
    }

    await request.execute("sp_approveLeave");
    res.json({ success: true, message: "Đã cập nhật trạng thái đơn nghỉ phép" });
  } catch (error: any) {
    console.error("Lỗi approve leave:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// POST / - Nhân viên nộp đơn nghỉ phép mới
router.post("/", withUserConnection, async (req: Request, res: Response) => {
  try {
    const maNv = (req as any).user?.userInfo?.manv;
    const { tuNgay, denNgay, lyDo, maLoaiNghi } = req.body;

    if (!maNv) return res.status(401).json({ success: false, message: "Không xác định được nhân viên" });
    if (!tuNgay || !denNgay || !lyDo || !maLoaiNghi) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin nộp đơn" });
    }

    await appPool.request()
      .input("MANV",   sql.VarChar(20),   maNv)
      .input("TUNGAY", sql.Date,          new Date(tuNgay))
      .input("DENNGAY",sql.Date,          new Date(denNgay))
      .input("LYDO",   sql.NVarChar(500), lyDo)
      .input("MALOAINGHI", sql.Int,       maLoaiNghi)
      .query(`
        INSERT INTO DON_NGHI_PHEP (MANV, TUNGAY, DENNGAY, LYDO, TRANGTHAIDUYET, MALOAINGHI)
        VALUES (@MANV, @TUNGAY, @DENNGAY, @LYDO, N'Chờ duyệt', @MALOAINGHI)
      `);

    // Logic gửi thông báo cho Trưởng phòng
    try {
      const deptHeadQuery = await appPool.request()
        .input("MANV", sql.VarChar(20), maNv)
        .query(`
          SELECT pb.MATRUONGPHG 
          FROM NHAN_VIEN nv
          LEFT JOIN PHONG_BAN pb ON nv.MAPHG = pb.MAPHG
          WHERE nv.MANV = @MANV
        `);
      
      const maTruongPhg = deptHeadQuery.recordset[0]?.MATRUONGPHG;
      let targetMaNv = maTruongPhg;

      // Nếu không có Trưởng phòng, tìm 1 admin làm fallback
      if (!targetMaNv) {
        const adminQuery = await appPool.request()
          .query("SELECT TOP 1 MANV FROM TAI_KHOAN WHERE ROLE = 'admin'");
        targetMaNv = adminQuery.recordset[0]?.MANV;
      }

      if (targetMaNv) {
        const notif = await createNotification(
          targetMaNv,
          "Đơn nghỉ phép mới",
          `Nhân viên ${maNv} vừa nộp đơn xin nghỉ phép. Vui lòng kiểm tra và phê duyệt.`,
          "leave_request",
          "/leaves"
        );
        if (notif) emitNotification(targetMaNv, notif);
      }
    } catch (e) {
      console.error("Lỗi gửi thông báo xin nghỉ phép:", e);
    }

    res.json({ success: true, message: "Nộp đơn nghỉ phép thành công! Đang chờ phê duyệt." });
  } catch (error: any) {
    console.error("Lỗi nộp đơn:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// GET /my - Nhân viên xem đơn nghỉ phép của bản thân
router.get("/my", withUserConnection, async (req: Request, res: Response) => {
  try {
    const maNv = (req as any).user?.userInfo?.manv;
    if (!maNv) return res.status(401).json({ success: false, message: "Không xác định được nhân viên" });

    const result = await appPool.request()
      .input("MaNV", sql.VarChar(20), maNv)
      .execute("sp_getLeaves");

    res.json({ success: true, data: result.recordset });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
