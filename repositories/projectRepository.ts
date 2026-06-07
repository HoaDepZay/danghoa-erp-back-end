import { appPool, sql } from "../config/db";

const mapTaskRow = (row: any) => {
  if (!row) return null;
  return {
    MaNVDA: row.MANVDA ?? row.MaNVDA,
    MaDA: row.MADA ?? row.MaDA,
    MaNV: row.MANV ?? row.MaNV,
    TenNhiemVu: row.TENNHIEMVU ?? row.TenNhiemVu,
    MoTa: row.MOTA ?? row.MoTa,
    NgayBatDau: row.NGAYBATDAU ?? row.NgayBatDau,
    NgayKetThuc: row.NGAYKETTHUC ?? row.NgayKetThuc,
    DoUuTien: row.DOUUTIEN ?? row.DoUuTien,
    TrangThai: row.TRANGTHAI ?? row.TrangThai,
    PhanTramHoanThanh: row.PHANTRAMHOANTHANH ?? row.PhanTramHoanThanh,
    GhiChuSauHoanThanh: row.GHICHUSAUHOANTHANH ?? row.GhiChuSauHoanThanh,
    CreatedAt: row.CREATEDAT ?? row.CreatedAt,
  };
};

const projectRepository = {
  isEmployeeInProject: async (maDa, maNv) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .input("MANV", sql.VarChar(20), maNv)
      .execute("sp_isEmployeeInProject");

    return result.recordset.length > 0;
  },

  getProjectMemberRole: async (maDa, maNv) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .input("MANV", sql.VarChar(20), maNv)
      .execute("sp_getProjectMemberRole");

    return result.recordset[0]?.VaiTroDuAn || null;
  },

  getProjectTasks: async (maDa) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .execute("sp_getProjectTasks");

    return result.recordset;
  },

  createTask: async (maDa, data) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .input("MANV", sql.VarChar(20), data.manv)
      .input("TENNHIEMVU", sql.NVarChar(255), data.tennhiemvu)
      .input("MOTA", sql.NVarChar(sql.MAX), data.mota ?? null)
      .input("NGAYBATDAU", sql.Date, data.ngaybatdau ?? null)
      .input("NGAYKETTHUC", sql.Date, data.ngayketthuc ?? null)
      .input("DOUUTIEN", sql.NVarChar(20), data.douutien ?? null)
      .input("TRANGTHAI", sql.NVarChar(50), data.trangthai ?? "Mới")
      .input("PHANTRAMHOANTHANH", sql.Int, data.phantramhoanthanh ?? 0)
      .input("GHICHUSAUHOANTHANH", sql.NVarChar(sql.MAX), data.ghichusauhoanthanh ?? null)
      .execute("sp_createProjectTask");

    return mapTaskRow(result.recordset[0]);
  },

  getTaskByIdInProject: async (maDa, maNvDa) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .input("MANVDA", sql.Int, maNvDa)
      .execute("sp_getTaskByIdInProject");

    return mapTaskRow(result.recordset[0]);
  },

  updateTask: async (maDa, maNvDa, data) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .input("MANVDA", sql.Int, maNvDa)
      .input("MANV", sql.VarChar(20), data.manv ?? null)
      .input("MANV_PASSED", sql.Bit, data.manv !== undefined ? 1 : 0)
      .input("TENNHIEMVU", sql.NVarChar(255), data.tennhiemvu ?? null)
      .input("TENNHIEMVU_PASSED", sql.Bit, data.tennhiemvu !== undefined ? 1 : 0)
      .input("MOTA", sql.NVarChar(sql.MAX), data.mota ?? null)
      .input("MOTA_PASSED", sql.Bit, data.mota !== undefined ? 1 : 0)
      .input("NGAYBATDAU", sql.Date, data.ngaybatdau ?? null)
      .input("NGAYBATDAU_PASSED", sql.Bit, data.ngaybatdau !== undefined ? 1 : 0)
      .input("NGAYKETTHUC", sql.Date, data.ngayketthuc ?? null)
      .input("NGAYKETTHUC_PASSED", sql.Bit, data.ngayketthuc !== undefined ? 1 : 0)
      .input("DOUUTIEN", sql.NVarChar(20), data.douutien ?? null)
      .input("DOUUTIEN_PASSED", sql.Bit, data.douutien !== undefined ? 1 : 0)
      .input("TRANGTHAI", sql.NVarChar(50), data.trangthai ?? null)
      .input("TRANGTHAI_PASSED", sql.Bit, data.trangthai !== undefined ? 1 : 0)
      .input("PHANTRAMHOANTHANH", sql.Int, data.phantramhoanthanh ?? null)
      .input("PHANTRAMHOANTHANH_PASSED", sql.Bit, data.phantramhoanthanh !== undefined ? 1 : 0)
      .input("GHICHUSAUHOANTHANH", sql.NVarChar(sql.MAX), data.ghichusauhoanthanh ?? null)
      .input("GHICHUSAUHOANTHANH_PASSED", sql.Bit, data.ghichusauhoanthanh !== undefined ? 1 : 0)
      .execute("sp_updateProjectTask");

    return mapTaskRow(result.recordset[0]);
  },

  getAllProjects: async () => {
    const result = await appPool
      .request()
      .execute("sp_getAllProjects");

    return result.recordset;
  },

  getProjectById: async (maDa) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .execute("sp_getProjectById");

    return result.recordset[0] || null;
  },

  getProjectMembers: async (maDa) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .execute("sp_getProjectMembers");

    return result.recordset;
  },

  getEmployeeProjects: async (maNv) => {
    const result = await appPool
      .request()
      .input("MANV", sql.VarChar(20), maNv)
      .execute("sp_getEmployeeProjects");

    return result.recordset;
  },

  getProjectsWithMembersByEmployee: async (maNv) => {
    const result = await appPool
      .request()
      .input("MANV", sql.VarChar(20), maNv)
      .execute("sp_getProjectsWithMembersByEmployee");

    return result.recordset;
  },

  createProject: async (data) => {
    const result = await appPool
      .request()
      .input("TENDA", sql.NVarChar(255), data.tenda)
      .input("MOTA", sql.NVarChar(sql.MAX), data.mota || null)
      .input("NGAYBATDAU", sql.Date, data.ngaybatdau || new Date())
      .input("NGAYKETTHUC", sql.Date, data.ngayketthuc || null)
      .input("TRANGTHAI", sql.NVarChar(50), data.trangthai || "Đang lên kế hoạch")
      .execute("sp_createProject");

    return result.recordset[0] || null;
  },

  updateProject: async (maDa, data) => {
    await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .input("TENDA", sql.NVarChar(255), data.tenda ?? null)
      .input("TENDA_PASSED", sql.Bit, data.tenda !== undefined ? 1 : 0)
      .input("MOTA", sql.NVarChar(sql.MAX), data.mota ?? null)
      .input("MOTA_PASSED", sql.Bit, data.mota !== undefined ? 1 : 0)
      .input("NGAYBATDAU", sql.Date, data.ngaybatdau ?? null)
      .input("NGAYBATDAU_PASSED", sql.Bit, data.ngaybatdau !== undefined ? 1 : 0)
      .input("NGAYKETTHUC", sql.Date, data.ngayketthuc ?? null)
      .input("NGAYKETTHUC_PASSED", sql.Bit, data.ngayketthuc !== undefined ? 1 : 0)
      .input("TRANGTHAI", sql.NVarChar(50), data.trangthai ?? null)
      .input("TRANGTHAI_PASSED", sql.Bit, data.trangthai !== undefined ? 1 : 0)
      .execute("sp_updateProject");
  },

  deleteProjectTasks: async (maDa) => {
    await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .execute("sp_deleteProjectTasks");
  },

  deleteProjectAssignments: async (maDa) => {
    await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .execute("sp_deleteProjectAssignments");
  },

  deleteProject: async (maDa) => {
    await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .execute("sp_deleteProject");
  },

  addProjectMember: async (maDa, maNv, vaiTroDuAn) => {
    await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .input("MANV", sql.VarChar(20), maNv)
      .input("VaiTroDU_AN", sql.NVarChar(100), vaiTroDuAn)
      .execute("sp_addProjectMember");
  },

  updateProjectChatRoom: async (maDa, maPhongChat) => {
    await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .input("MAPHONGCHAT", sql.Int, maPhongChat)
      .query("UPDATE DU_AN SET MaPhongChat = @MAPHONGCHAT WHERE MADA = @MADA");
  },

  removeProjectMember: async (maDa, maNv) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, maDa)
      .input("MANV", sql.VarChar(20), maNv)
      .execute("sp_removeProjectMember");

    const removedMemberCount = result.recordset?.[0]?.RemovedMemberCount || 0;
    if (removedMemberCount === 0) {
      throw new Error("Nhân viên không tồn tại trong dự án");
    }
  },
};

export default projectRepository;
