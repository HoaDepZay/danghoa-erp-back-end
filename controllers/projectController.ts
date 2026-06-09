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
      const { id: MA_DA } = req.params;
      const requesterMaNv = req.user?.userInfo?.MA_NV;
      const result = await projectService.getProjectTasksForMember(
        MA_DA,
        requesterMaNv,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }
  },

  createTaskForMember: async (req, res) => {
    try {
      const { id: MA_DA } = req.params;
      const requesterMaNv = req.user?.userInfo?.MA_NV;
      const requesterRole = req.user?.userInfo?.role;
      const result = await projectService.createTaskForMember(
        MA_DA,
        requesterMaNv,
        requesterRole,
        req.body,
      );
      
      try {
        const notif = await createNotification(
          req.body.MA_NV || requesterMaNv, // Nếu payload có MA_NV thì giao cho MA_NV đó, nếu không thì tự nhận
          "Nhiệm vụ mới",
          `Bạn vừa được giao một nhiệm vụ mới: ${req.body.TEN_NHIEM_VU}`,
          "task_assign",
          `/projects/${MA_DA}`
        );
        if (notif) emitNotification(req.body.MA_NV || requesterMaNv, notif);
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
      const { id: MA_DA, taskId } = req.params;
      const requesterMaNv = req.user?.userInfo?.MA_NV;
      const requesterRole = req.user?.userInfo?.role;
      const result = await projectService.updateTaskForMember(
        MA_DA,
        taskId,
        requesterMaNv,
        requesterRole,
        req.body,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  getMyJoinedProjectsWithMembers: async (req, res) => {
    try {
      const requesterMaNv = req.user?.userInfo?.MA_NV;
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
      const requesterMaNv = req.user?.userInfo?.MA_NV;
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
      const requesterMaNv = String(req.user?.userInfo?.MA_NV || "").trim();
      const requesterRole = req.user?.userInfo?.role;
      const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";

      // Cho phép tất cả nhân viên xem danh sách dự án của nhau
      // if (!isAdmin && requesterMaNv !== String(id || "").trim()) {
      //   return res.status(403).json({
      //     success: false,
      //     message: "Bạn không có quyền xem danh sách dự án của nhân viên khác.",
      //   });
      // }

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
      const { id: MA_DA } = req.params;
      const { MA_NV, VAI_TRO_DU_AN } = req.body;
      const result = await projectService.addProjectMember(
        MA_DA,
        MA_NV,
        VAI_TRO_DU_AN,
      );
      
      try {
        const notif = await createNotification(
          MA_NV,
          "Dự án mới",
          `Bạn đã được thêm vào dự án với vai trò: ${VAI_TRO_DU_AN}`,
          "project_assign",
          `/projects/${MA_DA}`
        );
        if (notif) emitNotification(MA_NV, notif);
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
      const { id: MA_DA, employeeId: MA_NV } = req.params;
      const requesterMaNv = req.user?.userInfo?.MA_NV;
      const requesterRole = req.user?.userInfo?.role;
      const result = await projectService.removeProjectMember(
        MA_DA,
        MA_NV,
        requesterMaNv,
        requesterRole,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },
};

export default projectController;
