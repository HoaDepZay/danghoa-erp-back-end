"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectController_1 = __importDefault(require("../controllers/projectController"));
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const authorizationMiddleware_1 = require("../middleware/authorizationMiddleware");
const router = express_1.default.Router();
// Nhân viên xem danh sách dự án mình tham gia (kèm đầy đủ thành viên của từng dự án)
router.get("/my-projects/full", authMiddleware_1.default, projectController_1.default.getMyJoinedProjectsWithMembers);
// Lấy danh sách dự án
router.get("/", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, projectController_1.default.getAllProjects);
// Task theo dự án (chỉ nhân viên thuộc dự án mới truy cập được)
router.get("/:id/tasks", authMiddleware_1.default, projectController_1.default.getProjectTasksForMember);
router.post("/:id/tasks", authMiddleware_1.default, projectController_1.default.createTaskForMember);
router.put("/:id/tasks/:taskId", authMiddleware_1.default, projectController_1.default.updateTaskForMember);
// Lấy chi tiết dự án & thành viên (nhân viên tham gia dự án hoặc admin)
router.get("/:id", authMiddleware_1.default, projectController_1.default.getProjectById);
// Thêm dự án mới
router.post("/", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, projectController_1.default.createProject);
// Xem dự án của 1 nhân viên
router.get("/employee/:id", authMiddleware_1.default, projectController_1.default.getEmployeeProjects);
// Cập nhật dự án
router.put("/:id", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, projectController_1.default.updateProject);
// Xóa dự án
router.delete("/:id", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, projectController_1.default.deleteProject);
// Thành viên dự án
router.post("/:id/members", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, projectController_1.default.addProjectMember);
router.delete("/:id/members/:employeeId", authMiddleware_1.default, projectController_1.default.removeProjectMember);
exports.default = router;
