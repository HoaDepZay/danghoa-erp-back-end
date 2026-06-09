import express, { Request, Response } from "express";
import { appPool, sql } from "../config/db";
import { withUserConnection } from "../middleware/authMiddleware";
import { createNotification } from "../controllers/notificationController";
import { emitNotification } from "../server";

const router = express.Router();

// GET / - Lấy danh sách đơn (admin/manager xem tất cả, nhân viên xem của mình)
router.get("/", withUserConnection, async (req: Request, res: Response) => {
  try {
    const { MA_NV, trangThaiDuyet } = req.query;
    const request = appPool.request();
    if (MA_NV) request.input("MaNV", sql.VarChar(20), MA_NV);
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
// POST /approve - Duyệt hoặc từ chối đơn nghỉ phép (1 cấp)
// Quyền: Trưởng phòng của nhân viên đó, hoặc Giám đốc/Admin
router.post("/approve", withUserConnection, async (req: Request, res: Response) => {
  try {
    const { maDon, TRANG_THAI, lyDoTuChoi } = req.body;
    const nguoiDuyet = (req as any).user?.userInfo?.MA_NV;

    if (!nguoiDuyet) {
      return res.status(401).json({ success: false, message: "Không xác định được người duyệt" });
    }
    if (!maDon || !TRANG_THAI) {
      return res.status(400).json({ success: false, message: "Thiếu maDon hoặc TRANG_THAI" });
    }
    if (!["Đã duyệt", "Từ chối"].includes(TRANG_THAI)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }
    if (TRANG_THAI === "Từ chối" && !lyDoTuChoi?.trim()) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập lý do từ chối" });
    }

    const request = appPool.request()
      .input("MaDon", sql.Int, maDon)
      .input("NguoiDuyet", sql.VarChar(20), nguoiDuyet)
      .input("TrangThai", sql.NVarChar(50), TRANG_THAI);

    if (lyDoTuChoi) {
      request.input("LyDoTuChoi", sql.NVarChar(500), lyDoTuChoi.trim());
    }

    await request.execute("sp_approveLeave");
    res.json({ success: true, message: TRANG_THAI === "Đã duyệt" ? "Đã duyệt đơn nghỉ phép" : "Đã từ chối đơn nghỉ phép" });
  } catch (error: any) {
    console.error("Lỗi approve leave:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// POST / - Nhân viên nộp đơn nghỉ phép mới
router.post("/", withUserConnection, async (req: Request, res: Response) => {
  try {
    const MA_NV = (req as any).user?.userInfo?.MA_NV;
    const { tuNgay, denNgay, lyDo, maLoaiNghi } = req.body;

    if (!MA_NV) return res.status(401).json({ success: false, message: "Không xác định được nhân viên" });
    if (!tuNgay || !denNgay || !lyDo || !maLoaiNghi) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin nộp đơn" });
    }

    await appPool.request()
      .input("MANV",   sql.VarChar(20),   MA_NV)
      .input("TUNGAY", sql.Date,          new Date(tuNgay))
      .input("DENNGAY",sql.Date,          new Date(denNgay))
      .input("LYDO",   sql.NVarChar(500), lyDo)
      .input("MALOAINGHI", sql.Int,       maLoaiNghi)
      .query(`
        INSERT INTO DON_NGHI_PHEP (MA_NV, TU_NGAY, DEN_NGAY, LY_DO, TRANG_THAI_DUYET, MA_LOAI_NGHI)
        VALUES (@MANV, @TUNGAY, @DENNGAY, @LYDO, N'Chờ duyệt', @MALOAINGHI)
      `);

    // Logic gửi thông báo cho Trưởng phòng
    try {
      const deptHeadQuery = await appPool.request()
        .input("MANV", sql.VarChar(20), MA_NV)
        .query(`
          SELECT pb.MA_TRUONG_PHG 
          FROM NHAN_VIEN nv
          LEFT JOIN THONG_TIN_CONG_VIEC cv ON nv.MA_NV = cv.MA_NV
          LEFT JOIN PHONG_BAN pb ON cv.MA_PHG = pb.MA_PHG
          WHERE nv.MA_NV = @MANV
        `);
      
      const maTruongPhg = deptHeadQuery.recordset[0]?.MA_TRUONG_PHG;
      let targetMaNv = maTruongPhg;

      // Nếu không có Trưởng phòng, tìm 1 admin làm fallback
      if (!targetMaNv) {
        const adminQuery = await appPool.request()
          .query("SELECT TOP 1 MA_NV FROM TAI_KHOANG WHERE MA_VAI_TRO = 1");
        targetMaNv = adminQuery.recordset[0]?.MA_NV;
      }

      if (targetMaNv) {
        const notif = await createNotification(
          targetMaNv,
          "Đơn nghỉ phép mới",
          `Nhân viên ${MA_NV} vừa nộp đơn xin nghỉ phép. Vui lòng kiểm tra và phê duyệt.`,
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
    const MA_NV = (req as any).user?.userInfo?.MA_NV;
    if (!MA_NV) return res.status(401).json({ success: false, message: "Không xác định được nhân viên" });

    const result = await appPool.request()
      .input("MaNV", sql.VarChar(20), MA_NV)
      .execute("sp_getLeaves");

    res.json({ success: true, data: result.recordset });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
