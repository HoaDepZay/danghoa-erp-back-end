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
  checkIn: async (maNv) => {
    try {
      if (!maNv?.trim()) {
        throw new Error("Mã nhân viên (maNV) là bắt buộc");
      }

      const result = await payrollRepository.checkIn(maNv);

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

  checkOut: async (maNv) => {
    try {
      if (!maNv?.trim()) {
        throw new Error("Mã nhân viên (maNV) là bắt buộc");
      }

      const result = await payrollRepository.checkOut(maNv);

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

  getEmployeeAttendance: async (maNv, fromDate, toDate) => {
    try {
      if (!maNv?.trim()) {
        throw new Error("Mã nhân viên (maNV) là bắt buộc");
      }

      const data = await payrollRepository.getEmployeeAttendance(
        maNv,
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

  getEmployeePayslip: async (maNv, month, year) => {
    try {
      const data = await payrollRepository.getEmployeePayslip(
        maNv,
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
};

export default payrollService;
