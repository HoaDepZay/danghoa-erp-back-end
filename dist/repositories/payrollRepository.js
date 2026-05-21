"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const payrollRepository = {
    checkIn: async (maNv) => {
        const result = await db_1.appPool
            .request()
            .input("MaNV", db_1.sql.VarChar, maNv)
            .output("Result", db_1.sql.Int)
            .output("ErrorDetail", db_1.sql.NVarChar(500))
            .execute("sp_CheckIn");
        return {
            success: result.output.Result === 1,
            result: result.output.Result,
            message: result.output.ErrorDetail,
        };
    },
    checkOut: async (maNv) => {
        const result = await db_1.appPool
            .request()
            .input("MaNV", db_1.sql.VarChar, maNv)
            .output("Result", db_1.sql.Int)
            .output("ErrorDetail", db_1.sql.NVarChar(500))
            .execute("sp_CheckOut");
        return {
            success: result.output.Result === 1,
            result: result.output.Result,
            message: result.output.ErrorDetail,
        };
    },
    // Lấy danh sách chấm công theo ngày
    getAttendanceByDate: async (date) => {
        const result = await db_1.appPool.request().input("Ngay", db_1.sql.Date, date).query(`
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
        const request = db_1.appPool.request();
        request.input("MaNV", db_1.sql.VarChar, maNv);
        if (fromDate) {
            query += ` AND bc.Ngay >= @FromDate`;
            request.input("FromDate", db_1.sql.Date, fromDate);
        }
        if (toDate) {
            query += ` AND bc.Ngay <= @ToDate`;
            request.input("ToDate", db_1.sql.Date, toDate);
        }
        query += ` ORDER BY bc.Ngay DESC`;
        const result = await request.query(query);
        return result.recordset;
    },
    // Lấy danh sách lương tháng
    getPayrollByMonth: async (month, year) => {
        const result = await db_1.appPool
            .request()
            .input("Thang", db_1.sql.Int, month)
            .input("Nam", db_1.sql.Int, year).query(`
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
        const result = await db_1.appPool
            .request()
            .input("MaNV", db_1.sql.VarChar, maNv)
            .input("Thang", db_1.sql.Int, month)
            .input("Nam", db_1.sql.Int, year).query(`
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
exports.default = payrollRepository;
