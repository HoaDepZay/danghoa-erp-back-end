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
  isEmployeeInProject: async (MA_DA, MA_NV) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .input("MANV", sql.VarChar(20), MA_NV)
      .execute("sp_isEmployeeInProject");

    return result.recordset.length > 0;
  },

  getProjectMemberRole: async (MA_DA, MA_NV) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .input("MANV", sql.VarChar(20), MA_NV)
      .execute("sp_getProjectMemberRole");

    return result.recordset[0]?.VaiTroDuAn || null;
  },

  getProjectTasks: async (MA_DA) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .execute("sp_getProjectTasks");

    return result.recordset;
  },

  createTask: async (MA_DA, data) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .input("MANV", sql.VarChar(20), data.MA_NV)
      .input("TENNHIEMVU", sql.NVarChar(255), data.TEN_NHIEM_VU)
      .input("MOTA", sql.NVarChar(sql.MAX), data.MO_TA ?? null)
      .input("NGAYBATDAU", sql.Date, data.NGAY_BAT_DAU ?? null)
      .input("NGAYKETTHUC", sql.Date, data.NGAY_KET_THUC ?? null)
      .input("DOUUTIEN", sql.NVarChar(20), data.DO_UU_TIEN ?? null)
      .input("TRANGTHAI", sql.NVarChar(50), data.TRANG_THAI ?? "Mới")
      .input("PHANTRAMHOANTHANH", sql.Int, data.PHAN_TRAM_HOAN_THANH ?? 0)
      .input("GHICHUSAUHOANTHANH", sql.NVarChar(sql.MAX), data.GHI_CHU_SAU_HOAN_THANH ?? null)
      .execute("sp_createProjectTask");

    return mapTaskRow(result.recordset[0]);
  },

  getTaskByIdInProject: async (MA_DA, maNvDa) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .input("MANVDA", sql.Int, maNvDa)
      .execute("sp_getTaskByIdInProject");

    return mapTaskRow(result.recordset[0]);
  },

  updateTask: async (MA_DA, maNvDa, data) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .input("MANVDA", sql.Int, maNvDa)
      .input("MANV", sql.VarChar(20), data.MA_NV ?? null)
      .input("MANV_PASSED", sql.Bit, data.MA_NV !== undefined ? 1 : 0)
      .input("TENNHIEMVU", sql.NVarChar(255), data.TEN_NHIEM_VU ?? null)
      .input("TENNHIEMVU_PASSED", sql.Bit, data.TEN_NHIEM_VU !== undefined ? 1 : 0)
      .input("MOTA", sql.NVarChar(sql.MAX), data.MO_TA ?? null)
      .input("MOTA_PASSED", sql.Bit, data.MO_TA !== undefined ? 1 : 0)
      .input("NGAYBATDAU", sql.Date, data.NGAY_BAT_DAU ?? null)
      .input("NGAYBATDAU_PASSED", sql.Bit, data.NGAY_BAT_DAU !== undefined ? 1 : 0)
      .input("NGAYKETTHUC", sql.Date, data.NGAY_KET_THUC ?? null)
      .input("NGAYKETTHUC_PASSED", sql.Bit, data.NGAY_KET_THUC !== undefined ? 1 : 0)
      .input("DOUUTIEN", sql.NVarChar(20), data.DO_UU_TIEN ?? null)
      .input("DOUUTIEN_PASSED", sql.Bit, data.DO_UU_TIEN !== undefined ? 1 : 0)
      .input("TRANGTHAI", sql.NVarChar(50), data.TRANG_THAI ?? null)
      .input("TRANGTHAI_PASSED", sql.Bit, data.TRANG_THAI !== undefined ? 1 : 0)
      .input("PHANTRAMHOANTHANH", sql.Int, data.PHAN_TRAM_HOAN_THANH ?? null)
      .input("PHANTRAMHOANTHANH_PASSED", sql.Bit, data.PHAN_TRAM_HOAN_THANH !== undefined ? 1 : 0)
      .input("GHICHUSAUHOANTHANH", sql.NVarChar(sql.MAX), data.GHI_CHU_SAU_HOAN_THANH ?? null)
      .input("GHICHUSAUHOANTHANH_PASSED", sql.Bit, data.GHI_CHU_SAU_HOAN_THANH !== undefined ? 1 : 0)
      .execute("sp_updateProjectTask");

    return mapTaskRow(result.recordset[0]);
  },

  getAllProjects: async () => {
    const result = await appPool
      .request()
      .execute("sp_getAllProjects");

    return result.recordset;
  },

  getProjectById: async (MA_DA) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .execute("sp_getProjectById");

    return result.recordset[0] || null;
  },

  getProjectMembers: async (MA_DA) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .execute("sp_getProjectMembers");

    return result.recordset;
  },

  getEmployeeProjects: async (MA_NV) => {
    const result = await appPool
      .request()
      .input("MANV", sql.VarChar(20), MA_NV)
      .execute("sp_getEmployeeProjects");

    return result.recordset;
  },

  getProjectsWithMembersByEmployee: async (MA_NV) => {
    const result = await appPool
      .request()
      .input("MANV", sql.VarChar(20), MA_NV)
      .execute("sp_getProjectsWithMembersByEmployee");

    return result.recordset;
  },

  createProject: async (data) => {
    const result = await appPool
      .request()
      .input("TENDA", sql.NVarChar(255), data.TEN_DA)
      .input("MOTA", sql.NVarChar(sql.MAX), data.MO_TA || null)
      .input("NGAYBATDAU", sql.Date, data.NGAY_BAT_DAU || new Date())
      .input("NGAYKETTHUC", sql.Date, data.NGAY_KET_THUC || null)
      .input("TRANGTHAI", sql.NVarChar(50), data.TRANG_THAI || "Đang lên kế hoạch")
      .execute("sp_createProject");

    return result.recordset[0] || null;
  },

  updateProject: async (MA_DA, data) => {
    await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .input("TENDA", sql.NVarChar(255), data.TEN_DA ?? null)
      .input("TENDA_PASSED", sql.Bit, data.TEN_DA !== undefined ? 1 : 0)
      .input("MOTA", sql.NVarChar(sql.MAX), data.MO_TA ?? null)
      .input("MOTA_PASSED", sql.Bit, data.MO_TA !== undefined ? 1 : 0)
      .input("NGAYBATDAU", sql.Date, data.NGAY_BAT_DAU ?? null)
      .input("NGAYBATDAU_PASSED", sql.Bit, data.NGAY_BAT_DAU !== undefined ? 1 : 0)
      .input("NGAYKETTHUC", sql.Date, data.NGAY_KET_THUC ?? null)
      .input("NGAYKETTHUC_PASSED", sql.Bit, data.NGAY_KET_THUC !== undefined ? 1 : 0)
      .input("TRANGTHAI", sql.NVarChar(50), data.TRANG_THAI ?? null)
      .input("TRANGTHAI_PASSED", sql.Bit, data.TRANG_THAI !== undefined ? 1 : 0)
      .execute("sp_updateProject");
  },

  deleteProjectTasks: async (MA_DA) => {
    await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .execute("sp_deleteProjectTasks");
  },

  deleteProjectAssignments: async (MA_DA) => {
    await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .execute("sp_deleteProjectAssignments");
  },

  deleteProject: async (MA_DA) => {
    await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .execute("sp_deleteProject");
  },

  addProjectMember: async (MA_DA, MA_NV, vaiTroDuAn) => {
    await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .input("MANV", sql.VarChar(20), MA_NV)
      .input("VaiTroDU_AN", sql.NVarChar(100), vaiTroDuAn)
      .execute("sp_addProjectMember");
  },

  updateProjectChatRoom: async (MA_DA, maPhongChat) => {
    await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .input("MAPHONGCHAT", sql.NVarChar(100), String(maPhongChat))
      .query("UPDATE DU_AN SET MA_PHONG_CHAT = @MAPHONGCHAT WHERE MA_DA = @MADA");
  },

  removeProjectMember: async (MA_DA, MA_NV) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .input("MANV", sql.VarChar(20), MA_NV)
      .execute("sp_removeProjectMember");

    const removedMemberCount = result.recordset?.[0]?.RemovedMemberCount || 0;
    if (removedMemberCount === 0) {
      throw new Error("Nhân viên không tồn tại trong dự án");
    }
  },
};

export default projectRepository;
