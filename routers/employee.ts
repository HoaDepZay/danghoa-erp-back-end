import express from "express";
const router = express.Router();
import withUserConnection from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/authorizationMiddleware";
import employeeController from "../controllers/employeeController";
import { appPool, sql as globalSql } from "../config/db";

// ⚠️ ROUTES SPECIFIC PHẢI TRƯỚC GENERIC ROUTES (/:id)

// 1️⃣ SPECIFIC ROUTES (profile, my-projects, coworkers, update-info)
// GET /api/employees/:id - Xem profile/chi tiết nhân viên (thay thế cho /profile/:manv cũ)
// (Defined below in generic routes section)

// GET /api/employees/my-projects/:manv - Xem dự án của tôi (dùng Stored Procedure)
router.get("/my-projects/:manv", withUserConnection, async (req: any, res: any) => {
  const { manv } = req.params;
  try {
    const result = await appPool.request()
      .input("MANV", globalSql.VarChar(20), manv)
      .execute("sp_getEmployeeProjects");
    res.json(result.recordset);
  } catch (err: any) {
    return res.status(500).json({ error: "Lỗi truy vấn hoặc quyền hạn!" });
  }
});

// GET /api/employees/coworkers/:maphg - Xem đồng nghiệp cùng phòng (dùng Stored Procedure)
router.get("/coworkers/:maphg", withUserConnection, async (req: any, res: any) => {
  const maphg = Number(req.params.maphg);
  try {
    const result = await appPool.request()
      .input("MAPHG", globalSql.Int, maphg)
      .execute("sp_getEmployeesByDepartment");
    res.json(result.recordset);
  } catch (err: any) {
    return res.status(403).json({ error: "Access Denied" });
  }
});

// PUT /api/employees/update-info - Cập nhật thông tin cá nhân (dùng Stored Procedure)
router.put("/update-info", async (req: any, res: any) => {
  try {
    const { manv, email } = req.body;
    await appPool.request()
      .input("MANV", globalSql.VarChar(20), manv)
      .input("EMAIL", globalSql.NVarChar(100), email)
      .execute("sp_updateEmployee");
    res.json({ message: "Cập nhật thành công" });
  } catch (err: any) {
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
