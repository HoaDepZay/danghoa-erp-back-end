import { Router } from "express";
import { phaseController } from "../../controllers/project/phaseController";
import authMiddleware from "../../middleware/authMiddleware";

const router = Router();

// Quản lý Giai đoạn (theo Dự án)
router.get("/project/:projectId", authMiddleware, phaseController.getPhasesByProject);
router.post("/project/:projectId", authMiddleware, phaseController.createPhase);

// Quản lý Giai đoạn (sửa, xóa, xem)
router.get("/:phaseId", authMiddleware, phaseController.getPhaseById);
router.put("/:phaseId", authMiddleware, phaseController.updatePhase);
router.delete("/:phaseId", authMiddleware, phaseController.deletePhase);

// Phân công Giai đoạn
router.get("/:phaseId/assignments", authMiddleware, phaseController.getPhaseAssignments);
router.post("/:phaseId/assignments", authMiddleware, phaseController.addPhaseAssignment);
router.delete("/:phaseId/assignments/:employeeId", authMiddleware, phaseController.removePhaseAssignment);

// Quản lý Task trong Giai đoạn
router.get("/:phaseId/tasks", authMiddleware, phaseController.getTasksByPhase);
router.post("/:phaseId/tasks", authMiddleware, phaseController.createTask);

router.put("/tasks/:taskId", authMiddleware, phaseController.updateTask);
router.delete("/tasks/:taskId", authMiddleware, phaseController.deleteTask);

export default router;
