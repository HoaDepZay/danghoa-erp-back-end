import express, { Request, Response } from "express";
import { appPool, sql } from "../config/db";
import { withUserConnection } from "../middleware/authMiddleware";

const router = express.Router();

// Láº¥y danh sÃ¡ch cÃ¡c ca lÃ m viá»‡c
router.get("/", withUserConnection, async (req: Request, res: Response) => {
  try {
    const result = await appPool.request().execute("sp_getShifts");
    res.json({ success: true, data: result.recordset });
  } catch (error: any) {
    console.error("Lá»—i get shifts:", error);
    res.status(500).json({ success: false, message: "Lá»—i mÃ¡y chá»§", error: error.message });
  }
});

// Láº¥y danh sÃ¡ch lá»‹ch phÃ¢n cÃ´ng ca
router.get("/assignments", withUserConnection, async (req: Request, res: Response) => {
  try {
    const { MA_NV, tuNgay, denNgay } = req.query;
    const request = appPool.request();
    if (MA_NV) request.input("MaNV", sql.VarChar(20), MA_NV);
    if (tuNgay) request.input("TuNgay", sql.Date, tuNgay);
    if (denNgay) request.input("DenNgay", sql.Date, denNgay);

    const result = await request.execute("sp_getShiftAssignments");
    res.json({ success: true, data: result.recordset });
  } catch (error: any) {
    console.error("Lá»—i get shift assignments:", error);
    res.status(500).json({ success: false, message: "Lá»—i mÃ¡y chá»§", error: error.message });
  }
});

// ThÃªm hoáº·c cáº­p nháº­t phÃ¢n cÃ´ng ca
router.post("/assignments", withUserConnection, async (req: Request, res: Response) => {
  try {
    const { MA_NV, maCa, ngayLamViec, TRANG_THAI } = req.body;
    if (!MA_NV || !maCa || !ngayLamViec) {
      return res.status(400).json({ success: false, message: "Thiáº¿u dá»¯ liá»‡u" });
    }

    const request = appPool.request()
      .input("MaNV", sql.VarChar(20), MA_NV)
      .input("MaCa", sql.Int, maCa)
      .input("NgayLamViec", sql.Date, ngayLamViec);
      
    if (TRANG_THAI) {
      request.input("TrangThai", sql.NVarChar(50), TRANG_THAI);
    }

    await request.execute("sp_createShiftAssignment");
    res.json({ success: true, message: "ÄÃ£ phÃ¢n cÃ´ng ca lÃ m viá»‡c" });
  } catch (error: any) {
    console.error("Lá»—i create shift assignment:", error);
    res.status(500).json({ success: false, message: "Lá»—i mÃ¡y chá»§", error: error.message });
  }
});

// XÃ³a phÃ¢n cÃ´ng ca
router.delete("/assignments/:id", withUserConnection, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await appPool.request()
      .input("ID", sql.Int, id)
      .execute("sp_deleteShiftAssignment");
    res.json({ success: true, message: "ÄÃ£ xÃ³a ca lÃ m viá»‡c" });
  } catch (error: any) {
    console.error("Lá»—i delete shift assignment:", error);
    res.status(500).json({ success: false, message: "Lá»—i mÃ¡y chá»§", error: error.message });
  }
});

export default router;

