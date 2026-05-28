"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const payrollRepository_1 = __importDefault(require("../repositories/payrollRepository"));
const getPreviousMonthYear = () => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - 1);
    return {
        month: targetDate.getMonth() + 1,
        year: targetDate.getFullYear(),
    };
};
const resolveErrorMessage = (error, fallback = "Đã xảy ra lỗi không xác định") => {
    if (error instanceof Error && error.message?.trim()) {
        return error.message;
    }
    const unknownError = error;
    const originalMessage = unknownError?.originalError?.info?.message;
    if (typeof originalMessage === "string" && originalMessage.trim()) {
        return originalMessage;
    }
    const firstPrecedingMessage = unknownError?.precedingErrors?.[0]?.message;
    if (typeof firstPrecedingMessage === "string" &&
        firstPrecedingMessage.trim()) {
        return firstPrecedingMessage;
    }
    if (typeof unknownError?.message === "string" &&
        unknownError.message.trim()) {
        return unknownError.message;
    }
    return fallback;
};
const payrollService = {
    checkIn: async (maNv) => {
        try {
            if (!maNv?.trim()) {
                throw new Error("Mã nhân viên (maNV) là bắt buộc");
            }
            const result = await payrollRepository_1.default.checkIn(maNv);
            if (!result.success) {
                throw new Error(result.message || "Check-in thất bại");
            }
            return {
                success: true,
                message: result.message || "Check-in thành công",
                data: result,
            };
        }
        catch (error) {
            throw new Error("Lỗi check-in: " + resolveErrorMessage(error));
        }
    },
    checkOut: async (maNv) => {
        try {
            if (!maNv?.trim()) {
                throw new Error("Mã nhân viên (maNV) là bắt buộc");
            }
            const result = await payrollRepository_1.default.checkOut(maNv);
            if (!result.success) {
                throw new Error(result.message || "Check-out thất bại");
            }
            return {
                success: true,
                message: result.message || "Check-out thành công",
                data: result,
            };
        }
        catch (error) {
            throw new Error("Lỗi check-out: " + resolveErrorMessage(error));
        }
    },
    getAttendanceByDate: async (date) => {
        try {
            if (!date) {
                throw new Error("Ngày (date) là bắt buộc");
            }
            const data = await payrollRepository_1.default.getAttendanceByDate(date);
            return { success: true, data };
        }
        catch (error) {
            throw new Error("Lỗi lấy danh sách chấm công: " + resolveErrorMessage(error));
        }
    },
    getEmployeeAttendance: async (maNv, fromDate, toDate) => {
        try {
            if (!maNv?.trim()) {
                throw new Error("Mã nhân viên (maNV) là bắt buộc");
            }
            const data = await payrollRepository_1.default.getEmployeeAttendance(maNv, fromDate, toDate);
            return { success: true, data };
        }
        catch (error) {
            throw new Error("Lỗi lấy chấm công nhân viên: " + resolveErrorMessage(error));
        }
    },
    getPayrollByMonth: async (month, year) => {
        try {
            const data = await payrollRepository_1.default.getPayrollByMonth(month, year);
            return { success: true, data };
        }
        catch (error) {
            throw new Error("Lỗi truy xuất bảng lương: " + resolveErrorMessage(error));
        }
    },
    getEmployeePayslip: async (maNv, month, year) => {
        try {
            const data = await payrollRepository_1.default.getEmployeePayslip(maNv, month, year);
            if (!data)
                throw new Error("Tháng này chưa có phiếu lương hoặc NV không tồn tại.");
            return { success: true, data };
        }
        catch (error) {
            throw new Error("Lỗi lấy phiếu lương cá nhân: " + resolveErrorMessage(error));
        }
    },
    closePayrollForMonth: async (month, year) => {
        try {
            const count = await payrollRepository_1.default.closePayrollForMonth(month, year);
            return {
                success: true,
                message: `Đã chốt lương tháng ${month}/${year} thành công cho ${count} nhân viên.`,
            };
        }
        catch (error) {
            throw new Error("Lỗi chốt lương tháng: " + resolveErrorMessage(error));
        }
    },
    checkIfPayrollClosed: async (month, year) => {
        try {
            const isClosed = await payrollRepository_1.default.checkIfPayrollClosed(month, year);
            return { success: true, isClosed };
        }
        catch (error) {
            throw new Error("Lỗi kiểm tra trạng thái chốt lương: " + resolveErrorMessage(error));
        }
    },
};
exports.default = payrollService;
