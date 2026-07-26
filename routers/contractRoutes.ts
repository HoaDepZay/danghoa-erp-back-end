import express, { Request, Response } from "express";
import contractRepository from "../repositories/contractRepository";
import { withUserConnection } from "../middleware/authMiddleware";
import { checkMaNVParamOwnershipOrDirectorAdmin, requireDirectorOrAdmin } from "../middleware/authorizationMiddleware";
import { fileService } from "../services/fileService";

const router = express.Router();

// GET /api/contracts?MA_NV=xxx  -  Lấy lịch sử hợp đồng của một nhân viên
router.get("/", withUserConnection, requireDirectorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { MA_NV } = req.query; // 🌟 Giữ nguyên chuẩn hóa
    const data = await contractRepository.getContracts(
      MA_NV ? String(MA_NV) : undefined,
    );
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Lá»—i get contracts:", error);
    res
      .status(500)
      .json({ success: false, message: "Lá»—i mÃ¡y chá»§", error: error.message });
  }
});

// GET /api/contracts/expiring?SO_NGAY=30  -  Lấy DS hợp đồng sắp hết hạn
router.get(
  "/expiring",
  withUserConnection,
  requireDirectorOrAdmin,
  async (req: Request, res: Response) => {
    try {
      // ðŸŒŸ Chuáº©n hÃ³a query param tá»« soNgay thÃ nh SO_NGAY
      const SO_NGAY = parseInt((req.query.SO_NGAY as string) || "30");
      const data = await contractRepository.getExpiringContracts(SO_NGAY);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Lá»—i get expiring contracts:", error);
      res
        .status(500)
        .json({ success: false, message: "Lá»—i mÃ¡y chá»§", error: error.message });
    }
  },
);

// POST /api/contracts  -  Tạo hợp đồng mới cho nhân viên
router.post("/", withUserConnection, requireDirectorOrAdmin, async (req: Request, res: Response) => {
  try {
    // ðŸŒŸ Chuáº©n hÃ³a toÃ n bá»™ Request Body sang dáº¡ng TEN_TRUONG
    const {
      MA_NV,
      LOAI_HOP_DONG,
      TU_NGAY,
      DEN_NGAY,
      LUONG_CO_BAN,
      NGAY_KY,
      GHI_CHU,
      URL_CHI_TIET,
      TRANG_THAI,
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
      URL_CHI_TIET: URL_CHI_TIET ? String(URL_CHI_TIET) : undefined,
      TRANG_THAI: TRANG_THAI ? String(TRANG_THAI) : undefined,
    });

    return res.json({
      success: true,
      message: "Ä Ã£ táº¡o há»£p Ä‘á»“ng thÃ nh cÃ´ng",
      MA_HD: result.MA_HD,
    });
  } catch (error: any) {
    console.error("Lá»—i create contract:", error);
    res
      .status(500)
      .json({ success: false, message: "Lá»—i mÃ¡y chá»§", error: error.message });
  }
});

// PUT /api/contracts/:id - Cập nhật hợp đồng
router.put("/:id", withUserConnection, requireDirectorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      MA_NV,
      LOAI_HOP_DONG,
      TU_NGAY,
      DEN_NGAY,
      LUONG_CO_BAN,
      URL_CHI_TIET,
      TRANG_THAI,
    } = req.body;

    if (!MA_NV || !LOAI_HOP_DONG || !TU_NGAY || !LUONG_CO_BAN) {
      return res.status(400).json({ success: false, message: "Thiếu trường bắt buộc" });
    }

    const oldContract = await contractRepository.getContractById(id);
    if (!oldContract) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hợp đồng" });
    }

    // Nếu có file mới, xóa file cũ trên MinIO
    if (URL_CHI_TIET && oldContract.URL_CHI_TIET && URL_CHI_TIET !== oldContract.URL_CHI_TIET) {
      await fileService.deleteFile(oldContract.URL_CHI_TIET);
    }

    await contractRepository.updateContract({
      MA_HD: id,
      MA_NV: String(MA_NV),
      LOAI_HOP_DONG: String(LOAI_HOP_DONG),
      TU_NGAY: String(TU_NGAY),
      DEN_NGAY: DEN_NGAY ? String(DEN_NGAY) : undefined,
      LUONG_CO_BAN,
      URL_CHI_TIET: URL_CHI_TIET ? String(URL_CHI_TIET) : undefined,
      TRANG_THAI: TRANG_THAI ? String(TRANG_THAI) : undefined,
    });

    // Ghi log lịch sử
    let changes = [];
    if (Number(oldContract.LUONG_CO_BAN) !== Number(LUONG_CO_BAN)) {
      changes.push(`Lương: ${oldContract.LUONG_CO_BAN} -> ${LUONG_CO_BAN}`);
    }
    if (TRANG_THAI && oldContract.TRANG_THAI !== TRANG_THAI) {
      changes.push(`Trạng thái: ${oldContract.TRANG_THAI} -> ${TRANG_THAI}`);
    }
    if (URL_CHI_TIET && oldContract.URL_CHI_TIET !== URL_CHI_TIET) {
      changes.push(`Cập nhật file hợp đồng`);
    }

    if (changes.length > 0) {
      const actorMaNV = (req as any).user?.userInfo?.MA_NV || (req as any).user?.userInfo?.manv || "ADMIN";
      await contractRepository.logContractHistory(id, actorMaNV, changes.join(" | "));
    }

    res.json({ success: true, message: "Đã cập nhật hợp đồng thành công" });
  } catch (error: any) {
    console.error("Lỗi cập nhật hợp đồng:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi cập nhật hợp đồng" });
  }
});

// PUT /api/contracts/:id/status - Cập nhật trạng thái hợp đồng
router.put("/:id/status", withUserConnection, requireDirectorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { TRANG_THAI } = req.body;

    if (!TRANG_THAI) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin TRANG_THAI" });
    }

    const validStatuses = ["CHUA BAT DAU", "DANG THUC HIEN", "HET HAN", "HUY"];
    if (!validStatuses.includes(TRANG_THAI)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    const oldContract = await contractRepository.getContractById(id);
    if (!oldContract) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hợp đồng" });
    }

    await contractRepository.updateContractStatus(id, TRANG_THAI);

    if (oldContract.TRANG_THAI !== TRANG_THAI) {
      const actorMaNV = (req as any).user?.userInfo?.MA_NV || (req as any).user?.userInfo?.manv || "ADMIN";
      await contractRepository.logContractHistory(id, actorMaNV, `Trạng thái: ${oldContract.TRANG_THAI} -> ${TRANG_THAI}`);
    }

    res.json({ success: true, message: "Cập nhật trạng thái hợp đồng thành công" });
  } catch (error: any) {
    console.error("Lỗi cập nhật trạng thái hợp đồng:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi cập nhật trạng thái hợp đồng" });
  }
});

// GET /api/contracts/:id/history - Lấy lịch sử hợp đồng
router.get("/:id/history", withUserConnection, requireDirectorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const history = await contractRepository.getContractHistory(id);
    res.json({ success: true, data: history });
  } catch (error: any) {
    console.error("Lỗi lấy lịch sử hợp đồng:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// PUT /api/contracts/legal  -  Cáº­p nháº­t thÃ´ng tin phÃ¡p lÃ½ cá»§a nhÃ¢n viÃªn
router.put(
  "/legal",
  withUserConnection,
  async (req: Request, res: Response) => {
    try {
      // ðŸŒŸ Chuáº©n hÃ³a toÃ n bá»™ Request Body sang dáº¡ng TEN_TRUONG
      const { MA_NV, MA_SO_THUE, SO_TAI_KHOAN, NGAN_HANG, SO_NGUOI_PHU_THUOC } =
        req.body;

      if (!MA_NV) {
        return res
          .status(400)
          .json({ success: false, message: "Thiáº¿u mÃ£ nhÃ¢n viÃªn" });
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
      res.json({ success: true, message: "ÄÃ£ cáº­p nháº­t thÃ´ng tin phÃ¡p lÃ½" });
    } catch (error: any) {
      console.error("Lỗi update employee legal:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
  },
);

// GET /api/contracts/:MA_NV  -  Lấy chi tiết hợp đồng của 1 nhân viên
router.get(
  "/:MA_NV",
  withUserConnection,
  checkMaNVParamOwnershipOrDirectorAdmin,
  async (req: Request, res: Response) => {
    try {
      const { MA_NV } = req.params;
      const data = await contractRepository.getContracts(MA_NV);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Lỗi get contract detail:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
  },
);

export default router;

