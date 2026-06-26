import payrollService from "../services/payrollService";
import { normalizeRole } from "../utils/authHelper";

const payrollController = {
  checkIn: async (req, res) => {
    try {
      const MA_NV = req.body?.maNV || req.body?.MaNV || req.body?.MA_NV;

      if (!MA_NV) {
        return res.status(400).json({
          success: false,
          message: "Mã nhân viên (maNV) là bắt buộc",
        });
      }

      const result = await payrollService.checkIn(String(MA_NV));
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isClientError = message.toLowerCase().includes("lỗi check-in") || message.includes("Không") || message.includes("check-in");
      const statusCode = isClientError ? 400 : 500;

      return res.status(statusCode).json({
        success: false,
        message,
      });
    }
  },

  checkOut: async (req, res) => {
    try {
      const MA_NV = req.body?.maNV || req.body?.MaNV || req.body?.MA_NV;

      if (!MA_NV) {
        return res.status(400).json({
          success: false,
          message: "Mã nhân viên (maNV) là bắt buộc",
        });
      }

      const result = await payrollService.checkOut(String(MA_NV));
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isClientError = message.toLowerCase().includes("lỗi check-out") || message.includes("Không") || message.includes("check-out");
      const statusCode = isClientError ? 400 : 500;

      return res.status(statusCode).json({
        success: false,
        message,
      });
    }
  },

  getAttendanceByDate: async (req, res) => {
    try {
      const { date } = req.params;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Ngày (date) là bắt buộc, format: YYYY-MM-DD",
        });
      }

      const result = await payrollService.getAttendanceByDate(date);
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({
        success: false,
        message,
      });
    }
  },

  getEmployeeAttendance: async (req, res) => {
    try {
      const { id } = req.params;
      const { fromDate, toDate } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Mã nhân viên (id) là bắt buộc",
        });
      }

      const result = await payrollService.getEmployeeAttendance(
        String(id),
        fromDate ? String(fromDate) : null,
        toDate ? String(toDate) : null,
      );
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({
        success: false,
        message,
      });
    }
  },

  getPayrollByMonth: async (req, res) => {
    try {
      const { month, year } = req.params;
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (!Number.isInteger(monthNum) || !Number.isInteger(yearNum)) {
        return res.status(400).json({
          success: false,
          message: "Tham số year/month không hợp lệ",
        });
      }

      const result = await payrollService.getPayrollByMonth(monthNum, yearNum);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Phiếu lương nhân viên
  getEmployeePayslip: async (req, res) => {
    try {
      const now = new Date();
      const { id } = req.params;
      const { month, year } = req.query;

      const monthNum = parseInt(month as string, 10) || new Date().getMonth() + 1;
      const yearNum = parseInt(year as string, 10) || new Date().getFullYear();

      const userRole = (req as any).user?.userInfo?.role;
      const normalizedRole = userRole ? normalizeRole(userRole) : "nhanvien";

      const result = await payrollService.getEmployeePayslip(
        id,
        monthNum,
        yearNum
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  },

  // Chốt lương tháng
  closePayrollForMonth: async (req, res) => {
    try {
      const { year, month } = req.params;
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (!Number.isInteger(monthNum) || !Number.isInteger(yearNum)) {
        return res.status(400).json({
          success: false,
          message: "Tham số year/month không hợp lệ",
        });
      }

      const result = await payrollService.closePayrollForMonth(monthNum, yearNum);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Kiểm tra trạng thái chốt lương
  checkIfPayrollClosed: async (req, res) => {
    try {
      const { year, month } = req.params;
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (!Number.isInteger(monthNum) || !Number.isInteger(yearNum)) {
        return res.status(400).json({
          success: false,
          message: "Tham số year/month không hợp lệ",
        });
      }

      const result = await payrollService.checkIfPayrollClosed(monthNum, yearNum);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Cập nhật lương
  updatePayroll: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      if (!id) {
        return res.status(400).json({ success: false, message: "Thiếu ID bản ghi lương" });
      }
      const result = await payrollService.updatePayroll(id, data);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};

export default payrollController;
