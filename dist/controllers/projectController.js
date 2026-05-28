"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const projectService_1 = __importDefault(require("../services/projectService"));
const notificationController_1 = require("./notificationController");
const server_1 = require("../server");
const normalizeRole = (role) => String(role || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
const projectController = {
    getProjectTasksForMember: async (req, res) => {
        try {
            const { id: maDa } = req.params;
            const requesterMaNv = req.user?.userInfo?.manv;
            const result = await projectService_1.default.getProjectTasksForMember(maDa, requesterMaNv);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(403).json({ success: false, message: error.message });
        }
    },
    createTaskForMember: async (req, res) => {
        try {
            const { id: maDa } = req.params;
            const requesterMaNv = req.user?.userInfo?.manv;
            const result = await projectService_1.default.createTaskForMember(maDa, requesterMaNv, req.body);
            try {
                const notif = await (0, notificationController_1.createNotification)(req.body.manv || requesterMaNv, // Nếu payload có manv thì giao cho manv đó, nếu không thì tự nhận
                "Nhiệm vụ mới", `Bạn vừa được giao một nhiệm vụ mới: ${req.body.tennhiemvu}`, "task_assign", `/projects/${maDa}`);
                if (notif)
                    (0, server_1.emitNotification)(req.body.manv || requesterMaNv, notif);
            }
            catch (e) {
                console.error("Notif task error", e);
            }
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    updateTaskForMember: async (req, res) => {
        try {
            const { id: maDa, taskId } = req.params;
            const requesterMaNv = req.user?.userInfo?.manv;
            const result = await projectService_1.default.updateTaskForMember(maDa, taskId, requesterMaNv, req.body);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    getMyJoinedProjectsWithMembers: async (req, res) => {
        try {
            const requesterMaNv = req.user?.userInfo?.manv;
            const result = await projectService_1.default.getMyJoinedProjectsWithMembers(requesterMaNv);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(403).json({ success: false, message: error.message });
        }
    },
    getAllProjects: async (req, res) => {
        try {
            const result = await projectService_1.default.getAllProjects();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    getProjectById: async (req, res) => {
        try {
            const { id } = req.params;
            const requesterMaNv = req.user?.userInfo?.manv;
            const requesterRole = req.user?.userInfo?.role;
            const result = await projectService_1.default.getProjectById(id, requesterMaNv, requesterRole);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(403).json({ success: false, message: error.message });
        }
    },
    getEmployeeProjects: async (req, res) => {
        try {
            const { id } = req.params; // Lấy employeeId
            const requesterMaNv = String(req.user?.userInfo?.manv || "").trim();
            const requesterRole = req.user?.userInfo?.role;
            const isAdmin = normalizeRole(requesterRole) === "admin";
            if (!isAdmin && requesterMaNv !== String(id || "").trim()) {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền xem danh sách dự án của nhân viên khác.",
                });
            }
            const result = await projectService_1.default.getEmployeeProjects(id);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(404).json({ success: false, message: error.message });
        }
    },
    createProject: async (req, res) => {
        try {
            const result = await projectService_1.default.createProject(req.body);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    updateProject: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await projectService_1.default.updateProject(id, req.body);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    deleteProject: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await projectService_1.default.deleteProject(id);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    addProjectMember: async (req, res) => {
        try {
            const { id: maDa } = req.params;
            const { manv, vaitroduan } = req.body;
            const result = await projectService_1.default.addProjectMember(maDa, manv, vaitroduan);
            try {
                const notif = await (0, notificationController_1.createNotification)(manv, "Dự án mới", `Bạn đã được thêm vào dự án với vai trò: ${vaitroduan}`, "project_assign", `/projects/${maDa}`);
                if (notif)
                    (0, server_1.emitNotification)(manv, notif);
            }
            catch (e) {
                console.error("Notif project error", e);
            }
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    removeProjectMember: async (req, res) => {
        try {
            const { id: maDa, employeeId: maNv } = req.params;
            const requesterMaNv = req.user?.userInfo?.manv;
            const result = await projectService_1.default.removeProjectMember(maDa, maNv, requesterMaNv);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
};
exports.default = projectController;
