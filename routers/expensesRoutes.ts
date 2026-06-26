import express from "express";
import { withUserConnection } from "../middleware/authMiddleware";
import * as expensesController from "../controllers/expensesController";

const router = express.Router();

// GET /api/expenses - Xem danh sách chi tiêu (mở cho nhân viên đã login)
router.get("/", withUserConnection, expensesController.getAllExpenses);
router.get("/:id", withUserConnection, expensesController.getExpense);

// POST /api/expenses - Tạo chi tiêu (Yêu cầu quyền Kế toán ở cấp DB)
router.post("/", withUserConnection, expensesController.createExpense);

// PUT /api/expenses/:id - Cập nhật chi tiêu
router.put("/:id", withUserConnection, expensesController.updateExpense);

// DELETE /api/expenses/:id - Xóa chi tiêu
router.delete("/:id", withUserConnection, expensesController.deleteExpense);

export default router;
