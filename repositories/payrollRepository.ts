import { appPool, sql } from "../config/db";

const payrollRepository = {
  checkIn: async (MA_NV) => {
    try {
      await appPool
        .request()
        .input("MaNV", sql.VarChar, MA_NV)
        .execute("sp_CheckIn");

      // Update BAN_CHAM_CONG status to Đang làm việc after check-in
      try {
        await appPool.request()
          .input("MaNV", sql.VarChar(20), MA_NV)
          .query(`
            UPDATE BAN_CHAM_CONG 
            SET TRANG_THAI = N'Đang làm việc'
            WHERE MA_NV = @MaNV AND NGAY = CAST(DATEADD(HOUR, 7, GETUTCDATE()) AS DATE)
          `);
      } catch (err) {
        console.error("Lỗi cập nhật trạng thái BAN_CHAM_CONG:", err);
      }

      return {
        success: true,
        message: "Check-in thành công",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  checkOut: async (MA_NV) => {
    try {
      await appPool
        .request()
        .input("MaNV", sql.VarChar, MA_NV)
        .execute("sp_CheckOut");

      return {
        success: true,
        message: "Check-out thành công",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  // Lấy danh sách chấm công theo ngày
  getAttendanceByDate: async (date) => {
    const result = await appPool
      .request()
      .input("NGAY", sql.Date, date)
      .execute("sp_getAttendanceByDate");

    return result.recordset;
  },

  // Lấy chấm công của nhân viên theo ngày hoặc khoảng ngày
  getEmployeeAttendance: async (MA_NV, fromDate, toDate) => {
    const result = await appPool
      .request()
      .input("MANV", sql.VarChar(20), MA_NV)
      .input("FROMDATE", sql.Date, fromDate ?? null)
      .input("TODATE", sql.Date, toDate ?? null)
      .execute("sp_getEmployeeAttendance");

    return result.recordset;
  },

  // Lấy danh sách lương tháng
  getPayrollByMonth: async (month, year) => {
    const result = await appPool
      .request()
      .input("THANG", sql.Int, month)
      .input("NAM", sql.Int, year)
      .execute("sp_getPayrollByMonth");

    return result.recordset;
  },

  // Lấy chi tiết lương của NV 
  getEmployeePayslip: async (MA_NV, month, year) => {
    // Dùng tài khoản mặc định (appPool) để lấy lương của bất kỳ ai
    // (Bảo mật được đảm bảo thông qua checkMaNVParamOwnership ở tầng Router)
    const result = await appPool
      .request()
      .input("MANV", sql.VarChar(20), MA_NV)
      .input("THANG", sql.Int, month)
      .input("NAM", sql.Int, year)
      .execute("sp_getEmployeePayslip");

    return result.recordset[0] || null;
  },

  // Chốt lương tháng
  closePayrollForMonth: async (month, year) => {
    const result = await appPool
      .request()
      .input("THANG", sql.Int, month)
      .input("NAM", sql.Int, year)
      .execute("sp_ThucThiTinhLuong");

    return result.rowsAffected[0] || 0;
  },

  // Kiểm tra tháng đã chốt lương chưa
  checkIfPayrollClosed: async (month, year) => {
    const result = await appPool
      .request()
      .input("THANG", sql.Int, month)
      .input("NAM", sql.Int, year)
      .query("SELECT COUNT(1) as cnt FROM BANG_LUONG WHERE THANG = @THANG AND NAM = @NAM");
    return (result.recordset[0]?.cnt || 0) > 0;
  },

  updatePayroll: async (id, data) => {
    const q = `
      UPDATE BANG_LUONG 
      SET SoNgayCongThucTe = @SoNgay,
          PhuCap = @PhuCap,
          Thuong = @Thuong,
          KhauTruBHXH = @KhauTru,
          ThucLanh = (LuongCoBan / 22) * @SoNgay + @PhuCap + @Thuong - @KhauTru
      WHERE MaBL = @MaBL
    `;
    await appPool
      .request()
      .input("MaBL", sql.Int, id)
      .input("SoNgay", sql.Float, data.SO_NGAY_CONG_THUC_TE ?? 0)
      .input("PhuCap", sql.Decimal, data.PHU_CAP ?? 0)
      .input("Thuong", sql.Decimal, data.THUONG ?? 0)
      .input("KhauTru", sql.Decimal, data.KHAU_TRU_BHXH ?? 0)
      .query(q);
  },
};

export default payrollRepository;
