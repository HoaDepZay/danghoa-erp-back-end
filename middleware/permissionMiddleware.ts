import { Request, Response, NextFunction } from "express";
import { appPool, sql } from "../config/db";

// Extend Request interface to include permissions array
declare global {
  namespace Express {
    interface Request {
      permissions?: string[];
    }
  }
}

export const loadPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const MA_NV = req.user?.userInfo?.MA_NV || req.user?.MA_NV;
    if (!MA_NV) {
      req.permissions = [];
      return next();
    }

    // Query các quyền hạn thực tế từ database
    const result = await appPool.request()
      .input("MaNV", sql.VarChar(20), MA_NV)
      .query(`
        SELECT MaQuyen 
        FROM [dbo].[
        ] 
        WHERE MaNV = @MaNV
      `);

    req.permissions = result.recordset.map((row: any) => row.MaQuyen);
    next();
  } catch (error) {
    console.error("❌ Error loading permissions middleware:", error);
    req.permissions = [];
    next();
  }
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.permissions || !req.permissions.includes(permission)) {
      res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện hành động này: ${permission}`
      });
      return;
    }
    next();
  };
};
