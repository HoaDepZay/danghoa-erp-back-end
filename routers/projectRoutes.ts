import express from "express";
import projectController from "../controllers/projectController";
import withUserConnection from "../middleware/authMiddleware";
import { requireAdmin, requireDirectorOrAdmin, requireDepartmentHead, requireProjectCreator } from "../middleware/authorizationMiddleware";

const router = express.Router();

// NhÃ¢n viÃªn xem danh sÃ¡ch dá»± Ã¡n mÃ¬nh tham gia (kÃ¨m Ä‘áº§y Ä‘á»§ thÃ nh viÃªn cá»§a tá»«ng dá»± Ã¡n)
router.get(
  "/my-projects/full",
  withUserConnection,
  projectController.getMyJoinedProjectsWithMembers,
);

// Lấy tất cả danh sách vai trò
router.get(
  "/roles/all",
  withUserConnection,
  projectController.getAllProjectRoles,
);

// Lấy danh sách dự án
router.get(
  "/",
  withUserConnection,
  projectController.getAllProjects,
);

// Task theo dá»± Ã¡n (chá»‰ nhÃ¢n viÃªn thuá»™c dá»± Ã¡n má»›i truy cáº­p Ä‘Æ°á»£c)
router.get(
  "/:id/tasks",
  withUserConnection,
  projectController.getProjectTasksForMember,
);

router.post(
  "/:id/tasks",
  withUserConnection,
  projectController.createTaskForMember,
);

router.put(
  "/:id/tasks/:taskId",
  withUserConnection,
  projectController.updateTaskForMember,
);

// Láº¥y chi tiáº¿t dá»± Ã¡n & thÃ nh viÃªn (nhÃ¢n viÃªn tham gia dá»± Ã¡n hoáº·c admin)
router.get("/:id", withUserConnection, projectController.getProjectById);

// ThÃªm dá»± Ã¡n má»›i
router.post(
  "/",
  withUserConnection,
  requireProjectCreator,
  projectController.createProject,
);

// Xem dá»± Ã¡n cá»§a 1 nhÃ¢n viÃªn
router.get(
  "/employee/:id",
  withUserConnection,
  projectController.getEmployeeProjects,
);

// Cáº­p nháº­t dá»± Ã¡n
router.put(
  "/:id",
  withUserConnection,
  requireProjectCreator,
  projectController.updateProject,
);

// XÃ³a dá»± Ã¡n
router.delete(
  "/:id",
  withUserConnection,
  requireProjectCreator,
  projectController.deleteProject,
);

// ThÃ nh viÃªn dá»± Ã¡n
router.post(
  "/:id/roles",
  withUserConnection,
  projectController.createProjectRole,
);

router.post(
  "/:id/members",
  withUserConnection,
  projectController.addProjectMember,
);
router.delete(
  "/:id/members/:employeeId",
  withUserConnection,
  projectController.removeProjectMember,
);

export default router;

