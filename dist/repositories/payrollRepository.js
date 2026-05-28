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
        const result = await db_1.appPool
            .request()
            .input("NGAY", db_1.sql.Date, date)
            .execute("sp_getAttendanceByDate");
        return result.recordset;
    },
    // Lấy chấm công của nhân viên theo ngày hoặc khoảng ngày
    getEmployeeAttendance: async (maNv, fromDate, toDate) => {
        const result = await db_1.appPool
            .request()
            .input("MANV", db_1.sql.VarChar(20), maNv)
            .input("FROMDATE", db_1.sql.Date, fromDate ?? null)
            .input("TODATE", db_1.sql.Date, toDate ?? null)
            .execute("sp_getEmployeeAttendance");
        return result.recordset;
    },
    // Lấy danh sách lương tháng
    getPayrollByMonth: async (month, year) => {
        const result = await db_1.appPool
            .request()
            .input("THANG", db_1.sql.Int, month)
            .input("NAM", db_1.sql.Int, year)
            .execute("sp_getPayrollByMonth");
        return result.recordset;
    },
    // Lấy chi tiết lương của NV
    getEmployeePayslip: async (maNv, month, year) => {
        const result = await db_1.appPool
            .request()
            .input("MANV", db_1.sql.VarChar(20), maNv)
            .input("THANG", db_1.sql.Int, month)
            .input("NAM", db_1.sql.Int, year)
            .execute("sp_getEmployeePayslip");
        return result.recordset[0] || null;
    },
    // Chốt lương tháng
    closePayrollForMonth: async (month, year) => {
        const result = await db_1.appPool
            .request()
            .input("THANG", db_1.sql.Int, month)
            .input("NAM", db_1.sql.Int, year)
            .execute("sp_ThucThiTinhLuong");
        return result.rowsAffected[0] || 0;
    },
    // Kiểm tra tháng đã chốt lương chưa
    checkIfPayrollClosed: async (month, year) => {
        const result = await db_1.appPool
            .request()
            .input("THANG", db_1.sql.Int, month)
            .input("NAM", db_1.sql.Int, year)
            .query("SELECT COUNT(1) as cnt FROM BANG_LUONG WHERE THANG = @THANG AND NAM = @NAM");
        return (result.recordset[0]?.cnt || 0) > 0;
    },
};
exports.default = payrollRepository;
