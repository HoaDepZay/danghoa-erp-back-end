import express from "express";
const router = express.Router();
import sql from "msnodesqlv8";
import withUserConnection from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/authorizationMiddleware";
import employeeController from "../controllers/employeeController";
import { appPool, sql as globalSql } from "../config/db";

// ⚠️ ROUTES SPECIFIC PHẢI TRƯỚC GENERIC ROUTES (/:id)

// 1️⃣ SPECIFIC ROUTES (profile, my-projects, coworkers, update-info)
// GET /api/employees/:id - Xem profile/chi tiết nhân viên (thay thế cho /profile/:manv cũ)
// (Defined below in generic routes section)

// GET /api/employees/my-projects/:manv - Xem dự án của tôi (dùng dynamic connection)
router.get("/my-projects/:manv", withUserConnection, (req, res) => {
  const query = `SELECT da.TENDA, pc.THOIGIAN FROM PHANCONG pc JOIN DUAN da ON pc.MADA = da.MADA WHERE pc.MANV = ?`;
  sql.query(req.userConnectionString, query, [req.params.manv], (err, rows) => {
    if (err)
      return res.status(500).json({ error: "Lỗi truy vấn hoặc quyền hạn!" });
    res.json(rows);
  });
});

// GET /api/employees/coworkers/:maphg - Xem đồng nghiệp cùng phòng (dùng dynamic connection)
router.get("/coworkers/:maphg", withUserConnection, (req, res) => {
  sql.query(
    req.userConnectionString,
    "SELECT MANV, HOTEN, CHUCVU FROM NHAN_VIEN WHERE MAPHG = ?",
    [req.params.maphg],
    (err, rows) => {
      if (err) return res.status(403).json({ error: "Access Denied" });
      res.json(rows);
    },
  );
});

// PUT /api/employees/update-info - Cập nhật thông tin cá nhân (dùng SA connection từ global pool)
router.put("/update-info", async (req, res) => {
  try {
    const { manv, email } = req.body;
    const request = appPool.request();
    await request
      .input("MaNV", globalSql.NVarChar, manv)
      .input("Email", globalSql.NVarChar, email)
      .query("UPDATE NHAN_VIEN SET EMAIL = @Email WHERE MANV = @MaNV");
    res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2️⃣ GENERIC ROUTES (list, detail, create, update, delete)
// GET /api/employees - Lấy danh sách nhân viên
router.get("/", withUserConnection, employeeController.getAllEmployees);

// POST /api/employees - Thêm nhân viên mới (Admin)
router.post(
  "/",
  withUserConnection,
  requireAdmin,
  employeeController.createEmployee,
);

// GET /api/employees/:id - Xem chi tiết 1 nhân viên
router.get("/:id", withUserConnection, employeeController.getEmployeeById);

// PUT /api/employees/:id - Cập nhật thông tin nhân viên (Admin)
router.put(
  "/:id",
  withUserConnection,
  requireAdmin,
  employeeController.updateEmployee,
);

// DELETE /api/employees/:id - Xóa/Khóa nhân viên (Admin)
router.delete(
  "/:id",
  withUserConnection,
  requireAdmin,
  employeeController.deleteEmployee,
);

export default router;
