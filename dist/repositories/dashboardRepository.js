"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const dashboardRepository = {
    // 1. Lấy tóm tắt Dashboard
    getDashboardSummary: async () => {
        const result = await db_1.appPool.request().execute("sp_getDashboardSummary");
        return result.recordset;
    },
    // 2. Lấy thống kê nhân viên theo phòng ban
    getEmployeeByDepartment: async () => {
        const result = await db_1.appPool
            .request()
            .execute("sp_getEmployeeByDepartment");
        return result.recordset;
    },
    // 3. Lấy thống kê dự án
    getProjectStatistics: async () => {
        const result = await db_1.appPool.request().execute("sp_getProjectStatistics");
        return result.recordset;
    },
    // 4. Lấy top dự án gần deadline
    getProjectsNearDeadline: async () => {
        const result = await db_1.appPool
            .request()
            .execute("sp_getProjectsNearDeadline");
        return result.recordset;
    },
    // 5. Lấy thống kê lương theo tháng
    getPayrollStatistics: async (thang = null, nam = null) => {
        const request = db_1.appPool.request();
        if (thang !== null && thang !== undefined) {
            request.input("Thang", db_1.sql.Int, thang);
        }
        if (nam !== null && nam !== undefined) {
            request.input("Nam", db_1.sql.Int, nam);
        }
        const result = await request.execute("sp_getPayrollStatistics");
        return result.recordset;
    },
    // 6. Lấy thống kê nhân viên theo chức danh
    getEmployeeByPosition: async () => {
        const result = await db_1.appPool.request().execute("sp_getEmployeeByPosition");
        return result.recordset;
    },
    // 7. Lấy hoạt động gần đây (Top 10)
    getRecentActivities: async () => {
        const result = await db_1.appPool.request().execute("sp_getRecentActivities");
        return result.recordset;
    },
    // 8. Lấy thống kê tổng quát nhanh (Dashboard chính)
    getQuickStats: async () => {
        const result = await db_1.appPool.request().execute("sp_getQuickStats");
        return result.recordset[0] || {};
    },
    // 9. Lấy trendline lương 6 tháng gần nhất
    getPayrollTrendline: async () => {
        const result = await db_1.appPool.request().execute("sp_getPayrollTrendline");
        return result.recordset.reverse(); // Sắp xếp từ cũ đến mới
    },
    // 10. Lấy trendline dự án (Số dự án từng trạng thái qua các tháng)
    getProjectTrendline: async () => {
        const result = await db_1.appPool.request().execute("sp_getProjectTrendline");
        return result.recordset;
    },
    // 11. Dashboard nhân sự realtime dùng CTE (bảng ảo)
    getRealtimeDashboard: async () => {
        const request = db_1.appPool.request();
        request.multiple = true;
        const result = await request.execute("sp_getRealtimeDashboard");
        return {
            quickStats: result.recordsets?.[0]?.[0] || {},
            departmentHeadcount: result.recordsets?.[1] || [],
            projectStatus: result.recordsets?.[2] || [],
            attendanceToday: result.recordsets?.[3]?.[0] || {},
        };
    },
    // Analytics: Bien dong nhan su 12 thang
    getAnalyticsTurnover: async () => {
        const result = await db_1.appPool.request().execute("sp_analytics_turnover");
        return result.recordset;
    },
    // Analytics: Chi phi luong theo phong ban
    getAnalyticsSalaryCost: async () => {
        const result = await db_1.appPool.request().execute("sp_analytics_salary_cost");
        return result.recordset;
    },
    // Analytics: Ty le cham cong 6 thang
    getAnalyticsAttendance: async () => {
        const result = await db_1.appPool.request().execute("sp_analytics_attendance");
        return result.recordset;
    },
    // Analytics: Tong hop HR summary (multi recordset)
    getAnalyticsSummary: async () => {
        const result = await db_1.appPool.request().execute("sp_analytics_summary");
        return {
            employeeStats: result.recordsets?.[0]?.[0] || {},
            byRole: result.recordsets?.[1] || [],
            topDepartments: result.recordsets?.[2] || [],
        };
    },
};
exports.default = dashboardRepository;
