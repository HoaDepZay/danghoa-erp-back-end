import express from "express";
const router = express.Router();
import { appPool, sql as mssql } from "../config/db";
import withUserConnection from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/authorizationMiddleware";
import authController from "../controllers/authController";
import { keysToCamelCase } from "../utils/camelCaseHelper";

// --- QUẢN LÝ NHÂN VIÊN ---

// Danh sách hồ sơ đã xác thực OTP, chờ admin duyệt
router.get(
  "/onboarding/pending",
  withUserConnection,
  requireAdmin,
  authController.getPendingApprovals,
);

// Admin duyệt hồ sơ đăng ký và cấp thông tin nhân viên
router.post(
  "/onboarding/accept",
  withUserConnection,
  requireAdmin,
  authController.acceptPendingRegistration,
);

// Admin từ chối hồ sơ đăng ký
router.post(
  "/onboarding/reject",
  withUserConnection,
  requireAdmin,
  authController.rejectPendingRegistration,
);

// 1. Sửa nhân viên (Admin) - Đã chuyển sang gọi Stored Procedure: sp_updateEmployee
router.put("/nhan-vien/edit", withUserConnection, requireAdmin, async (req: any, res: any) => {
  const { MA_NV, HO_TEN, CHUC_VU } = req.body;
  const MA_PHG = req.body.MA_PHG === null ? null : Number(req.body.MA_PHG);
  const LUONG = Number(req.body.LUONG || 0);

  if (!MA_NV) return res.status(400).json({ error: "Thiếu mã nhân viên!" });

  try {
    await appPool.request()
      .input("MANV", mssql.VarChar(20), MA_NV)
      .input("HOTEN", mssql.NVarChar(200), HO_TEN || null)
      .input("CHUCVU", mssql.NVarChar(100), CHUC_VU || null)
      .input("LUONG", mssql.Decimal(18, 2), LUONG)
      .input("MAPHG", mssql.Int, MA_PHG)
      .execute("sp_updateEmployee");
    
    return res.json({ success: true, message: "Cập nhật nhân sự thành công!" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Xóa nhân viên (Admin) - Đã chuyển sang gọi Stored Procedure: sp_deleteEmployeeFull
router.delete(
  "/nhan-vien/:MA_NV",
  withUserConnection,
  requireAdmin,
  async (req: any, res: any) => {
    const { MA_NV } = req.params;
    try {
      await appPool.request()
        .input("MANV", mssql.VarChar(20), MA_NV)
        .execute("sp_deleteEmployeeFull");

      return res.json({ success: true, message: "Xóa nhân viên thành công!" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
);

// --- QUẢN LÝ PHÒNG BAN ---

// 3. Lấy danh sách phòng ban (Admin) - Đã chuyển sang gọi Stored Procedure: sp_getAllDepartments
router.get("/phong-ban", withUserConnection, requireAdmin, async (req: any, res: any) => {
  try {
    const result = await appPool.request().execute("sp_getAllDepartments");
    return res.json(result.recordset);
  } catch (err: any) {
    return res.status(403).json({ error: "Lỗi truy xuất hoặc bạn không có quyền Admin" });
  }
});

// 4. Tạo phòng ban (Admin) - Đã chuyển sang gọi Stored Procedure: sp_createDepartment
router.post(
  "/phong-ban/create",
  withUserConnection,
  requireAdmin,
  async (req: any, res: any) => {
    const { tenpb } = req.body;
    if (!tenpb)
      return res.status(400).json({ error: "Vui lòng nhập tên phòng ban!" });

    const maPhongBan = Math.floor(1000 + Math.random() * 9000);
    try {
      await appPool.request()
        .input("MAPHG", mssql.Int, maPhongBan)
        .input("TENPB", mssql.NVarChar(100), tenpb)
        .execute("sp_createDepartment");

      return res.status(201).json({
        success: true,
        message: `Tạo phòng ${tenpb} thành công!`,
        id: maPhongBan,
      });
    } catch (err: any) {
      if (err.message.includes("PRIMARY KEY"))
        return res.status(500).json({ error: "Trùng ID, thử lại!" });
      return res.status(500).json({ error: err.message });
    }
  },
);

// 5. Sửa phòng ban (Admin) - Đã có sẵn gọi Stored Procedure: sp_updateDepartment
router.put(
  "/phong-ban/edit",
  withUserConnection,
  requireAdmin,
  async (req: any, res: any) => {
    try {
      const MA_PHG = Number(req.body.MA_PHG);
      const tenpb = req.body.tenpb;
      const matruongphg = req.body.matruongphg;

      console.log("[ADMIN][UPDATE_DEPARTMENT] Incoming body:", req.body);
      console.log("[ADMIN][UPDATE_DEPARTMENT] Parsed params:", {
        MA_PHG,
        tenpb,
        matruongphg,
        maphgType: typeof MA_PHG,
      });

      if (!MA_PHG) {
        console.warn(
          "[ADMIN][UPDATE_DEPARTMENT] Invalid MA_PHG:",
          req.body.MA_PHG,
        );
        return res.status(400).json({ error: "Thiếu mã phòng ban!" });
      }

      if (tenpb === undefined && matruongphg === undefined) {
        console.warn(
          "[ADMIN][UPDATE_DEPARTMENT] Missing update fields tenpb/matruongphg",
        );
        return res.status(400).json({
          error: "Thiếu dữ liệu cập nhật! Cần tenpb hoặc matruongphg.",
        });
      }

      const request = appPool.request();
      request.input("MaPhg", mssql.Int, MA_PHG);
      request.input("TenPb", mssql.NVarChar(100), tenpb ?? null);
      request.input("MaTruongPhg", mssql.VarChar(10), matruongphg ?? null);
      request.output("Status", mssql.Int);

      console.log("[ADMIN][UPDATE_DEPARTMENT] Executing sp_updateDepartment", {
        MaPhg: MA_PHG,
        TenPb: tenpb ?? null,
        MaTruongPhg: matruongphg ?? null,
      });

      const executionResult = await request.execute("sp_updateDepartment");
      const status = executionResult.output?.Status;
      console.log("[ADMIN][UPDATE_DEPARTMENT] SP Status:", status);

      if (status !== 1) {
        const deptCheck = await appPool
          .request()
          .input("MAPHG", mssql.Int, MA_PHG)
          .execute("sp_getDepartmentById");

        const managerCheck = matruongphg
          ? await appPool
              .request()
              .input("MANV", mssql.VarChar(20), matruongphg)
              .execute("sp_getEmployeeById")
          : { recordset: [] };

        const currentDepartment = deptCheck.recordset?.[0] || null;
        const managerExists = managerCheck.recordset?.length > 0;

        console.warn(
          "[ADMIN][UPDATE_DEPARTMENT] Update failed with status != 1",
          {
            status,
            MA_PHG,
            tenpb,
            matruongphg,
          },
        );
        return res.status(400).json({
          success: false,
          message:
            "Cập nhật thất bại. Kiểm tra mã phòng ban hoặc dữ liệu đầu vào.",
          debug: {
            spStatus: status,
            requested: {
              MA_PHG,
              tenpb: tenpb ?? null,
              matruongphg: matruongphg ?? null,
            },
            departmentExists: !!currentDepartment,
            currentDepartment,
            managerExists,
          },
        });
      }

      console.log("[ADMIN][UPDATE_DEPARTMENT] Update success", {
        MA_PHG,
        status,
      });
      return res.json({ success: true, message: "Cập nhật thành công!" });
    } catch (err: any) {
      console.error("[ADMIN][UPDATE_DEPARTMENT] Exception:", {
        message: err?.message,
        stack: err?.stack,
      });
      return res.status(500).json({ error: err?.message || "Lỗi hệ thống" });
    }
  },
);

// 6. Xóa phòng ban (Admin) - Đã chuyển sang gọi Stored Procedure: sp_deleteDepartment
router.delete(
  "/phong-ban/:MA_PHG",
  withUserConnection,
  requireAdmin,
  async (req: any, res: any) => {
    const { MA_PHG } = req.params;
    try {
      const checkRows = await appPool.request()
        .input("MAPHG", mssql.Int, MA_PHG)
        .execute("sp_getEmployeesByDepartment");

      if (checkRows.recordset.length > 0) {
        return res.status(400).json({ error: "Không thể xóa phòng có nhân viên!" });
      }

      await appPool.request()
        .input("MAPHG", mssql.Int, MA_PHG)
        .execute("sp_deleteDepartment");

      return res.json({ success: true, message: "Xóa phòng ban thành công!" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },
);

export default router;
