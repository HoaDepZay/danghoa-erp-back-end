import { appPool, sql } from "../../config/db";

export const phaseRepository = {
  getPhasesByProject: async (MA_DA: number) => {
    const result = await appPool.request()
      .input("MADA", sql.Int, MA_DA)
      .query(`
        SELECT * FROM GIAI_DOAN WHERE MA_DA = @MADA ORDER BY NGAY_BAT_DAU ASC
      `);
    return result.recordset;
  },

  createPhase: async (data: any) => {
    const result = await appPool.request()
      .input("MADA", sql.Int, data.maDa)
      .input("TENGD", sql.NVarChar(255), data.tenGd)
      .input("NGAYBATDAU", sql.Date, data.ngayBatDau || new Date())
      .input("NGAYKETTHUC", sql.Date, data.ngayKetThuc || null)
      .input("TRANGTHAI", sql.NVarChar(50), data.trangThai || 'Chưa bắt đầu')
      .query(`
        INSERT INTO GIAI_DOAN (MA_DA, TEN_GD, NGAY_BAT_DAU, NGAY_KET_THUC, TRANG_THAI)
        VALUES (@MADA, @TENGD, @NGAYBATDAU, @NGAYKETTHUC, @TRANGTHAI);
        SELECT * FROM GIAI_DOAN WHERE MA_GD = SCOPE_IDENTITY();
      `);
    return result.recordset[0];
  },

  updatePhase: async (MA_GD: number, data: any) => {
    const result = await appPool.request()
      .input("MAGD", sql.Int, MA_GD)
      .input("TENGD", sql.NVarChar(255), data.tenGd)
      .input("NGAYBATDAU", sql.Date, data.ngayBatDau)
      .input("NGAYKETTHUC", sql.Date, data.ngayKetThuc)
      .input("TRANGTHAI", sql.NVarChar(50), data.trangThai)
      .query(`
        UPDATE GIAI_DOAN
        SET TEN_GD = ISNULL(@TENGD, TEN_GD),
            NGAY_BAT_DAU = ISNULL(@NGAYBATDAU, NGAY_BAT_DAU),
            NGAY_KET_THUC = ISNULL(@NGAYKETTHUC, NGAY_KET_THUC),
            TRANG_THAI = ISNULL(@TRANGTHAI, TRANG_THAI)
        WHERE MA_GD = @MAGD;
        SELECT * FROM GIAI_DOAN WHERE MA_GD = @MAGD;
      `);
    return result.recordset[0];
  },

  deletePhase: async (MA_GD: number) => {
    await appPool.request().input("MAGD", sql.Int, MA_GD).query("DELETE FROM NHIEM_VU_GIAI_DOAN WHERE MA_GD = @MAGD");
    await appPool.request().input("MAGD", sql.Int, MA_GD).query("DELETE FROM PHAN_CONG_GIAI_DOAN WHERE MA_GD = @MAGD");
    await appPool.request().input("MAGD", sql.Int, MA_GD).query("DELETE FROM GIAI_DOAN WHERE MA_GD = @MAGD");
  },

  getPhaseAssignments: async (MA_GD: number) => {
    const result = await appPool.request()
      .input("MAGD", sql.Int, MA_GD)
      .query(`
        SELECT p.*, n.HO_TEN, n.EMAIL
        FROM PHAN_CONG_GIAI_DOAN p
        JOIN NHAN_VIEN n ON p.MA_NV = n.MA_NV
        WHERE p.MA_GD = @MAGD
      `);
    return result.recordset;
  },

  addPhaseAssignment: async (MA_GD: number, MA_NV: string, VAI_TRO: string) => {
    await appPool.request()
      .input("MAGD", sql.Int, MA_GD)
      .input("MANV", sql.VarChar(20), MA_NV)
      .input("VAITRO", sql.NVarChar(50), VAI_TRO)
      .query(`
        IF EXISTS (SELECT 1 FROM PHAN_CONG_GIAI_DOAN WHERE MA_GD = @MAGD AND MA_NV = @MANV)
            UPDATE PHAN_CONG_GIAI_DOAN SET VAI_TRO = @VAITRO WHERE MA_GD = @MAGD AND MA_NV = @MANV
        ELSE
        BEGIN
            DECLARE @MADA INT;
            SELECT @MADA = MA_DA FROM GIAI_DOAN WHERE MA_GD = @MAGD;
            INSERT INTO PHAN_CONG_GIAI_DOAN (MA_GD, MA_NV, VAI_TRO, MA_DA) VALUES (@MAGD, @MANV, @VAITRO, @MADA);
        END
      `);
  },

  removePhaseAssignment: async (MA_GD: number, MA_NV: string) => {
    await appPool.request()
      .input("MAGD", sql.Int, MA_GD)
      .input("MANV", sql.VarChar(20), MA_NV)
      .query("DELETE FROM PHAN_CONG_GIAI_DOAN WHERE MA_GD = @MAGD AND MA_NV = @MANV");
  },

  getEmployeeRoleInPhase: async (MA_GD: number, MA_NV: string) => {
    const result = await appPool.request()
      .input("MAGD", sql.Int, MA_GD)
      .input("MANV", sql.VarChar(20), MA_NV)
      .query("SELECT VAI_TRO FROM PHAN_CONG_GIAI_DOAN WHERE MA_GD = @MAGD AND MA_NV = @MANV");
    return result.recordset[0]?.VAI_TRO || null;
  },
  
  getPhaseById: async (MA_GD: number) => {
    const result = await appPool.request()
      .input("MAGD", sql.Int, MA_GD)
      .query("SELECT * FROM GIAI_DOAN WHERE MA_GD = @MAGD");
    return result.recordset[0] || null;
  },

  getTasksByPhase: async (MA_GD: number) => {
    const result = await appPool.request()
      .input("MAGD", sql.Int, MA_GD)
      .query(`
        SELECT 
          t.MA_NV_GD as MA_NV_GD,
          t.MA_GD as MA_GD,
          t.MA_NV as MA_NV,
          t.TENNHIEMVU as TEN_NHIEM_VU,
          t.MOTA as MO_TA,
          t.NGAYBATDAU as NGAY_BAT_DAU,
          t.NGAYKETTHUC as NGAY_KET_THUC,
          t.DOUUTIEN as DO_UU_TIEN,
          t.TRANGTHAI as TRANG_THAI,
          t.PHANTRAMHOANTHANH as PHAN_TRAM_HOAN_THANH,
          t.GHICHUSAUHOANTHANH as GHI_CHU_SAU_HOAN_THANH,
          t.CREATEDAT as CREATED_AT,
          n.HO_TEN as TEN_NGUOI_THUC_HIEN 
        FROM NHIEM_VU_GIAI_DOAN t
        LEFT JOIN NHAN_VIEN n ON t.MA_NV = n.MA_NV
        WHERE t.MA_GD = @MAGD
      `);
      return result.recordset;
  },
  
  createTask: async (data: any) => {
    const result = await appPool.request()
      .input("MAGD", sql.Int, data.maGd)
      .input("MANV", sql.VarChar(20), data.maNv || null)
      .input("TENNHIEMVU", sql.NVarChar(255), data.tenNhiemVu)
      .input("MOTA", sql.NVarChar(sql.MAX), data.moTa || null)
      .input("NGAYBATDAU", sql.Date, data.ngayBatDau || null)
      .input("NGAYKETTHUC", sql.Date, data.ngayKetThuc || null)
      .input("DOUUTIEN", sql.NVarChar(20), data.doUuTien || null)
      .input("TRANGTHAI", sql.NVarChar(50), data.trangThai || 'Mới')
      .input("PHANTRAM", sql.Int, data.phanTramHoanThanh || 0)
      .query(`
        INSERT INTO NHIEM_VU_GIAI_DOAN (MA_GD, MA_NV, TENNHIEMVU, MOTA, NGAYBATDAU, NGAYKETTHUC, DOUUTIEN, TRANGTHAI, PHANTRAMHOANTHANH)
        VALUES (@MAGD, @MANV, @TENNHIEMVU, @MOTA, @NGAYBATDAU, @NGAYKETTHUC, @DOUUTIEN, @TRANGTHAI, @PHANTRAM);
        SELECT 
          MA_NV_GD as MA_NV_GD,
          MA_GD as MA_GD,
          MA_NV as MA_NV,
          TENNHIEMVU as TEN_NHIEM_VU,
          MOTA as MO_TA,
          NGAYBATDAU as NGAY_BAT_DAU,
          NGAYKETTHUC as NGAY_KET_THUC,
          DOUUTIEN as DO_UU_TIEN,
          TRANGTHAI as TRANG_THAI,
          PHANTRAMHOANTHANH as PHAN_TRAM_HOAN_THANH,
          GHICHUSAUHOANTHANH as GHI_CHU_SAU_HOAN_THANH,
          CREATEDAT as CREATED_AT 
        FROM NHIEM_VU_GIAI_DOAN WHERE MA_NV_GD = SCOPE_IDENTITY();
      `);
    return result.recordset[0];
  },

  updateTask: async (MA_NV_GD: number, data: any) => {
    let phanTram = data.phanTramHoanThanh;
    if (data.trangThai === 'Đã duyệt') {
      phanTram = 100;
    }
    const result = await appPool.request()
      .input("MANVGD", sql.Int, MA_NV_GD)
      .input("MANV", sql.VarChar(20), data.maNv)
      .input("TENNHIEMVU", sql.NVarChar(255), data.tenNhiemVu)
      .input("MOTA", sql.NVarChar(sql.MAX), data.moTa)
      .input("NGAYBATDAU", sql.Date, data.ngayBatDau)
      .input("NGAYKETTHUC", sql.Date, data.ngayKetThuc)
      .input("DOUUTIEN", sql.NVarChar(20), data.doUuTien)
      .input("TRANGTHAI", sql.NVarChar(50), data.trangThai)
      .input("PHANTRAM", sql.Int, phanTram)
      .query(`
        UPDATE NHIEM_VU_GIAI_DOAN
        SET MA_NV = ISNULL(@MANV, MA_NV),
            TENNHIEMVU = ISNULL(@TENNHIEMVU, TENNHIEMVU),
            MOTA = ISNULL(@MOTA, MOTA),
            NGAYBATDAU = ISNULL(@NGAYBATDAU, NGAYBATDAU),
            NGAYKETTHUC = ISNULL(@NGAYKETTHUC, NGAYKETTHUC),
            DOUUTIEN = ISNULL(@DOUUTIEN, DOUUTIEN),
            TRANGTHAI = ISNULL(@TRANGTHAI, TRANGTHAI),
            PHANTRAMHOANTHANH = ISNULL(@PHANTRAM, PHANTRAMHOANTHANH)
        WHERE MA_NV_GD = @MANVGD;
        SELECT 
          MA_NV_GD as MA_NV_GD,
          MA_GD as MA_GD,
          MA_NV as MA_NV,
          TENNHIEMVU as TEN_NHIEM_VU,
          MOTA as MO_TA,
          NGAYBATDAU as NGAY_BAT_DAU,
          NGAYKETTHUC as NGAY_KET_THUC,
          DOUUTIEN as DO_UU_TIEN,
          TRANGTHAI as TRANG_THAI,
          PHANTRAMHOANTHANH as PHAN_TRAM_HOAN_THANH,
          GHICHUSAUHOANTHANH as GHI_CHU_SAU_HOAN_THANH,
          CREATEDAT as CREATED_AT 
        FROM NHIEM_VU_GIAI_DOAN WHERE MA_NV_GD = @MANVGD;
      `);
    return result.recordset[0];
  },

  deleteTask: async (MA_NV_GD: number) => {
    await appPool.request().input("MANVGD", sql.Int, MA_NV_GD).query("DELETE FROM NHIEM_VU_GIAI_DOAN WHERE MA_NV_GD = @MANVGD");
  },
  
  getTaskById: async (MA_NV_GD: number) => {
     const result = await appPool.request()
       .input("MANVGD", sql.Int, MA_NV_GD)
       .query("SELECT * FROM NHIEM_VU_GIAI_DOAN WHERE MA_NV_GD = @MANVGD");
     return result.recordset[0];
  }
};
