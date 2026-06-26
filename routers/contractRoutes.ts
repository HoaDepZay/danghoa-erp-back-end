import express, { Request, Response } from "express";
import contractRepository from "../repositories/contractRepository";
import { withUserConnection } from "../middleware/authMiddleware";

const router = express.Router();

// GET /api/contracts?MA_NV=xxx  -  Láº¥y lá»‹ch sá»­ há»£p Ä‘á»“ng cá»§a má»™t nhÃ¢n viÃªn
router.get("/", withUserConnection, async (req: Request, res: Response) => {
  try {
    const { MA_NV } = req.query; // ðŸŒŸ Giá»¯ nguyÃªn chuáº©n hÃ³a
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

// GET /api/contracts/expiring?SO_NGAY=30  -  Láº¥y DS há»£p Ä‘á»“ng sáº¯p háº¿t háº¡n
router.get(
  "/expiring",
  withUserConnection,
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

// POST /api/contracts  -  Táº¡o há»£p Ä‘á»“ng má»›i cho nhÃ¢n viÃªn
router.post("/", withUserConnection, async (req: Request, res: Response) => {
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
    } = req.body;

    if (!MA_NV || !LOAI_HOP_DONG || !TU_NGAY || !LUONG_CO_BAN) {
      return res
        .status(400)
        .json({ success: false, message: "Thiáº¿u dá»¯ liá»‡u báº¯t buá»™c" });
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
      message: "ÄÃ£ táº¡o há»£p Ä‘á»“ng thÃ nh cÃ´ng",
      MA_HD: result.MA_HD,
    });
  } catch (error: any) {
    console.error("Lá»—i create contract:", error);
    res
      .status(500)
      .json({ success: false, message: "Lá»—i mÃ¡y chá»§", error: error.message });
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
      console.error("Lá»—i update employee legal:", error);
      res
        .status(500)
        .json({ success: false, message: "Lá»—i mÃ¡y chá»§", error: error.message });
    }
  },
);

export default router;

