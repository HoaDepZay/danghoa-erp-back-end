import payrollService from "../services/payrollService";

const payrollController = {
  checkIn: async (req, res) => {
    try {
      const maNv = req.body?.maNV || req.body?.MaNV || req.body?.manv;

      if (!maNv) {
        return res.status(400).json({
          success: false,
          message: "Mã nhân viên (maNV) là bắt buộc",
        });
      }

      const result = await payrollService.checkIn(String(maNv));
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const statusCode =
        message.includes("Không") || message.includes("đã check-in")
          ? 400
          : 500;

      return res.status(statusCode).json({
        success: false,
        message,
      });
    }
  },

  checkOut: async (req, res) => {
    try {
      const maNv = req.body?.maNV || req.body?.MaNV || req.body?.manv;

      if (!maNv) {
        return res.status(400).json({
          success: false,
          message: "Mã nhân viên (maNV) là bắt buộc",
        });
      }

      const result = await payrollService.checkOut(String(maNv));
      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const statusCode =
        message.includes("Không") || message.includes("lượt Check-in")
          ? 400
          : 500;

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
      const month = req.params.month || req.query.month || now.getMonth() + 1;
      const year = req.params.year || req.query.year || now.getFullYear();
      const monthNum = parseInt(String(month));
      const yearNum = parseInt(String(year));

      if (!Number.isInteger(monthNum) || !Number.isInteger(yearNum)) {
        return res.status(400).json({
          success: false,
          message: "Query month/year không hợp lệ",
        });
      }

      const result = await payrollService.getEmployeePayslip(
        id,
        monthNum,
        yearNum,
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
};

export default payrollController;
