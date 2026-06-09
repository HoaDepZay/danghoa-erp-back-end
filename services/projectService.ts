import projectRepository from "../repositories/projectRepository";
import chatService from "./chatService";

const normalizeProjectRole = (role: unknown) =>
  String(role || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

const normalizeRole = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

const projectService = {
  getProjectTasksForMember: async (MA_DA, requesterMaNv) => {
    try {
      const normalizedMaDa = Number(MA_DA);
      if (!normalizedMaDa) {
        throw new Error("Mã dự án không hợp lệ");
      }

      const data = await projectRepository.getProjectTasks(normalizedMaDa);
      return { success: true, data };
    } catch (error) {
      throw new Error("Lỗi lấy danh sách task dự án: " + error.message);
    }
  },

  createTaskForMember: async (MA_DA, requesterMaNv, requesterRole, payload) => {
    try {
      const normalizedMaDa = Number(MA_DA);
      if (!normalizedMaDa) {
        throw new Error("Mã dự án không hợp lệ");
      }

      if (!requesterMaNv || String(requesterMaNv).trim() === "") {
        throw new Error("Không xác định được nhân viên gọi API.");
      }

      if (!payload?.TEN_NHIEM_VU || !String(payload.TEN_NHIEM_VU).trim()) {
        throw new Error("Tên nhiệm vụ là bắt buộc");
      }

      if (!payload?.MA_NV || !String(payload.MA_NV).trim()) {
        throw new Error("Mã nhân viên được giao task là bắt buộc");
      }

      const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";
      const isMember = await projectRepository.isEmployeeInProject(
        normalizedMaDa,
        requesterMaNv,
      );
      if (!isAdmin && !isMember) {
        throw new Error(
          "Bạn không thuộc dự án này nên không có quyền tạo task.",
        );
      }

      const created = await projectRepository.createTask(
        normalizedMaDa,
        payload,
      );
      return {
        success: true,
        message: "Tạo task thành công",
        data: created,
      };
    } catch (error) {
      throw new Error("Lỗi tạo task: " + error.message);
    }
  },

  updateTaskForMember: async (MA_DA, maNvDa, requesterMaNv, requesterRole, payload) => {
    try {
      const normalizedMaDa = Number(MA_DA);
      const normalizedTaskId = Number(maNvDa);
      const normalizedRequesterMaNv = String(requesterMaNv || "").trim();

      if (!normalizedMaDa || !normalizedTaskId) {
        throw new Error("Mã dự án hoặc mã task không hợp lệ");
      }

      if (!normalizedRequesterMaNv) {
        throw new Error("Không xác định được nhân viên gọi API.");
      }

      const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";

      const isMember = await projectRepository.isEmployeeInProject(
        normalizedMaDa,
        normalizedRequesterMaNv,
      );
      if (!isAdmin && !isMember) {
        throw new Error(
          "Bạn không thuộc dự án này nên không có quyền cập nhật task.",
        );
      }

      const projectRole = await projectRepository.getProjectMemberRole(
        normalizedMaDa,
        normalizedRequesterMaNv,
      );
      const projectRoleNorm = normalizeRole(projectRole);
      const isProjectLead =
        projectRoleNorm === normalizeRole("Trưởng dự án") ||
        projectRoleNorm === normalizeRole("Quản lý") ||
        projectRoleNorm === normalizeRole("Phó dự án");

      const existing = await projectRepository.getTaskByIdInProject(
        normalizedMaDa,
        normalizedTaskId,
      );
      if (!existing) {
        throw new Error("Task không tồn tại trong dự án này");
      }

      const taskOwnerMaNv = String(existing.MaNV || "").trim();
      if (!isAdmin && !isProjectLead && taskOwnerMaNv !== normalizedRequesterMaNv) {
        throw new Error(
          "Bạn không có quyền cập nhật task này. Chỉ nhân viên được giao task mới được phép cập nhật.",
        );
      }

      if (
        !isAdmin &&
        !isProjectLead &&
        payload?.MA_NV !== undefined &&
        String(payload.MA_NV || "").trim() !== normalizedRequesterMaNv
      ) {
        throw new Error(
          "Bạn không được chuyển task sang nhân viên khác qua API này.",
        );
      }

      const updated = await projectRepository.updateTask(
        normalizedMaDa,
        normalizedTaskId,
        payload || {},
      );

      return {
        success: true,
        message: "Cập nhật task thành công",
        data: updated,
      };
    } catch (error) {
      throw new Error("Lỗi cập nhật task: " + error.message);
    }
  },

  getMyJoinedProjectsWithMembers: async (MA_NV) => {
    try {
      if (!MA_NV || String(MA_NV).trim() === "") {
        throw new Error("Không xác định được mã nhân viên từ token.");
      }

      const rows =
        await projectRepository.getProjectsWithMembersByEmployee(MA_NV);
      const projectMap = new Map();

      for (const row of rows) {
        if (!projectMap.has(row.MA_DA)) {
          projectMap.set(row.MA_DA, {
            MADA: row.MA_DA,
            TENDA: row.TEN_DA,
            MoTa: row.MO_TA,
            NgayBatDau: row.NGAY_BAT_DAU,
            NgayKetThuc: row.NGAY_KET_THUC,
            TrangThai: row.TRANG_THAI,
            thanhVien: [],
          });
        }

        if (row.MemberMaNV) {
          projectMap.get(row.MA_DA).thanhVien.push({
            MaNV: row.MemberMaNV,
            HOTEN: row.MemberHoTen,
            EMAIL: row.MemberEmail,
            CHUCVU: row.MemberChucVu,
            VaiTroDuAn: row.MemberVaiTroDuAn,
            NgayThamGia: row.MemberNgayThamGia,
          });
        }
      }

      return {
        success: true,
        data: Array.from(projectMap.values()),
      };
    } catch (error) {
      throw new Error(
        "Lỗi lấy danh sách dự án nhân viên đang tham gia: " + error.message,
      );
    }
  },

  getAllProjects: async () => {
    try {
      const data = await projectRepository.getAllProjects();
      return { success: true, data };
    } catch (error) {
      throw new Error("Lỗi lấy danh sách dự án: " + error.message);
    }
  },

  getProjectById: async (MA_DA, requesterMaNv, requesterRole) => {
    try {
      const normalizedMaDa = Number(MA_DA);
      if (!normalizedMaDa) {
        throw new Error("Mã dự án không hợp lệ");
      }

      // Check quyền: admin hoặc nhân viên tham gia dự án
      const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";
      const isMember = await projectRepository.isEmployeeInProject(
        normalizedMaDa,
        requesterMaNv,
      );

      if (!isAdmin && !isMember) {
        throw new Error(
          "Bạn không có quyền xem dự án này. Chỉ thành viên dự án hoặc admin mới được xem.",
        );
      }

      const project = await projectRepository.getProjectById(normalizedMaDa);
      if (!project) throw new Error("Dự án không tồn tại");

      const members = await projectRepository.getProjectMembers(normalizedMaDa);

      return {
        success: true,
        data: {
          ...project,
          thanhVien: members,
        },
      };
    } catch (error) {
      throw new Error("Lỗi lấy thông tin dự án: " + error.message);
    }
  },

  getEmployeeProjects: async (MA_NV) => {
    try {
      const data = await projectRepository.getEmployeeProjects(MA_NV);
      return { success: true, data };
    } catch (error) {
      throw new Error(
        "Lỗi lấy danh sách dự án của nhân viên: " + error.message,
      );
    }
  },

  createProject: async (data) => {
    try {
      if (!data.TEN_DA) throw new Error("Tên dự án là bắt buộc.");

      const createdProject = await projectRepository.createProject(data);

      const maDa = createdProject?.MADA || createdProject?.MA_DA;
      const tenDa = createdProject?.TENDA || createdProject?.TEN_DA;

      if (maDa) {
        const room = await chatService.ensureProjectRoomCreated(maDa, tenDa);
        if (room?.MaPhong) {
          await projectRepository.updateProjectChatRoom(maDa, room.MaPhong);
        }
      }

      return {
        success: true,
        message: "Tạo dự án thành công",
        data: createdProject || null,
      };
    } catch (error) {
      throw new Error("Lỗi tạo dự án: " + error.message);
    }
  },

  updateProject: async (MA_DA, data) => {
    try {
      const existing = await projectRepository.getProjectById(MA_DA);
      if (!existing) throw new Error("Dự án không tồn tại.");

      const updateData = {
        TEN_DA: data.TEN_DA,
        MO_TA: data.MO_TA,
        NGAY_BAT_DAU: data.NGAY_BAT_DAU,
        NGAY_KET_THUC: data.NGAY_KET_THUC,
        TRANG_THAI: data.TRANG_THAI,
      };

      Object.keys(updateData).forEach(
        (k) => updateData[k] === undefined && delete updateData[k],
      );

      await projectRepository.updateProject(MA_DA, updateData);
      return { success: true, message: "Cập nhật dự án thành công" };
    } catch (error) {
      throw new Error("Lỗi cập nhật dự án: " + error.message);
    }
  },

  deleteProject: async (MA_DA) => {
    try {
      const existing = await projectRepository.getProjectById(MA_DA);
      if (!existing) throw new Error("Dự án không tồn tại.");

      // Bước 1: Xóa danh sách nhiệm vụ của dự án
      await projectRepository.deleteProjectTasks(MA_DA);

      // Bước 2: Xóa phân công nhân viên của dự án
      await projectRepository.deleteProjectAssignments(MA_DA);

      // Bước 3: Xóa dự án
      await projectRepository.deleteProject(MA_DA);

      return { success: true, message: "Xóa dự án thành công" };
    } catch (error) {
      throw new Error("Lỗi xóa dự án: " + error.message);
    }
  },

  addProjectMember: async (MA_DA, MA_NV, vaiTro) => {
    try {
      if (!vaiTro) throw new Error("Vai trò dự án là bắt buộc.");

      const existing = await projectRepository.getProjectById(MA_DA);
      if (!existing) throw new Error("Dự án không tồn tại.");

      await projectRepository.addProjectMember(MA_DA, MA_NV, vaiTro);

      // Sync vào phòng chat với tên dự án
      await chatService.syncProjectMemberAdded(MA_DA, MA_NV, existing.TENDA);

      return { success: true, message: "Thêm thành viên vào dự án thành công" };
    } catch (error) {
      // Catch foreign key error / duplicate member
      if (error.message.includes("Violation of PRIMARY KEY")) {
        throw new Error("Nhân viên này đã ở trong dự án.");
      }
      throw new Error("Lỗi thêm thành viên: " + error.message);
    }
  },

  removeProjectMember: async (MA_DA, MA_NV, requesterMaNv, requesterRole) => {
    try {
      const normalizedMaDa = Number(MA_DA);
      const normalizedTargetMaNv = String(MA_NV || "").trim();
      const normalizedRequesterMaNv = String(requesterMaNv || "").trim();

      if (!normalizedMaDa || !normalizedTargetMaNv) {
        throw new Error("Thiếu mã dự án hoặc mã nhân viên cần xóa");
      }

      if (!normalizedRequesterMaNv) {
        throw new Error("Không xác định được người gọi API");
      }

      const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";

      const rRole = await projectRepository.getProjectMemberRole(
        normalizedMaDa,
        normalizedRequesterMaNv,
      );
      const isProjectLead =
        normalizeProjectRole(rRole) ===
        normalizeProjectRole("Trưởng dự án");

      if (!isAdmin && !isProjectLead) {
        throw new Error(
          "Bạn không có quyền xóa thành viên. Chỉ Trưởng dự án mới được phép thực hiện.",
        );
      }

      await projectRepository.removeProjectMember(
        normalizedMaDa,
        normalizedTargetMaNv,
      );

      await chatService.syncProjectMemberRemoved(
        normalizedMaDa,
        normalizedTargetMaNv,
      );

      return { success: true, message: "Xóa thành viên khỏi dự án thành công" };
    } catch (error) {
      throw new Error("Lỗi xóa thành viên: " + error.message);
    }
  },
};

export default projectService;
