import express from "express";
const router = express.Router();
import dashboardController from "../controllers/dashboardController";

/**
 * @api {get} /api/dashboard/summary GET Dashboard Summary
 * @apiName GetDashboardSummary
 * @apiGroup Dashboard
 * @apiDescription Lấy tóm tắt dashboard (tổng nhân viên, phòng ban, dự án...)
 * @apiSuccess {Boolean} success Trạng thái thành công
 * @apiSuccess {String} message Thông báo
 * @apiSuccess {Array} data Danh sách thống kê
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "success": true,
 *     "message": "Lấy tóm tắt dashboard thành công",
 *     "data": [
 *       { "TieuChi": "Tổng nhân viên", "SoLuong": 50, "IconType": "employee" }
 *     ]
 *   }
 */
router.get("/summary", dashboardController.getDashboardSummary);

/**
 * @api {get} /api/dashboard/employees-by-department GET Employees by Department
 * @apiName GetEmployeeByDepartment
 * @apiGroup Dashboard
 * @apiDescription Lấy thống kê nhân viên theo phòng ban
 * @apiSuccess {Array} data Danh sách thống kê nhân viên theo phòng ban
 */
router.get(
  "/employees-by-department",
  dashboardController.getEmployeeByDepartment,
);

/**
 * @api {get} /api/dashboard/projects GET Project Statistics
 * @apiName GetProjectStatistics
 * @apiGroup Dashboard
 * @apiDescription Lấy thống kê dự án
 * @apiSuccess {Array} data Danh sách thống kê dự án
 */
router.get("/projects", dashboardController.getProjectStatistics);

/**
 * @api {get} /api/dashboard/projects-near-deadline GET Projects Near Deadline
 * @apiName GetProjectsNearDeadline
 * @apiGroup Dashboard
 * @apiDescription Lấy 5 dự án gần deadline nhất
 * @apiSuccess {Array} data Danh sách dự án gần deadline
 */
router.get(
  "/projects-near-deadline",
  dashboardController.getProjectsNearDeadline,
);

/**
 * @api {get} /api/dashboard/payroll-statistics GET Payroll Statistics
 * @apiName GetPayrollStatistics
 * @apiGroup Dashboard
 * @apiDescription Lấy thống kê lương theo tháng
 * @apiParam {Number} [thang] Tháng
 * @apiParam {Number} [nam] Năm
 * @apiSuccess {Array} data Danh sách thống kê lương
 */
router.get("/payroll-statistics", dashboardController.getPayrollStatistics);

/**
 * @api {get} /api/dashboard/employees-by-position GET Employees by Position
 * @apiName GetEmployeeByPosition
 * @apiGroup Dashboard
 * @apiDescription Lấy thống kê nhân viên theo chức danh
 * @apiSuccess {Array} data Danh sách thống kê nhân viên theo chức danh
 */
router.get("/employees-by-position", dashboardController.getEmployeeByPosition);

/**
 * @api {get} /api/dashboard/recent-activities GET Recent Activities
 * @apiName GetRecentActivities
 * @apiGroup Dashboard
 * @apiDescription Lấy hoạt động gần đây (nhân viên mới, dự án mới)
 * @apiSuccess {Array} data Danh sách hoạt động gần đây
 */
router.get("/recent-activities", dashboardController.getRecentActivities);

/**
 * @api {get} /api/dashboard/main GET Main Dashboard
 * @apiName GetMainDashboard
 * @apiGroup Dashboard
 * @apiDescription Lấy dashboard chính (tất cả thông tin quan trọng)
 * @apiSuccess {Object} data Đối tượng chứa quickStats, departmentStats, projectStats, recentActivities
 */
router.get("/main", dashboardController.getMainDashboard);

/**
 * @api {get} /api/dashboard/payroll-trendline GET Payroll Trendline
 * @apiName GetPayrollTrendline
 * @apiGroup Dashboard
 * @apiDescription Lấy trendline lương 6 tháng gần nhất
 * @apiSuccess {Array} data Danh sách trendline lương
 */
router.get("/payroll-trendline", dashboardController.getPayrollTrendline);

/**
 * @api {get} /api/dashboard/project-trendline GET Project Trendline
 * @apiName GetProjectTrendline
 * @apiGroup Dashboard
 * @apiDescription Lấy trendline dự án (số dự án theo trạng thái)
 * @apiSuccess {Array} data Danh sách trendline dự án
 */
router.get("/project-trendline", dashboardController.getProjectTrendline);

/**
 * @api {get} /api/dashboard/report GET Dashboard Report
 * @apiName GetDashboardReport
 * @apiGroup Dashboard
 * @apiDescription Lấy báo cáo dashboard đầy đủ (dành cho Admin)
 * @apiSuccess {Object} data Đối tượng chứa tất cả thống kê chi tiết
 */
router.get("/report", dashboardController.getDashboardReport);
router.get("/realtime", dashboardController.getRealtimeDashboard);

// ── HR Analytics Routes (Phase 3) ─────────────────────────────────────────
router.get("/analytics/turnover",     dashboardController.getAnalyticsTurnover);
router.get("/analytics/salary-cost",  dashboardController.getAnalyticsSalaryCost);
router.get("/analytics/attendance",   dashboardController.getAnalyticsAttendance);
router.get("/analytics/summary",      dashboardController.getAnalyticsSummary);

export default router;
