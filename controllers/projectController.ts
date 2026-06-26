import projectService from "../services/projectService";
import { emitNotification } from "../server";
import { appPool } from "../config/db";
import { sendProjectAssignEmail, sendTaskAssignEmail } from "../services/emailService";

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

      const assignedMaNv = req.body.MA_NV || requesterMaNv;
      const taskName = req.body.TEN_NHIEM_VU || "Nhiệm vụ mới";

      // Thông báo realtime
      try {
        const tieuDe = "Nhiệm vụ mới";
        const noiDung = `Bạn vừa được giao một nhiệm vụ mới: ${taskName}`;
        const loai = "task_assign";
        const link = `/projects/${MA_DA}`;

        const insertRes = await appPool.request()
          .input("MaNV", assignedMaNv)
          .input("TieuDe", tieuDe)
          .input("NoiDung", noiDung)
          .input("Loai", loai)
          .input("Link", link)
          .query(`
            INSERT INTO THONG_BAO (MA_NV, TIEU_DE, NOI_DUNG, LOAI, LINK)
            OUTPUT 
              INSERTED.MA_TB AS MaTB, 
              INSERTED.MA_NV AS MaNV, 
              INSERTED.TIEU_DE AS TieuDe, 
              INSERTED.NOI_DUNG AS NoiDung, 
              INSERTED.LOAI AS Loai, 
              INSERTED.DA_DOC AS DaDoc, 
              INSERTED.NGAY_TAO AS NgayTao, 
              INSERTED.LINK AS Link
            VALUES (@MaNV, @TieuDe, @NoiDung, @Loai, @Link)
          `);
        const notif = insertRes.recordset[0];
        if (notif) emitNotification(assignedMaNv, notif);
      } catch (e) { console.error("Notif task error", e); }

      // Lấy tên dự án để gửi email
      try {
        const proj = await projectService.getProjectById(MA_DA, requesterMaNv, requesterRole);
        const projectName = proj?.data?.TEN_DA || `Dự án #${MA_DA}`;
        sendTaskAssignEmail(
          assignedMaNv,
          taskName,
          projectName,
          MA_DA,
          req.body.DEADLINE || req.body.NGAY_KET_THUC,
          req.body.MO_TA
        ).catch(console.error);
      } catch (e) { console.error("Email task error", e); }

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
      const result = await projectService.addProjectMember(MA_DA, MA_NV, VAI_TRO_DU_AN);

      // Thông báo realtime
      try {
        const tieuDe = "Dự án mới";
        const noiDung = `Bạn đã được thêm vào dự án với vai trò: ${VAI_TRO_DU_AN}`;
        const loai = "project_assign";
        const link = `/projects/${MA_DA}`;

        const insertRes = await appPool.request()
          .input("MaNV", MA_NV)
          .input("TieuDe", tieuDe)
          .input("NoiDung", noiDung)
          .input("Loai", loai)
          .input("Link", link)
          .query(`
            INSERT INTO THONG_BAO (MA_NV, TIEU_DE, NOI_DUNG, LOAI, LINK)
            OUTPUT 
              INSERTED.MA_TB AS MaTB, 
              INSERTED.MA_NV AS MaNV, 
              INSERTED.TIEU_DE AS TieuDe, 
              INSERTED.NOI_DUNG AS NoiDung, 
              INSERTED.LOAI AS Loai, 
              INSERTED.DA_DOC AS DaDoc, 
              INSERTED.NGAY_TAO AS NgayTao, 
              INSERTED.LINK AS Link
            VALUES (@MaNV, @TieuDe, @NoiDung, @Loai, @Link)
          `);
        const notif = insertRes.recordset[0];
        if (notif) emitNotification(MA_NV, notif);
      } catch (e) { console.error("Notif project error", e); }

      // Gửi email thông báo (async, không chặn response)
      try {
        const proj = await projectService.getProjectById(MA_DA, MA_NV, null);
        const projectName = proj?.data?.TEN_DA || `Dự án #${MA_DA}`;
        sendProjectAssignEmail(MA_NV, projectName, MA_DA, VAI_TRO_DU_AN).catch(console.error);
      } catch (e) { console.error("Email project error", e); }

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
