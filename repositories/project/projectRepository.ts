import { appPool, sql } from "../../config/db";

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

    return result.recordset[0]?.VAI_TRO || result.recordset[0]?.VaiTroDuAn || null;
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
      .input("CONGKHAI", sql.Bit, data.CONG_KHAI !== undefined ? data.CONG_KHAI : 1)
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
      .input("CONGKHAI", sql.Bit, data.CONG_KHAI ?? null)
      .input("CONGKHAI_PASSED", sql.Bit, data.CONG_KHAI !== undefined ? 1 : 0)
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

  addProjectMember: async (MA_DA, MA_NV, MA_VAI_TRO) => {
    await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .input("MANV", sql.VarChar(20), MA_NV)
      .input("MA_VAI_TRO", sql.Int, MA_VAI_TRO)
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

  getAllProjectRoles: async () => {
    const result = await appPool.query("SELECT * FROM VAI_TRO_DU_AN ORDER BY MA_VAI_TRO ASC");
    return result.recordset;
  },

  createProjectRole: async (tenVaiTro) => {
    const check = await appPool.request()
      .input("TenVaiTro", sql.NVarChar(100), tenVaiTro)
      .query("SELECT * FROM VAI_TRO_DU_AN WHERE TEN_VAI_TRO = @TenVaiTro");
    
    if (check.recordset.length > 0) {
      return check.recordset[0];
    }

    const insert = await appPool.request()
      .input("TenVaiTro", sql.NVarChar(100), tenVaiTro)
      .query("INSERT INTO VAI_TRO_DU_AN (TEN_VAI_TRO) OUTPUT INSERTED.* VALUES (@TenVaiTro)");
    return insert.recordset[0];
  },

  createProjectFullTransaction: async (data: any) => {
    const transaction = new sql.Transaction(appPool);
    await transaction.begin();

    try {
      // 1. Create Project
      const reqProject = new sql.Request(transaction);
      reqProject.input("TENDA", sql.NVarChar(255), data.project.TEN_DA);
      reqProject.input("MOTA", sql.NVarChar(sql.MAX), data.project.MO_TA || null);
      reqProject.input("NGAYBATDAU", sql.Date, data.project.NGAY_BAT_DAU || new Date());
      reqProject.input("NGAYKETTHUC", sql.Date, data.project.NGAY_KET_THUC || null);
      reqProject.input("TRANGTHAI", sql.NVarChar(50), data.project.TRANG_THAI || "Đang lên kế hoạch");
      reqProject.input("CONGKHAI", sql.Bit, data.project.CONG_KHAI !== undefined ? data.project.CONG_KHAI : 1);
      
      const projectResult = await reqProject.execute("sp_createProject");
      const maDa = projectResult.recordset[0]?.MA_DA;
      
      if (!maDa) throw new Error("Could not create project");

      // 2. Create Project Members
      for (const member of data.members || []) {
         const reqMember = new sql.Request(transaction);
         reqMember.input("MADA", sql.Int, maDa);
         reqMember.input("MANV", sql.VarChar(20), member.MA_NV);
         reqMember.input("MA_VAI_TRO", sql.Int, member.MA_VAI_TRO);
         await reqMember.execute("sp_addProjectMember");
      }

      // 3. Create Phases & Tasks
      for (const phase of data.phases || []) {
         const reqPhase = new sql.Request(transaction);
         reqPhase.input("MADA", sql.Int, maDa);
         reqPhase.input("TENGD", sql.NVarChar(255), phase.tenGd);
         reqPhase.input("NGAYBATDAU", sql.Date, phase.ngayBatDau || new Date());
         reqPhase.input("NGAYKETTHUC", sql.Date, phase.ngayKetThuc || null);
         reqPhase.input("TRANGTHAI", sql.NVarChar(50), phase.trangThai || 'Chưa bắt đầu');
         
         const phaseResult = await reqPhase.query(`
           INSERT INTO GIAI_DOAN (MA_DA, TEN_GD, NGAY_BAT_DAU, NGAY_KET_THUC, TRANG_THAI)
           VALUES (@MADA, @TENGD, @NGAYBATDAU, @NGAYKETTHUC, @TRANGTHAI);
           SELECT SCOPE_IDENTITY() AS MA_GD;
         `);
         const maGd = phaseResult.recordset[0]?.MA_GD;
         if (!maGd) throw new Error("Could not create phase");

         // Phase Members
         for (const pm of phase.members || []) {
           const reqPm = new sql.Request(transaction);
           reqPm.input("MAGD", sql.Int, maGd);
           reqPm.input("MANV", sql.VarChar(20), pm.MA_NV);
           reqPm.input("VAITRO", sql.NVarChar(50), pm.VAI_TRO || 'Nhân viên');
           reqPm.input("MADA", sql.Int, maDa);
           await reqPm.query(`
              INSERT INTO PHAN_CONG_GIAI_DOAN (MA_GD, MA_NV, VAI_TRO, MA_DA) VALUES (@MAGD, @MANV, @VAITRO, @MADA);
           `);
         }

         // Tasks
         for (const task of phase.tasks || []) {
           const reqTask = new sql.Request(transaction);
           reqTask.input("MAGD", sql.Int, maGd);
           reqTask.input("MANV", sql.VarChar(20), task.maNv || null);
           reqTask.input("TENNHIEMVU", sql.NVarChar(255), task.tenNhiemVu);
           reqTask.input("MOTA", sql.NVarChar(sql.MAX), task.moTa || null);
           reqTask.input("NGAYBATDAU", sql.Date, task.ngayBatDau || null);
           reqTask.input("NGAYKETTHUC", sql.Date, task.ngayKetThuc || null);
           reqTask.input("DOUUTIEN", sql.NVarChar(20), task.doUuTien || null);
           reqTask.input("TRANGTHAI", sql.NVarChar(50), task.trangThai || 'Mới');
           reqTask.input("PHANTRAM", sql.Int, task.phanTramHoanThanh || 0);
           
           await reqTask.query(`
             INSERT INTO NHIEM_VU_GIAI_DOAN (MA_GD, MA_NV, TENNHIEMVU, MOTA, NGAYBATDAU, NGAYKETTHUC, DOUUTIEN, TRANGTHAI, PHANTRAMHOANTHANH)
             VALUES (@MAGD, @MANV, @TENNHIEMVU, @MOTA, @NGAYBATDAU, @NGAYKETTHUC, @DOUUTIEN, @TRANGTHAI, @PHANTRAM);
           `);
         }
      }

      await transaction.commit();
      return maDa;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

export default projectRepository;
