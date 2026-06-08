import express, { Request, Response } from "express";
import contractRepository from "../repositories/contractRepository";
import { withUserConnection } from "../middleware/authMiddleware";

const router = express.Router();

// GET /api/contracts?MA_NV=xxx  -  Lấy lịch sử hợp đồng của một nhân viên
router.get("/", withUserConnection, async (req: Request, res: Response) => {
  try {
    const { MA_NV } = req.query; // 🌟 Giữ nguyên chuẩn hóa
    const data = await contractRepository.getContracts(
      MA_NV ? String(MA_NV) : undefined,
    );
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Lỗi get contracts:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// GET /api/contracts/expiring?SO_NGAY=30  -  Lấy DS hợp đồng sắp hết hạn
router.get(
  "/expiring",
  withUserConnection,
  async (req: Request, res: Response) => {
    try {
      // 🌟 Chuẩn hóa query param từ soNgay thành SO_NGAY
      const SO_NGAY = parseInt((req.query.SO_NGAY as string) || "30");
      const data = await contractRepository.getExpiringContracts(SO_NGAY);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Lỗi get expiring contracts:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
  },
);

// POST /api/contracts  -  Tạo hợp đồng mới cho nhân viên
router.post("/", withUserConnection, async (req: Request, res: Response) => {
  try {
    // 🌟 Chuẩn hóa toàn bộ Request Body sang dạng TEN_TRUONG
    const {
      MA_NV,
      LOAI_HOP_DONG,
      TU_NGAY,
      DEN_NGAY,
      LUONG_CO_BAN,
      NGAY_KY,
      GHI_CHU,
    } = req.body;

    if (!MA_NV || !LOAI_HOP_DONG || !TU_NGAY || !LUONG_CO_BAN) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu dữ liệu bắt buộc" });
    }
    const result = await contractRepository.createContract({
      MA_NV: String(MA_NV),
      LOAI_HOP_DONG: String(LOAI_HOP_DONG),
      TU_NGAY: String(TU_NGAY),
      DEN_NGAY: DEN_NGAY ? String(DEN_NGAY) : undefined,
      LUONG_CO_BAN,
      NGAY_KY: NGAY_KY ? String(NGAY_KY) : undefined,
      GHI_CHU: GHI_CHU ? String(GHI_CHU) : undefined,
    });

    return res.json({
      success: true,
      message: "Đã tạo hợp đồng thành công",
      MA_HD: result.MA_HD,
    });
  } catch (error: any) {
    console.error("Lỗi create contract:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// PUT /api/contracts/legal  -  Cập nhật thông tin pháp lý của nhân viên
router.put(
  "/legal",
  withUserConnection,
  async (req: Request, res: Response) => {
    try {
      // 🌟 Chuẩn hóa toàn bộ Request Body sang dạng TEN_TRUONG
      const { MA_NV, MA_SO_THUE, SO_TAI_KHOAN, NGAN_HANG, SO_NGUOI_PHU_THUOC } =
        req.body;

      if (!MA_NV) {
        return res
          .status(400)
          .json({ success: false, message: "Thiếu mã nhân viên" });
      }
      await contractRepository.updateEmployeeLegal({
        MA_NV: String(MA_NV),
        MA_SO_THUE: MA_SO_THUE ? String(MA_SO_THUE) : undefined,
        SO_TAI_KHOAN: SO_TAI_KHOAN ? String(SO_TAI_KHOAN) : undefined,
        NGAN_HANG: NGAN_HANG ? String(NGAN_HANG) : undefined,
        SO_NGUOI_PHU_THUOC:
          SO_NGUOI_PHU_THUOC !== undefined
            ? Number(SO_NGUOI_PHU_THUOC)
            : undefined,
      });
      res.json({ success: true, message: "Đã cập nhật thông tin pháp lý" });
    } catch (error: any) {
      console.error("Lỗi update employee legal:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
  },
);

export default router;
