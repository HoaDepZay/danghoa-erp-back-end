"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dashboardService_1 = __importDefault(require("../services/dashboardService"));
const dashboardController = {
    // 1. GET /api/dashboard/summary - Lấy tóm tắt dashboard
    getDashboardSummary: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getDashboardSummary();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    // 2. GET /api/dashboard/employees-by-department - Thống kê nhân viên theo phòng ban
    getEmployeeByDepartment: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getEmployeeByDepartment();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    // 3. GET /api/dashboard/projects - Thống kê dự án
    getProjectStatistics: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getProjectStatistics();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    // 4. GET /api/dashboard/projects-near-deadline - Top dự án gần deadline
    getProjectsNearDeadline: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getProjectsNearDeadline();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    // 5. GET /api/dashboard/payroll-statistics - Thống kê lương theo tháng
    getPayrollStatistics: async (req, res) => {
        try {
            const { thang, nam } = req.query;
            const result = await dashboardService_1.default.getPayrollStatistics(thang, nam);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    // 6. GET /api/dashboard/employees-by-position - Thống kê nhân viên theo chức danh
    getEmployeeByPosition: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getEmployeeByPosition();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    // 7. GET /api/dashboard/recent-activities - Hoạt động gần đây
    getRecentActivities: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getRecentActivities();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    // 8. GET /api/dashboard/main - Dashboard chính (tất cả thông tin)
    getMainDashboard: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getMainDashboard();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    // 9. GET /api/dashboard/payroll-trendline - Trendline lương 6 tháng
    getPayrollTrendline: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getPayrollTrendline();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    // 10. GET /api/dashboard/project-trendline - Trendline dự án
    getProjectTrendline: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getProjectTrendline();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    // 11. GET /api/dashboard/report - Report Dashboard (dành cho Admin)
    getDashboardReport: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getDashboardReport();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    // 12. GET /api/dashboard/realtime - Dashboard nhân sự realtime
    getRealtimeDashboard: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getRealtimeDashboard();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    // 13. GET /api/dashboard/analytics/turnover - Bien dong nhan su 12 thang
    getAnalyticsTurnover: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getAnalyticsTurnover();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    // 14. GET /api/dashboard/analytics/salary-cost - Chi phi luong theo phong ban
    getAnalyticsSalaryCost: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getAnalyticsSalaryCost();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    // 15. GET /api/dashboard/analytics/attendance - Ty le cham cong 6 thang
    getAnalyticsAttendance: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getAnalyticsAttendance();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    // 16. GET /api/dashboard/analytics/summary - Tong hop analytics
    getAnalyticsSummary: async (req, res) => {
        try {
            const result = await dashboardService_1.default.getAnalyticsSummary();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
};
exports.default = dashboardController;
