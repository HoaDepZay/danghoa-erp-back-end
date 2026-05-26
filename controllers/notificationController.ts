import { Request, Response } from "express";
import { appPool } from "../config/db";

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const maNv = req.user?.userInfo?.manv || req.user?.manv;
    if (!maNv) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await appPool.request()
      .input("MaNV", maNv)
      .execute("sp_getNotifications");
      
    res.json(result.recordset);
  } catch (error: any) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const maNv = req.user?.userInfo?.manv || req.user?.manv;
    const { id } = req.params;
    
    if (!maNv) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await appPool.request()
      .input("MaTB", Number(id))
      .input("MaNV", maNv)
      .execute("sp_markNotificationRead");
      
    res.json({ message: "Đã đánh dấu đọc", notification: result.recordset[0] });
  } catch (error: any) {
    console.error("Mark read error:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// Helper function for backend to create notification programmatically
export const createNotification = async (maNv: string, tieuDe: string, noiDung: string, loai: string, link: string = "") => {
  try {
    const result = await appPool.request()
      .input("MaNV", maNv)
      .input("TieuDe", tieuDe)
      .input("NoiDung", noiDung)
      .input("Loai", loai)
      .input("Link", link)
      .execute("sp_createNotification");
    return result.recordset[0];
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};
