import { Request, Response } from "express";
import { appPool } from "../config/db";

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const MA_NV = req.user?.userInfo?.MA_NV || req.user?.MA_NV;
    if (!MA_NV) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await appPool.request()
      .input("MaNV", MA_NV)
      .execute("sp_getNotifications");
      
    res.json(result.recordset);
  } catch (error: any) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const MA_NV = req.user?.userInfo?.MA_NV || req.user?.MA_NV;
    const { id } = req.params;
    
    if (!MA_NV) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const result = await appPool.request()
      .input("MaTB", Number(id))
      .input("MaNV", MA_NV)
      .execute("sp_markNotificationRead");
      
    res.json({ message: "Đã đánh dấu đọc", notification: result.recordset[0] });
  } catch (error: any) {
    console.error("Mark read error:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

// Helper function for backend to create notification programmatically
export const createNotification = async (MA_NV: string, tieuDe: string, noiDung: string, loai: string, link: string = "") => {
  try {
    const result = await appPool.request()
      .input("MaNV", MA_NV)
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
