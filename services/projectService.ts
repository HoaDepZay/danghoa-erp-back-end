import projectRepository from "../repositories/projectRepository";
import chatService from "./chatService";

const normalizeProjectRole = (role: unknown) =>
  String(role || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

const normalizeRole = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

const projectService = {
  getProjectTasksForMember: async (maDa, requesterMaNv) => {
    try {
      const normalizedMaDa = Number(maDa);
      if (!normalizedMaDa) {
        throw new Error("Mã dự án không hợp lệ");
      }

      const data = await projectRepository.getProjectTasks(normalizedMaDa);
      return { success: true, data };
    } catch (error) {
      throw new Error("Lỗi lấy danh sách task dự án: " + error.message);
    }
  },

  createTaskForMember: async (maDa, requesterMaNv, payload) => {
    try {
      const normalizedMaDa = Number(maDa);
      if (!normalizedMaDa) {
        throw new Error("Mã dự án không hợp lệ");
      }

      if (!requesterMaNv || String(requesterMaNv).trim() === "") {
        throw new Error("Không xác định được nhân viên gọi API.");
      }

      if (!payload?.tennhiemvu || !String(payload.tennhiemvu).trim()) {
        throw new Error("Tên nhiệm vụ là bắt buộc");
      }

      if (!payload?.manv || !String(payload.manv).trim()) {
        throw new Error("Mã nhân viên được giao task là bắt buộc");
      }

      const isMember = await projectRepository.isEmployeeInProject(
        normalizedMaDa,
        requesterMaNv,
      );
      if (!isMember) {
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

  updateTaskForMember: async (maDa, maNvDa, requesterMaNv, payload) => {
    try {
      const normalizedMaDa = Number(maDa);
      const normalizedTaskId = Number(maNvDa);
      const normalizedRequesterMaNv = String(requesterMaNv || "").trim();

      if (!normalizedMaDa || !normalizedTaskId) {
        throw new Error("Mã dự án hoặc mã task không hợp lệ");
      }

      if (!normalizedRequesterMaNv) {
        throw new Error("Không xác định được nhân viên gọi API.");
      }

      const isMember = await projectRepository.isEmployeeInProject(
        normalizedMaDa,
        normalizedRequesterMaNv,
      );
      if (!isMember) {
        throw new Error(
          "Bạn không thuộc dự án này nên không có quyền cập nhật task.",
        );
      }

      const projectRole = await projectRepository.getProjectMemberRole(
        normalizedMaDa,
        normalizedRequesterMaNv,
      );
      const isProjectLead =
        normalizeRole(projectRole) === normalizeRole("Trưởng dự án");

      const existing = await projectRepository.getTaskByIdInProject(
        normalizedMaDa,
        normalizedTaskId,
      );
      if (!existing) {
        throw new Error("Task không tồn tại trong dự án này");
      }

      const taskOwnerMaNv = String(existing.MaNV || "").trim();
      if (!isProjectLead && taskOwnerMaNv !== normalizedRequesterMaNv) {
        throw new Error(
          "Bạn không có quyền cập nhật task này. Chỉ nhân viên được giao task mới được phép cập nhật.",
        );
      }

      if (
        !isProjectLead &&
        payload?.manv !== undefined &&
        String(payload.manv || "").trim() !== normalizedRequesterMaNv
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

  getMyJoinedProjectsWithMembers: async (maNv) => {
    try {
      if (!maNv || String(maNv).trim() === "") {
        throw new Error("Không xác định được mã nhân viên từ token.");
      }

      const rows =
        await projectRepository.getProjectsWithMembersByEmployee(maNv);
      const projectMap = new Map();

      for (const row of rows) {
        if (!projectMap.has(row.MADA)) {
          projectMap.set(row.MADA, {
            MADA: row.MADA,
            TENDA: row.TENDA,
            MoTa: row.MoTa,
            NgayBatDau: row.NgayBatDau,
            NgayKetThuc: row.NgayKetThuc,
            TrangThai: row.TrangThai,
            thanhVien: [],
          });
        }

        if (row.MemberMaNV) {
          projectMap.get(row.MADA).thanhVien.push({
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

  getProjectById: async (maDa, requesterMaNv, requesterRole) => {
    try {
      const normalizedMaDa = Number(maDa);
      if (!normalizedMaDa) {
        throw new Error("Mã dự án không hợp lệ");
      }

      // Check quyền: admin hoặc nhân viên tham gia dự án
      const isAdmin = normalizeRole(requesterRole) === "admin";
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

  getEmployeeProjects: async (maNv) => {
    try {
      const data = await projectRepository.getEmployeeProjects(maNv);
      return { success: true, data };
    } catch (error) {
      throw new Error(
        "Lỗi lấy danh sách dự án của nhân viên: " + error.message,
      );
    }
  },

  createProject: async (data) => {
    try {
      if (!data.tenda) throw new Error("Tên dự án là bắt buộc.");

      const createdProject = await projectRepository.createProject(data);

      if (createdProject?.MADA) {
        const room = await chatService.ensureProjectRoomCreated(
          createdProject.MADA,
          createdProject.TENDA,
        );
        if (room?.MaPhong) {
          await projectRepository.updateProjectChatRoom(createdProject.MADA, room.MaPhong);
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

  updateProject: async (maDa, data) => {
    try {
      const existing = await projectRepository.getProjectById(maDa);
      if (!existing) throw new Error("Dự án không tồn tại.");

      const updateData = {
        tenda: data.tenda,
        mota: data.mota,
        ngaybatdau: data.ngaybatdau,
        ngayketthuc: data.ngayketthuc,
        trangthai: data.trangthai,
      };

      Object.keys(updateData).forEach(
        (k) => updateData[k] === undefined && delete updateData[k],
      );

      await projectRepository.updateProject(maDa, updateData);
      return { success: true, message: "Cập nhật dự án thành công" };
    } catch (error) {
      throw new Error("Lỗi cập nhật dự án: " + error.message);
    }
  },

  deleteProject: async (maDa) => {
    try {
      const existing = await projectRepository.getProjectById(maDa);
      if (!existing) throw new Error("Dự án không tồn tại.");

      // Bước 1: Xóa danh sách nhiệm vụ của dự án
      await projectRepository.deleteProjectTasks(maDa);

      // Bước 2: Xóa phân công nhân viên của dự án
      await projectRepository.deleteProjectAssignments(maDa);

      // Bước 3: Xóa dự án
      await projectRepository.deleteProject(maDa);

      return { success: true, message: "Xóa dự án thành công" };
    } catch (error) {
      throw new Error("Lỗi xóa dự án: " + error.message);
    }
  },

  addProjectMember: async (maDa, maNv, vaiTro) => {
    try {
      if (!vaiTro) throw new Error("Vai trò dự án là bắt buộc.");

      const existing = await projectRepository.getProjectById(maDa);
      if (!existing) throw new Error("Dự án không tồn tại.");

      await projectRepository.addProjectMember(maDa, maNv, vaiTro);

      // Sync vào phòng chat với tên dự án
      await chatService.syncProjectMemberAdded(maDa, maNv, existing.TENDA);

      return { success: true, message: "Thêm thành viên vào dự án thành công" };
    } catch (error) {
      // Catch foreign key error / duplicate member
      if (error.message.includes("Violation of PRIMARY KEY")) {
        throw new Error("Nhân viên này đã ở trong dự án.");
      }
      throw new Error("Lỗi thêm thành viên: " + error.message);
    }
  },

  removeProjectMember: async (maDa, maNv, requesterMaNv) => {
    try {
      const normalizedMaDa = Number(maDa);
      const normalizedTargetMaNv = String(maNv || "").trim();
      const normalizedRequesterMaNv = String(requesterMaNv || "").trim();

      if (!normalizedMaDa || !normalizedTargetMaNv) {
        throw new Error("Thiếu mã dự án hoặc mã nhân viên cần xóa");
      }

      if (!normalizedRequesterMaNv) {
        throw new Error("Không xác định được người gọi API");
      }

      const requesterRole = await projectRepository.getProjectMemberRole(
        normalizedMaDa,
        normalizedRequesterMaNv,
      );
      const isProjectLead =
        normalizeProjectRole(requesterRole) ===
        normalizeProjectRole("Trưởng dự án");

      if (!isProjectLead) {
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
