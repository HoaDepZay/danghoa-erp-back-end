import express from "express";
const router = express.Router();
import withUserConnection from "../middleware/authMiddleware";
import { requireAdmin, requireDirectorOrAdmin, requireDepartmentHead } from "../middleware/authorizationMiddleware";
import employeeController from "../controllers/employeeController";
import { appPool, sql as globalSql } from "../config/db";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

// âš ï¸ ROUTES SPECIFIC PHáº¢I TRÆ¯á»šC GENERIC ROUTES (/:id)

// 1ï¸âƒ£ SPECIFIC ROUTES (profile, my-projects, coworkers, update-info)
// GET /api/employees/:id - Xem profile/chi tiáº¿t nhÃ¢n viÃªn (thay tháº¿ cho /profile/:MA_NV cÅ©)
// (Defined below in generic routes section)

// GET /api/employees/my-projects/:MA_NV - Xem dá»± Ã¡n cá»§a tÃ´i (dÃ¹ng Stored Procedure)
router.get("/my-projects/:MA_NV", withUserConnection, async (req: any, res: any) => {
  const { MA_NV } = req.params;
  try {
    const result = await appPool.request()
      .input("MANV", globalSql.VarChar(20), MA_NV)
      .execute("sp_getEmployeeProjects");
    res.json(result.recordset);
  } catch (err: any) {
    return res.status(500).json({ error: "Lá»—i truy váº¥n hoáº·c quyá»n háº¡n!" });
  }
});

// GET /api/employees/coworkers/:MA_PHG - Xem Ä‘á»“ng nghiá»‡p cÃ¹ng phÃ²ng (dÃ¹ng Stored Procedure)
router.get("/coworkers/:MA_PHG", withUserConnection, async (req: any, res: any) => {
  const MA_PHG = Number(req.params.MA_PHG);
  try {
    const result = await appPool.request()
      .input("MAPHG", globalSql.Int, MA_PHG)
      .execute("sp_getEmployeesByDepartment");
    res.json(result.recordset);
  } catch (err: any) {
    return res.status(403).json({ error: "Access Denied" });
  }
});

// PUT /api/employees/update-info - Cáº­p nháº­t thÃ´ng tin cÃ¡ nhÃ¢n (dÃ¹ng Stored Procedure)
router.put("/update-info", async (req: any, res: any) => {
  try {
    const { MA_NV, EMAIL } = req.body;
    await appPool.request()
      .input("MANV", globalSql.VarChar(20), MA_NV)
      .input("EMAIL", globalSql.NVarChar(100), EMAIL)
      .execute("sp_updateEmployee");
    res.json({ message: "Cáº­p nháº­t thÃ nh cÃ´ng" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2ï¸âƒ£ GENERIC ROUTES (list, detail, create, update, delete)
// GET /api/employees - Láº¥y danh sÃ¡ch nhÃ¢n viÃªn
router.get("/", withUserConnection, employeeController.getAllEmployees);

// POST /api/employees - ThÃªm nhÃ¢n viÃªn má»›i (Admin)
router.post(
  "/",
  withUserConnection,
  requireAdmin,
  employeeController.createEmployee,
);

// GET /api/employees/:id - Xem chi tiáº¿t 1 nhÃ¢n viÃªn
router.get("/:id", withUserConnection, employeeController.getEmployeeById);

// PUT /api/employees/:id - Cáº­p nháº­t thÃ´ng tin nhÃ¢n viÃªn (Admin)
router.put(
  "/:id",
  withUserConnection,
  requireAdmin,
  employeeController.updateEmployee,
);

// POST /api/employees/:id/avatar - Upload Avatar
router.post(
  "/:id/avatar",
  withUserConnection,
  upload.single("avatar"),
  employeeController.uploadAvatar
);

// DELETE /api/employees/:id - XÃ³a/KhÃ³a nhÃ¢n viÃªn (Admin)
router.delete(
  "/:id",
  withUserConnection,
  requireAdmin,
  employeeController.deleteEmployee,
);

export default router;

