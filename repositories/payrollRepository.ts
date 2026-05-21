import { appPool, sql } from "../config/db";

const payrollRepository = {
  checkIn: async (maNv) => {
    const result = await appPool
      .request()
      .input("MaNV", sql.VarChar, maNv)
      .output("Result", sql.Int)
      .output("ErrorDetail", sql.NVarChar(500))
      .execute("sp_CheckIn");

    return {
      success: result.output.Result === 1,
      result: result.output.Result,
      message: result.output.ErrorDetail,
    };
  },

  checkOut: async (maNv) => {
    const result = await appPool
      .request()
      .input("MaNV", sql.VarChar, maNv)
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
    const result = await appPool.request().input("Ngay", sql.Date, date).query(`
        SELECT
          bc.MaCC,
          bc.MaNV,
          nv.HOTEN,
          bc.Ngay,
          bc.GioVao,
          bc.GioRa,
          bc.DiTre,
          bc.BuoiLamViec,
          bc.TrangThai
        FROM BAN_CHAM_CONG bc
        LEFT JOIN NHAN_VIEN nv ON nv.MANV = bc.MaNV
        WHERE bc.Ngay = @Ngay
        ORDER BY bc.MaNV
      `);
    return result.recordset;
  },

  // Lấy chấm công của nhân viên theo ngày hoặc khoảng ngày
  getEmployeeAttendance: async (maNv, fromDate, toDate) => {
    let query = `
      SELECT
        bc.MaCC,
        bc.MaNV,
        nv.HOTEN,
        bc.Ngay,
        bc.GioVao,
        bc.GioRa,
        bc.DiTre,
        bc.BuoiLamViec,
        bc.TrangThai
      FROM BAN_CHAM_CONG bc
      LEFT JOIN NHAN_VIEN nv ON nv.MANV = bc.MaNV
      WHERE bc.MaNV = @MaNV
    `;

    const request = appPool.request();
    request.input("MaNV", sql.VarChar, maNv);

    if (fromDate) {
      query += ` AND bc.Ngay >= @FromDate`;
      request.input("FromDate", sql.Date, fromDate);
    }

    if (toDate) {
      query += ` AND bc.Ngay <= @ToDate`;
      request.input("ToDate", sql.Date, toDate);
    }

    query += ` ORDER BY bc.Ngay DESC`;

    const result = await request.query(query);
    return result.recordset;
  },

  // Lấy danh sách lương tháng
  getPayrollByMonth: async (month, year) => {
    const result = await appPool
      .request()
      .input("Thang", sql.Int, month)
      .input("Nam", sql.Int, year).query(`
        SELECT
          bl.MaNV,
          nv.HOTEN,
          bl.Thang,
          bl.Nam,
          bl.GiolamViec,
          bl.PhuCap,
          bl.BHXH,
          bl.Thuong,
          bl.ThueTNCN,
          bl.ThucLanh
        FROM BANG_LUONG bl
        LEFT JOIN NHAN_VIEN nv ON nv.MANV = bl.MaNV
        WHERE bl.Thang = @Thang
          AND bl.Nam = @Nam
        ORDER BY bl.MaNV
      `);
    return result.recordset;
  },

  // Lấy chi tiết lương của NV
  getEmployeePayslip: async (maNv, month, year) => {
    const result = await appPool
      .request()
      .input("MaNV", sql.VarChar, maNv)
      .input("Thang", sql.Int, month)
      .input("Nam", sql.Int, year).query(`
        SELECT TOP 1
          bl.MaNV,
          nv.HOTEN,
          bl.Thang,
          bl.Nam,
          bl.GiolamViec,
          bl.PhuCap,
          bl.BHXH,
          bl.Thuong,
          bl.ThueTNCN,
          bl.ThucLanh
        FROM BANG_LUONG bl
        LEFT JOIN NHAN_VIEN nv ON nv.MANV = bl.MaNV
        WHERE bl.MaNV = @MaNV
          AND bl.Thang = @Thang
          AND bl.Nam = @Nam
      `);
    return result.recordset[0] || null;
  },
};

export default payrollRepository;
