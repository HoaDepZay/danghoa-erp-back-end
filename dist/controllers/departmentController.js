"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const departmentService_1 = __importDefault(require("../services/departmentService"));
const departmentController = {
    getAllDepartments: async (req, res) => {
        try {
            const result = await departmentService_1.default.getAllDepartments();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    getDepartmentById: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await departmentService_1.default.getDepartmentWithEmployees(id);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(404).json({ success: false, message: error.message });
        }
    },
    createDepartment: async (req, res) => {
        try {
            const result = await departmentService_1.default.createDepartment(req.body);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    updateDepartment: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await departmentService_1.default.updateDepartment(id, req.body);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    deleteDepartment: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await departmentService_1.default.deleteDepartment(id);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    getEmployeeDepartments: async (req, res) => {
        try {
            const { id } = req.params; // maNv
            const requesterMaNv = req.user?.userInfo?.manv;
            const requesterRole = req.user?.userInfo?.role;
            const result = await departmentService_1.default.getEmployeeDepartments(id, requesterMaNv, requesterRole);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(403).json({ success: false, message: error.message });
        }
    },
    getEmployeeDepartmentWithMembers: async (req, res) => {
        try {
            const { id } = req.params; // maNv
            const requesterMaNv = req.user?.userInfo?.manv;
            const requesterRole = req.user?.userInfo?.role;
            const result = await departmentService_1.default.getEmployeeDepartmentWithMembers(id, requesterMaNv, requesterRole);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(403).json({ success: false, message: error.message });
        }
    },
};
exports.default = departmentController;
