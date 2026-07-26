import { appPool, sql } from "../config/db";

const recruitmentRepository = {
  // 1. Lấy danh sách Chiến dịch (có filter theo trạng thái)
  getCampaigns: async (status?: string) => {
    let query = `
      SELECT CD.*, PB.TEN_PB AS TEN_PHONG_BAN,
             (SELECT COUNT(*) FROM UNG_VIEN UV WHERE UV.MA_CD = CD.MA_CD) AS TONG_UNG_VIEN
      FROM CHIEN_DICH_TUYEN_DUNG CD
      LEFT JOIN PHONG_BAN PB ON CD.MA_PHG = PB.MA_PHG
    `;
    if (status) {
      query += ` WHERE CD.TRANG_THAI = @Status`;
    }
    query += ` ORDER BY CD.NGAY_TAO DESC`;

    const request = appPool.request();
    if (status) request.input("Status", sql.VarChar, status);
    
    const result = await request.query(query);
    return result.recordset;
  },

  getCampaignById: async (id: string) => {
    const result = await appPool.request()
      .input("Id", sql.VarChar, id)
      .query(`
        SELECT CD.*, PB.TEN_PB AS TEN_PHONG_BAN
        FROM CHIEN_DICH_TUYEN_DUNG CD
        LEFT JOIN PHONG_BAN PB ON CD.MA_PHG = PB.MA_PHG
        WHERE CD.MA_CD = @Id
      `);
    return result.recordset[0] || null;
  },

  createCampaign: async (data: any) => {
    const result = await appPool.request()
      .input("MaCD", sql.VarChar, data.MA_CD)
      .input("TieuDe", sql.NVarChar, data.TIEU_DE)
      .input("MaPhg", sql.Int, data.MA_PHG)
      .input("SoLuong", sql.Int, data.SO_LUONG || 1)
      .input("HanNop", sql.Date, data.HAN_NOP || null)
      .input("TrangThai", sql.VarChar, data.TRANG_THAI || 'OPEN')
      .input("MoTa", sql.NVarChar, data.MO_TA_CONG_VIEC || null)
      .input("YeuCau", sql.NVarChar, data.YEU_CAU_CONG_VIEC || null)
      .input("QuyenLoi", sql.NVarChar, data.QUYEN_LOI || null)
      .input("MucLuong", sql.NVarChar, data.MUC_LUONG || null)
      .input("DiaDiem", sql.NVarChar, data.DIA_DIEM || null)
      .input("LoaiHinh", sql.VarChar, data.LOAI_HINH || 'Full-time')
      .input("KinhNghiem", sql.NVarChar, data.KINH_NGHIEM || null)
      .query(`
        INSERT INTO CHIEN_DICH_TUYEN_DUNG (
          MA_CD, TIEU_DE, MA_PHG, SO_LUONG, HAN_NOP, TRANG_THAI,
          MO_TA_CONG_VIEC, YEU_CAU_CONG_VIEC, QUYEN_LOI, MUC_LUONG, DIA_DIEM, LOAI_HINH, KINH_NGHIEM
        )
        VALUES (
          @MaCD, @TieuDe, @MaPhg, @SoLuong, @HanNop, @TrangThai,
          @MoTa, @YeuCau, @QuyenLoi, @MucLuong, @DiaDiem, @LoaiHinh, @KinhNghiem
        )
      `);
    return result;
  },

  updateCampaign: async (id: string, data: any) => {
    const result = await appPool.request()
      .input("Id", sql.VarChar, id)
      .input("TieuDe", sql.NVarChar, data.TIEU_DE)
      .input("MaPhg", sql.Int, data.MA_PHG)
      .input("SoLuong", sql.Int, data.SO_LUONG || 1)
      .input("HanNop", sql.Date, data.HAN_NOP || null)
      .input("TrangThai", sql.VarChar, data.TRANG_THAI || 'OPEN')
      .input("MoTa", sql.NVarChar, data.MO_TA_CONG_VIEC || null)
      .input("YeuCau", sql.NVarChar, data.YEU_CAU_CONG_VIEC || null)
      .input("QuyenLoi", sql.NVarChar, data.QUYEN_LOI || null)
      .input("MucLuong", sql.NVarChar, data.MUC_LUONG || null)
      .input("DiaDiem", sql.NVarChar, data.DIA_DIEM || null)
      .input("LoaiHinh", sql.VarChar, data.LOAI_HINH || 'Full-time')
      .input("KinhNghiem", sql.NVarChar, data.KINH_NGHIEM || null)
      .query(`
        UPDATE CHIEN_DICH_TUYEN_DUNG SET
          TIEU_DE = @TieuDe,
          MA_PHG = @MaPhg,
          SO_LUONG = @SoLuong,
          HAN_NOP = @HanNop,
          TRANG_THAI = @TrangThai,
          MO_TA_CONG_VIEC = @MoTa,
          YEU_CAU_CONG_VIEC = @YeuCau,
          QUYEN_LOI = @QuyenLoi,
          MUC_LUONG = @MucLuong,
          DIA_DIEM = @DiaDiem,
          LOAI_HINH = @LoaiHinh,
          KINH_NGHIEM = @KinhNghiem
        WHERE MA_CD = @Id
      `);
    return result;
  },

  deleteCampaign: async (id: string) => {
    await appPool.request().input("Id", sql.VarChar, id).query(`DELETE FROM UNG_VIEN WHERE MA_CD = @Id`);
    const result = await appPool.request().input("Id", sql.VarChar, id).query(`DELETE FROM CHIEN_DICH_TUYEN_DUNG WHERE MA_CD = @Id`);
    return result;
  },

  // 2. Lấy danh sách Ứng viên (theo Campaign)
  getApplicants: async (maCD?: string) => {
    let query = `SELECT * FROM UNG_VIEN`;
    if (maCD) query += ` WHERE MA_CD = @MaCD`;
    query += ` ORDER BY NGAY_UNG_TUYEN DESC`;

    const request = appPool.request();
    if (maCD) request.input("MaCD", sql.VarChar, maCD);
    
    const result = await request.query(query);
    return result.recordset;
  },

  createApplicant: async (data: any) => {
    const result = await appPool.request()
      .input("MaUV", sql.VarChar, data.MA_UV)
      .input("MaCD", sql.VarChar, data.MA_CD)
      .input("HoTen", sql.NVarChar, data.HO_TEN)
      .input("Email", sql.VarChar, data.EMAIL)
      .input("SDT", sql.VarChar, data.SO_DIEN_THOAI)
      .input("UrlCV", sql.NVarChar, data.URL_CV || null)
      .input("TrangThai", sql.VarChar, data.TRANG_THAI || 'NEW')
      .query(`
        INSERT INTO UNG_VIEN (MA_UV, MA_CD, HO_TEN, EMAIL, SO_DIEN_THOAI, URL_CV, TRANG_THAI)
        VALUES (@MaUV, @MaCD, @HoTen, @Email, @SDT, @UrlCV, @TrangThai)
      `);
    return result;
  },

  updateApplicantStatus: async (maUV: string, status: string, ghiChu?: string) => {
    let query = `UPDATE UNG_VIEN SET TRANG_THAI = @Status`;
    const request = appPool.request()
      .input("MaUV", sql.VarChar, maUV)
      .input("Status", sql.VarChar, status);
      
    if (ghiChu !== undefined) {
      query += `, GHI_CHU = @GhiChu`;
      request.input("GhiChu", sql.NVarChar, ghiChu);
    }
    
    query += ` WHERE MA_UV = @MaUV`;
    await request.query(query);
  },

  convertApplicantToEmployee: async (maUV: string, maNV: string, maPhg: number) => {
    // Transaction để insert nhân viên và update trạng thái ứng viên
    const transaction = new sql.Transaction(appPool);
    try {
      await transaction.begin();
      
      const applicantRes = await transaction.request()
        .input("MaUV", sql.VarChar, maUV)
        .query(`SELECT * FROM UNG_VIEN WHERE MA_UV = @MaUV`);
        
      const applicant = applicantRes.recordset[0];
      if (!applicant) throw new Error("Không tìm thấy ứng viên");

      // Insert Nhân viên (thông tin cơ bản)
      await transaction.request()
        .input("MaNV", sql.VarChar, maNV)
        .input("HoTen", sql.NVarChar, applicant.HO_TEN)
        .input("Email", sql.VarChar, applicant.EMAIL)
        .input("SDT", sql.VarChar, applicant.SO_DIEN_THOAI)
        .input("MaPhg", sql.Int, maPhg)
        .input("NgayTuyenDung", sql.Date, new Date())
        .query(`
          INSERT INTO NHAN_VIEN (MA_NV, HO_TEN, EMAIL, SDT, MA_PHG, NGAY_TUYEN_DUNG, TRANG_THAI_LAM_VIEC)
          VALUES (@MaNV, @HoTen, @Email, @SDT, @MaPhg, @NgayTuyenDung, 'Đang làm việc')
        `);

      // Update trạng thái UV thành HIRED
      await transaction.request()
        .input("MaUV", sql.VarChar, maUV)
        .query(`UPDATE UNG_VIEN SET TRANG_THAI = 'HIRED' WHERE MA_UV = @MaUV`);

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};

export default recruitmentRepository;
