import { appPool, sql } from "../config/db";

const payrollRepository = {
  checkIn: async (MA_NV) => {
    const result = await appPool
      .request()
      .input("MaNV", sql.VarChar, MA_NV)
      .output("Result", sql.Int)
      .output("ErrorDetail", sql.NVarChar(500))
      .execute("sp_CheckIn");

    if (result.output.Result === 1) {
      try {
        await appPool.request()
          .input("MaNV", sql.VarChar(20), MA_NV)
          .query(`
            UPDATE BAN_CHAM_CONG 
            SET TRANG_THAI = N'Đang làm việc'
            WHERE MA_NV = @MaNV AND NGAY = CAST(GETDATE() AS DATE)
          `);
      } catch (err) {
        console.error("Lỗi cập nhật trạng thái BAN_CHAM_CONG:", err);
      }
    }

    return {
      success: result.output.Result === 1,
      result: result.output.Result,
      message: result.output.ErrorDetail,
    };
  },

  checkOut: async (MA_NV) => {
    const result = await appPool
      .request()
      .input("MaNV", sql.VarChar, MA_NV)
      .output("Result", sql.Int)
      .output("ErrorDetail", sql.NVarChar(500))
      .execute("sp_CheckOut");

    return {
      success: result.output.Result === 1,
      result: result.output.Result,
      message: result.output.ErrorDetail,
    };
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
};

export default payrollRepository;
