import express from "express";
const router = express.Router();
import sql from "msnodesqlv8";
import { appPool, sql as mssql } from "../config/db";
const connectionString = `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASS};TrustServerCertificate=yes;`;
import withUserConnection from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/authorizationMiddleware";
import authController from "../controllers/authController";

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

// 1. Sửa nhân viên (Admin)
router.put("/nhan-vien/edit", withUserConnection, requireAdmin, (req, res) => {
  const { manv, hoten } = req.body;
  const maphg = req.body.maphg === null ? null : Number(req.body.maphg);
  const luong = Number(req.body.luong || 0);
  const chucvu = req.body.chucvu || "Nhân viên";

  if (!manv) return res.status(400).json({ error: "Thiếu mã nhân viên!" });

  const query =
    "UPDATE NHAN_VIEN SET HOTEN = ?, MAPHG = ?, LUONG = ?, CHUCVU = ? WHERE MANV = ?";
  sql.query(
    connectionString,
    query,
    [hoten, maphg, luong, chucvu, manv],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Cập nhật nhân sự thành công!" });
    },
  );
});

// 2. Xóa nhân viên (Admin)
router.delete(
  "/nhan-vien/:manv",
  withUserConnection,
  requireAdmin,
  (req, res) => {
    sql.query(
      connectionString,
      "DELETE FROM TAIKHOAN WHERE MANV = ?",
      [req.params.manv],
      () => {
        sql.query(
          connectionString,
          "DELETE FROM NHAN_VIEN WHERE MANV = ?",
          [req.params.manv],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Deleted" });
          },
        );
      },
    );
  },
);

// --- QUẢN LÝ PHÒNG BAN ---

// 3. Lấy danh sách phòng ban (Admin)
router.get("/phong-ban", withUserConnection, requireAdmin, (req, res) => {
  sql.query(
    req.userConnectionString,
    "SELECT MAPHG, TENPB, NG_THANHLAP FROM PHONG_BAN",
    (err, rows) => {
      if (err)
        return res.status(403).json({ error: "Bạn không có quyền Admin" });
      res.json(rows);
    },
  );
});

// 4. Tạo phòng ban (Admin)
router.post(
  "/phong-ban/create",
  withUserConnection,
  requireAdmin,
  (req, res) => {
    const { tenpb } = req.body;
    if (!tenpb)
      return res.status(400).json({ error: "Vui lòng nhập tên phòng ban!" });

    const maPhongBan = Math.floor(1000 + Math.random() * 9000); // generateNumericCode inline
    const query =
      "INSERT INTO PHONG_BAN (MAPHG, TENPB, NG_THANHLAP) VALUES (?, ?, GETDATE())";

    sql.query(connectionString, query, [maPhongBan, tenpb], (err) => {
      if (err) {
        if (err.message.includes("PRIMARY KEY"))
          return res.status(500).json({ error: "Trùng ID, thử lại!" });
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        success: true,
        message: `Tạo phòng ${tenpb} thành công!`,
        id: maPhongBan,
      });
    });
  },
);

// 5. Sửa phòng ban (Admin)
router.put(
  "/phong-ban/edit",
  withUserConnection,
  requireAdmin,
  async (req, res) => {
    try {
      const maphg = Number(req.body.maphg);
      const tenpb = req.body.tenpb;
      const matruongphg = req.body.matruongphg;

      console.log("[ADMIN][UPDATE_DEPARTMENT] Incoming body:", req.body);
      console.log("[ADMIN][UPDATE_DEPARTMENT] Parsed params:", {
        maphg,
        tenpb,
        matruongphg,
        maphgType: typeof maphg,
      });

      if (!maphg) {
        console.warn(
          "[ADMIN][UPDATE_DEPARTMENT] Invalid maphg:",
          req.body.maphg,
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
      request.input("MaPhg", mssql.Int, maphg);
      request.input("TenPb", mssql.NVarChar(100), tenpb ?? null);
      request.input("MaTruongPhg", mssql.VarChar(10), matruongphg ?? null);
      request.output("Status", mssql.Int);

      console.log("[ADMIN][UPDATE_DEPARTMENT] Executing sp_updateDepartment", {
        MaPhg: maphg,
        TenPb: tenpb ?? null,
        MaTruongPhg: matruongphg ?? null,
      });

      const executionResult = await request.execute("sp_updateDepartment");
      const status = executionResult.output?.Status;
      console.log("[ADMIN][UPDATE_DEPARTMENT] SP Status:", status);

      if (status !== 1) {
        const deptCheck = await appPool
          .request()
          .input("MaPhg", mssql.Int, maphg)
          .query(
            "SELECT TOP 1 MAPHG, TENPB, MaTruongPhg FROM PHONG_BAN WHERE MAPHG = @MaPhg",
          );

        const managerCheck = matruongphg
          ? await appPool
              .request()
              .input("MaNv", mssql.VarChar(20), matruongphg)
              .query(
                "SELECT TOP 1 MANV, HOTEN, MAPHG FROM NHAN_VIEN WHERE MANV = @MaNv",
              )
          : { recordset: [] };

        const currentDepartment = deptCheck.recordset?.[0] || null;
        const managerExists = managerCheck.recordset?.length > 0;

        console.warn(
          "[ADMIN][UPDATE_DEPARTMENT] Update failed with status != 1",
          {
            status,
            maphg,
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
              maphg,
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
        maphg,
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

// 6. Xóa phòng ban (Admin)
router.delete(
  "/phong-ban/:maphg",
  withUserConnection,
  requireAdmin,
  (req, res) => {
    const { maphg } = req.params;
    sql.query(
      connectionString,
      "SELECT COUNT(*) as count FROM NHAN_VIEN WHERE MAPHG = ?",
      [maphg],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rows[0].count > 0)
          return res
            .status(400)
            .json({ error: "Không thể xóa phòng có nhân viên!" });

        sql.query(
          connectionString,
          "DELETE FROM PHONG_BAN WHERE MAPHG = ?",
          [maphg],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Xóa thành công!" });
          },
        );
      },
    );
  },
);

export default router;
