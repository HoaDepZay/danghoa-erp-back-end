"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const departmentController_1 = __importDefault(require("../controllers/departmentController"));
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const authorizationMiddleware_1 = require("../middleware/authorizationMiddleware");
const router = express_1.default.Router();
// Lấy chi tiết phòng ban của nhân viên chỉ định (kèm danh sách nhân viên)
router.get("/employee/:id/detail", authMiddleware_1.default, departmentController_1.default.getEmployeeDepartmentWithMembers);
// Lấy danh sách phòng ban của nhân viên chỉ định (không cần admin)
router.get("/employee/:id", authMiddleware_1.default, departmentController_1.default.getEmployeeDepartments);
// Lấy danh sách phòng ban (admin)
router.get("/", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, departmentController_1.default.getAllDepartments);
// Lấy chi tiết phòng ban theo ID (admin)
router.get("/:id", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, departmentController_1.default.getDepartmentById);
// Thêm mới phòng ban
router.post("/", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, departmentController_1.default.createDepartment);
// Cập nhật phòng ban
router.put("/:id", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, departmentController_1.default.updateDepartment);
// Xóa phòng ban
router.delete("/:id", authMiddleware_1.default, authorizationMiddleware_1.requireAdmin, departmentController_1.default.deleteDepartment);
exports.default = router;
