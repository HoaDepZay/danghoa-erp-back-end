import payrollRepository from "../repositories/payrollRepository";

const getPreviousMonthYear = () => {
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() - 1);
  return {
    month: targetDate.getMonth() + 1,
    year: targetDate.getFullYear(),
  };
};

const resolveErrorMessage = (
  error,
  fallback = "Đã xảy ra lỗi không xác định",
) => {
  if (error instanceof Error && error.message?.trim()) {
    return error.message;
  }

  const unknownError = error as any;
  const originalMessage = unknownError?.originalError?.info?.message;
  if (typeof originalMessage === "string" && originalMessage.trim()) {
    return originalMessage;
  }

  const firstPrecedingMessage = unknownError?.precedingErrors?.[0]?.message;
  if (
    typeof firstPrecedingMessage === "string" &&
    firstPrecedingMessage.trim()
  ) {
    return firstPrecedingMessage;
  }

  if (
    typeof unknownError?.message === "string" &&
    unknownError.message.trim()
  ) {
    return unknownError.message;
  }

  return fallback;
};

const payrollService = {
  checkIn: async (MA_NV) => {
    try {
      if (!MA_NV?.trim()) {
        throw new Error("Mã nhân viên (maNV) là bắt buộc");
      }

      const result = await payrollRepository.checkIn(MA_NV);

      if (!result.success) {
        throw new Error(result.message || "Check-in thất bại");
      }

      return {
        success: true,
        message: result.message || "Check-in thành công",
        data: result,
      };
    } catch (error) {
      throw new Error("Lỗi check-in: " + resolveErrorMessage(error));
    }
  },

  checkOut: async (MA_NV) => {
    try {
      if (!MA_NV?.trim()) {
        throw new Error("Mã nhân viên (maNV) là bắt buộc");
      }

      const result = await payrollRepository.checkOut(MA_NV);

      if (!result.success) {
        throw new Error(result.message || "Check-out thất bại");
      }

      return {
        success: true,
        message: result.message || "Check-out thành công",
        data: result,
      };
    } catch (error) {
      throw new Error("Lỗi check-out: " + resolveErrorMessage(error));
    }
  },

  getAttendanceByDate: async (date) => {
    try {
      if (!date) {
        throw new Error("Ngày (date) là bắt buộc");
      }

      const data = await payrollRepository.getAttendanceByDate(date);
      return { success: true, data };
    } catch (error) {
      throw new Error(
        "Lỗi lấy danh sách chấm công: " + resolveErrorMessage(error),
      );
    }
  },

  getEmployeeAttendance: async (MA_NV, fromDate, toDate) => {
    try {
      if (!MA_NV?.trim()) {
        throw new Error("Mã nhân viên (maNV) là bắt buộc");
      }

      const data = await payrollRepository.getEmployeeAttendance(
        MA_NV,
        fromDate,
        toDate,
      );
      return { success: true, data };
    } catch (error) {
      throw new Error(
        "Lỗi lấy chấm công nhân viên: " + resolveErrorMessage(error),
      );
    }
  },

  getPayrollByMonth: async (month, year) => {
    try {
      const data = await payrollRepository.getPayrollByMonth(month, year);
      return { success: true, data };
    } catch (error) {
      throw new Error(
        "Lỗi truy xuất bảng lương: " + resolveErrorMessage(error),
      );
    }
  },

  getEmployeePayslip: async (MA_NV, month, year) => {
    try {
      const data = await payrollRepository.getEmployeePayslip(
        MA_NV,
        month,
        year,
      );
      if (!data)
        throw new Error("Tháng này chưa có phiếu lương hoặc NV không tồn tại.");
      return { success: true, data };
    } catch (error) {
      throw new Error(
        "Lỗi lấy phiếu lương cá nhân: " + resolveErrorMessage(error),
      );
    }
  },

  closePayrollForMonth: async (month, year) => {
    try {
      const count = await payrollRepository.closePayrollForMonth(month, year);
      return {
        success: true,
        message: `Đã chốt lương tháng ${month}/${year} thành công cho ${count} nhân viên.`,
      };
    } catch (error) {
      throw new Error(
        "Lỗi chốt lương tháng: " + resolveErrorMessage(error),
      );
    }
  },

  checkIfPayrollClosed: async (month, year) => {
    try {
      const isClosed = await payrollRepository.checkIfPayrollClosed(month, year);
      return { success: true, isClosed };
    } catch (error) {
      throw new Error(
        "Lỗi kiểm tra trạng thái chốt lương: " + resolveErrorMessage(error),
      );
    }
  },
};

export default payrollService;
