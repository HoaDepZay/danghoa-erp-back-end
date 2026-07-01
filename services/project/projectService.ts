import projectRepository from "../../repositories/project/projectRepository";
import chatService from "../chatService";

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

      const project = await projectRepository.getProjectById(normalizedMaDa);
      if (!project) {
        throw new Error("Dự án không tồn tại.");
      }
      if (project.TRANG_THAI && String(project.TRANG_THAI).trim().toLowerCase() === "hoàn thành") {
        throw new Error("Không thể giao thêm nhiệm vụ vì dự án đã Hoàn thành.");
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
      const projectRole = await projectRepository.getProjectMemberRole(
        normalizedMaDa,
        requesterMaNv,
      );
      
      const isProjectLead = 
        Number(projectRole) === 2 || 
        Number(projectRole) === 3 || 
        normalizeRole(projectRole) === normalizeRole("Trưởng dự án") || 
        normalizeRole(projectRole) === normalizeRole("Phó dự án");

      if (!isAdmin && !isProjectLead) {
        throw new Error(
          "Bạn không có quyền tạo task. Chỉ Trưởng dự án, Phó dự án hoặc Admin mới được phép.",
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
      const isProjectLead = 
        Number(projectRole) === 2 || 
        Number(projectRole) === 3 || 
        normalizeRole(projectRole) === normalizeRole("Trưởng dự án") || 
        normalizeRole(projectRole) === normalizeRole("Phó dự án");

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
        !isProjectLead
      ) {
        // Nếu không phải admin/quản lý, chỉ được phép sửa TRANG_THAI, PHAN_TRAM_HOAN_THANH và MO_TA
        const allowedKeys = ['TRANG_THAI', 'PHAN_TRAM_HOAN_THANH', 'MO_TA'];
        const keys = Object.keys(payload || {});
        for (const k of keys) {
          if (!allowedKeys.includes(k) && payload[k] !== undefined && payload[k] !== existing[k]) {
             throw new Error("Bạn chỉ được phép cập nhật Trạng thái và % Hoàn thành của task mình được giao.");
          }
        }
        
        if (payload?.MA_NV !== undefined && String(payload.MA_NV || "").trim() !== normalizedRequesterMaNv) {
          throw new Error("Bạn không được chuyển task sang nhân viên khác.");
        }
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

      const sortedData = Array.from(projectMap.values());
      sortedData.sort((a: any, b: any) => (b.MADA || b.MA_DA || 0) - (a.MADA || a.MA_DA || 0));

      return {
        success: true,
        data: sortedData,
      };
    } catch (error) {
      throw new Error(
        "Lỗi lấy danh sách dự án nhân viên đang tham gia: " + error.message,
      );
    }
  },

  getAllProjects: async (requesterMaNv, requesterRole) => {
    try {
      const data = await projectRepository.getAllProjects();
      const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";
      
      let filteredData = data;
      if (!isAdmin && requesterMaNv) {
        const myProjects = await projectRepository.getEmployeeProjects(requesterMaNv);
        const myProjectIds = myProjects.map((p: any) => p.MA_DA);
        filteredData = data.filter((proj: any) => proj.CONG_KHAI || myProjectIds.includes(proj.MA_DA));
      }
      filteredData.sort((a: any, b: any) => (b.MA_DA || b.MADA || 0) - (a.MA_DA || a.MADA || 0));
      return { success: true, data: filteredData };
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

      const project = await projectRepository.getProjectById(normalizedMaDa);
      if (!project) throw new Error("Dự án không tồn tại");

      // Check quyền: admin hoặc nhân viên tham gia dự án hoặc dự án công khai
      const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";
      const isMember = await projectRepository.isEmployeeInProject(
        normalizedMaDa,
        requesterMaNv,
      );

      if (!isAdmin && !isMember && !project.CONG_KHAI) {
        throw new Error(
          "Bạn không có quyền xem dự án này. Dự án nội bộ chỉ dành cho thành viên hoặc admin.",
        );
      }

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

  getEmployeeProjects: async (MA_NV, requesterMaNv, requesterRole) => {
    try {
      const data = await projectRepository.getEmployeeProjects(MA_NV);
      const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";
      
      let filteredData = data;
      // If someone else is viewing this employee's projects, hide private ones they don't have access to
      if (!isAdmin && requesterMaNv && String(MA_NV).trim() !== requesterMaNv) {
        const myProjects = await projectRepository.getEmployeeProjects(requesterMaNv);
        const myProjectIds = myProjects.map((p: any) => p.MA_DA);
        filteredData = data.filter((proj: any) => proj.CONG_KHAI || myProjectIds.includes(proj.MA_DA));
      }
      filteredData.sort((a: any, b: any) => (b.MA_DA || b.MADA || 0) - (a.MA_DA || a.MADA || 0));
      return { success: true, data: filteredData };
    } catch (error) {
      throw new Error(
        "Lỗi lấy danh sách dự án của nhân viên: " + error.message,
      );
    }
  },

  createProjectFull: async (data, requesterMaNv, requesterRole) => {
    try {
      const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";
      if (!isAdmin) throw new Error("Chỉ Giám đốc hoặc Admin mới có quyền tạo dự án.");

      if (!data?.project?.TEN_DA) throw new Error("Tên dự án là bắt buộc.");

      const maDa = await projectRepository.createProjectFullTransaction(data);

      return {
        success: true,
        message: "Tạo dự án thành công (Transaction)",
        data: { MA_DA: maDa },
      };
    } catch (error) {
      throw new Error("Lỗi tạo dự án: " + error.message);
    }
  },

  createProject: async (data, requesterMaNv, requesterRole) => {
    try {
      const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";
      if (!isAdmin) throw new Error("Chỉ Giám đốc hoặc Admin mới có quyền tạo dự án.");

      if (!data.TEN_DA) throw new Error("Tên dự án là bắt buộc.");

      const createdProject = await projectRepository.createProject(data);

      const maDa = createdProject?.MADA || createdProject?.MA_DA;
      const tenDa = createdProject?.TENDA || createdProject?.TEN_DA;

      if (maDa) {
        const room = await chatService.ensureProjectRoomCreated(maDa, tenDa);
        if (room?.MaPhong) {
          await projectRepository.updateProjectChatRoom(maDa, room.MaPhong);
        }
        
        if (data.members && Array.isArray(data.members)) {
          for (const member of data.members) {
            if (member.MA_NV && member.MA_VAI_TRO) {
              try {
                await projectRepository.addProjectMember(maDa, member.MA_NV, member.MA_VAI_TRO);
                await chatService.syncProjectMemberAdded(maDa, member.MA_NV, tenDa);
              } catch (e) {
                console.error("Lỗi thêm thành viên lúc tạo dự án:", e);
              }
            }
          }
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

  updateProject: async (MA_DA, data, requesterMaNv, requesterRole) => {
    try {
      const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";
      const projectRole = await projectRepository.getProjectMemberRole(MA_DA, requesterMaNv);
      const isProjectLead = Number(projectRole) === 2 || Number(projectRole) === 3 || normalizeRole(projectRole) === normalizeRole("Trưởng dự án") || normalizeRole(projectRole) === normalizeRole("Phó dự án");
      if (!isAdmin && !isProjectLead) throw new Error("Chỉ Admin, Giám đốc, Trưởng dự án hoặc Phó dự án mới có quyền cập nhật dự án.");

      const existing = await projectRepository.getProjectById(MA_DA);
      if (!existing) throw new Error("Dự án không tồn tại.");

      const updateData = {
        TEN_DA: data.TEN_DA,
        MO_TA: data.MO_TA,
        NGAY_BAT_DAU: data.NGAY_BAT_DAU,
        NGAY_KET_THUC: data.NGAY_KET_THUC,
        TRANG_THAI: data.TRANG_THAI,
        CONG_KHAI: data.CONG_KHAI,
        ICON: data.ICON,
        COLOR: data.COLOR,
      };

      Object.keys(updateData).forEach(
        (k) => updateData[k] === undefined && delete updateData[k],
      );

      if (updateData.TRANG_THAI && String(updateData.TRANG_THAI).trim().toLowerCase() === "hoàn thành") {
        const tasks = await projectRepository.getProjectTasks(MA_DA);
        if (tasks && tasks.length > 0) {
          const incompleteTasks = tasks.filter((t: any) => {
            const status = String(t.TRANG_THAI || t.TRANGTHAI || t.TrangThai || "").trim().toLowerCase();
            const percent = Number(t.PHAN_TRAM_HOAN_THANH ?? t.PHANTRAMHOANTHANH ?? t.PhanTramHoanThanh) || 0;
            return status !== "hoàn thành" || percent < 100;
          });
          if (incompleteTasks.length > 0) {
            console.log("DEBUG INCOMPLETE TASKS:", JSON.stringify(incompleteTasks, null, 2));
            throw new Error(`Không thể chuyển trạng thái dự án sang Hoàn thành. Vẫn còn ${incompleteTasks.length} nhiệm vụ chưa hoàn tất 100%.`);
          }
        }
      }

      await projectRepository.updateProject(MA_DA, updateData);
      return { success: true, message: "Cập nhật dự án thành công" };
    } catch (error) {
      throw new Error("Lỗi cập nhật dự án: " + error.message);
    }
  },

  deleteProject: async (MA_DA, requesterMaNv, requesterRole) => {
    try {
      const existing = await projectRepository.getProjectById(MA_DA);
      if (!existing) throw new Error("Dự án không tồn tại.");

      // Xóa toàn bộ dữ liệu dự án (Cascade Delete Transaction)
      await projectRepository.deleteProject(MA_DA);

      return { success: true, message: "Xóa dự án thành công" };
    } catch (error) {
      throw new Error("Lỗi xóa dự án: " + error.message);
    }
  },

  addProjectMember: async (MA_DA, MA_NV, vaiTro, requesterMaNv, requesterRole) => {
    try {
      const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";
      const projectRole = await projectRepository.getProjectMemberRole(MA_DA, requesterMaNv);
      const isProjectLead = Number(projectRole) === 2 || Number(projectRole) === 3 || normalizeRole(projectRole) === normalizeRole("Trưởng dự án") || normalizeRole(projectRole) === normalizeRole("Phó dự án");
      if (!isAdmin && !isProjectLead) throw new Error("Chỉ Admin, Giám đốc, Trưởng dự án hoặc Phó dự án mới có quyền thêm thành viên.");

      if (!vaiTro) throw new Error("Vai trò dự án là bắt buộc.");

      const existing = await projectRepository.getProjectById(MA_DA);
      if (!existing) throw new Error("Dự án không tồn tại.");

      const members = await projectRepository.getProjectMembers(MA_DA);
      const isDowngradingPM = Number(vaiTro) !== 2 && String(vaiTro).toLowerCase() !== "trưởng dự án";
      
      if (isDowngradingPM) {
        const targetMember = members.find((m: any) => String(m.MA_NV || m.MANV).trim() === String(MA_NV).trim());
        if (targetMember) {
           const role = targetMember.VAI_TRO_DU_AN || targetMember.VAI_TRO || targetMember.VaiTroDuAn;
           if (Number(role) === 2 || String(role).toLowerCase() === "trưởng dự án") {
              const pmCount = members.filter((m: any) => {
                const r = m.VAI_TRO_DU_AN || m.VAI_TRO || m.VaiTroDuAn;
                return Number(r) === 2 || String(r).toLowerCase() === "trưởng dự án";
              }).length;
              
              if (pmCount <= 1) {
                throw new Error("Không thể giáng chức Trưởng dự án duy nhất của dự án này");
              }
           }
        }
      }

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
      const isProjectLead = Number(rRole) === 2 || Number(rRole) === 3 || normalizeRole(rRole) === normalizeRole("Trưởng dự án") || normalizeRole(rRole) === normalizeRole("Phó dự án");

      if (!isAdmin && !isProjectLead) {
        throw new Error(
          "Bạn không có quyền xóa thành viên. Chỉ Trưởng dự án, Phó dự án hoặc admin mới được xóa.",
        );
      }

      const members = await projectRepository.getProjectMembers(normalizedMaDa);
      const targetMember = members.find((m: any) => String(m.MA_NV || m.MANV).trim() === normalizedTargetMaNv);
      
      if (targetMember) {
        const role = targetMember.VAI_TRO_DU_AN || targetMember.VAI_TRO || targetMember.VaiTroDuAn;
        if (Number(role) === 2 || String(role).toLowerCase() === "trưởng dự án") {
          const pmCount = members.filter((m: any) => {
            const r = m.VAI_TRO_DU_AN || m.VAI_TRO || m.VaiTroDuAn;
            return Number(r) === 2 || String(r).toLowerCase() === "trưởng dự án";
          }).length;
          
          if (pmCount <= 1) {
            throw new Error("Không thể xóa Trưởng dự án duy nhất của dự án này");
          }
        }
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

  getAllProjectRoles: async () => {
    try {
      const data = await projectRepository.getAllProjectRoles();
      return { success: true, data };
    } catch (error) {
      throw new Error("Lỗi lấy danh sách vai trò dự án: " + error.message);
    }
  },

  createProjectRole: async (MA_DA, TEN_VAI_TRO, requesterMaNv, requesterRole) => {
    try {
      if (!TEN_VAI_TRO || !TEN_VAI_TRO.trim()) {
        throw new Error("Tên vai trò không được để trống");
      }
      
      const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";
      
      let isProjectLead = false;
      if (!isAdmin && MA_DA && requesterMaNv) {
        const rRole = await projectRepository.getProjectMemberRole(Number(MA_DA), requesterMaNv);
        const normRole = normalizeProjectRole(rRole);
        isProjectLead = normRole === normalizeProjectRole("Trưởng dự án") || normRole === normalizeProjectRole("Phó dự án");
      }

      if (!isAdmin && !isProjectLead) {
        throw new Error("Bạn không có quyền tạo vai trò mới. Chỉ Giám đốc, Trưởng dự án hoặc Phó dự án mới được phép.");
      }

      const newRole = await projectRepository.createProjectRole(TEN_VAI_TRO.trim());
      return { success: true, data: newRole, message: "Tạo vai trò thành công" };
    } catch (error) {
      throw new Error("Lỗi tạo vai trò dự án: " + error.message);
    }
  }
};

export default projectService;
