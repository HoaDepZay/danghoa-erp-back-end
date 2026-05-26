import projectService from "../services/projectService";
import { createNotification } from "./notificationController";
import { emitNotification } from "../server";

const normalizeRole = (role) =>
  String(role || "")
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
      const result = await projectService.getProjectTasksForMember(
        maDa,
        requesterMaNv,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }
  },

  createTaskForMember: async (req, res) => {
    try {
      const { id: maDa } = req.params;
      const requesterMaNv = req.user?.userInfo?.manv;
      const result = await projectService.createTaskForMember(
        maDa,
        requesterMaNv,
        req.body,
      );
      
      try {
        const notif = await createNotification(
          req.body.manv || requesterMaNv, // Nếu payload có manv thì giao cho manv đó, nếu không thì tự nhận
          "Nhiệm vụ mới",
          `Bạn vừa được giao một nhiệm vụ mới: ${req.body.tennhiemvu}`,
          "task_assign",
          `/projects/${maDa}`
        );
        if (notif) emitNotification(req.body.manv || requesterMaNv, notif);
      } catch (e) {
        console.error("Notif task error", e);
      }
      
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  updateTaskForMember: async (req, res) => {
    try {
      const { id: maDa, taskId } = req.params;
      const requesterMaNv = req.user?.userInfo?.manv;
      const result = await projectService.updateTaskForMember(
        maDa,
        taskId,
        requesterMaNv,
        req.body,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  getMyJoinedProjectsWithMembers: async (req, res) => {
    try {
      const requesterMaNv = req.user?.userInfo?.manv;
      const result =
        await projectService.getMyJoinedProjectsWithMembers(requesterMaNv);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }
  },

  getAllProjects: async (req, res) => {
    try {
      const result = await projectService.getAllProjects();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getProjectById: async (req, res) => {
    try {
      const { id } = req.params;
      const requesterMaNv = req.user?.userInfo?.manv;
      const requesterRole = req.user?.userInfo?.role;
      const result = await projectService.getProjectById(
        id,
        requesterMaNv,
        requesterRole,
      );
      return res.status(200).json(result);
    } catch (error) {
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

      const result = await projectService.getEmployeeProjects(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  },

  createProject: async (req, res) => {
    try {
      const result = await projectService.createProject(req.body);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  updateProject: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await projectService.updateProject(id, req.body);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  deleteProject: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await projectService.deleteProject(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  addProjectMember: async (req, res) => {
    try {
      const { id: maDa } = req.params;
      const { manv, vaitroduan } = req.body;
      const result = await projectService.addProjectMember(
        maDa,
        manv,
        vaitroduan,
      );
      
      try {
        const notif = await createNotification(
          manv,
          "Dự án mới",
          `Bạn đã được thêm vào dự án với vai trò: ${vaitroduan}`,
          "project_assign",
          `/projects/${maDa}`
        );
        if (notif) emitNotification(manv, notif);
      } catch (e) {
        console.error("Notif project error", e);
      }

      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  removeProjectMember: async (req, res) => {
    try {
      const { id: maDa, employeeId: maNv } = req.params;
      const requesterMaNv = req.user?.userInfo?.manv;
      const result = await projectService.removeProjectMember(
        maDa,
        maNv,
        requesterMaNv,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },
};

export default projectController;
