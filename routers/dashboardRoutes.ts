import express from "express";
const router = express.Router();
import dashboardController from "../controllers/dashboardController";

/**
 * @api {get} /api/dashboard/summary GET Dashboard Summary
 * @apiName GetDashboardSummary
 * @apiGroup Dashboard
 * @apiDescription Láº¥y tÃ³m táº¯t dashboard (tá»•ng nhÃ¢n viÃªn, phÃ²ng ban, dá»± Ã¡n...)
 * @apiSuccess {Boolean} success Tráº¡ng thÃ¡i thÃ nh cÃ´ng
 * @apiSuccess {String} message ThÃ´ng bÃ¡o
 * @apiSuccess {Array} data Danh sÃ¡ch thá»‘ng kÃª
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   {
 *     "success": true,
 *     "message": "Láº¥y tÃ³m táº¯t dashboard thÃ nh cÃ´ng",
 *     "data": [
 *       { "TieuChi": "Tá»•ng nhÃ¢n viÃªn", "SoLuong": 50, "IconType": "employee" }
 *     ]
 *   }
 */
router.get("/summary", dashboardController.getDashboardSummary);

/**
 * @api {get} /api/dashboard/employees-by-department GET Employees by Department
 * @apiName GetEmployeeByDepartment
 * @apiGroup Dashboard
 * @apiDescription Láº¥y thá»‘ng kÃª nhÃ¢n viÃªn theo phÃ²ng ban
 * @apiSuccess {Array} data Danh sÃ¡ch thá»‘ng kÃª nhÃ¢n viÃªn theo phÃ²ng ban
 */
router.get(
  "/employees-by-department",
  dashboardController.getEmployeeByDepartment,
);

/**
 * @api {get} /api/dashboard/projects GET Project Statistics
 * @apiName GetProjectStatistics
 * @apiGroup Dashboard
 * @apiDescription Láº¥y thá»‘ng kÃª dá»± Ã¡n
 * @apiSuccess {Array} data Danh sÃ¡ch thá»‘ng kÃª dá»± Ã¡n
 */
router.get("/projects", dashboardController.getProjectStatistics);

/**
 * @api {get} /api/dashboard/projects-near-deadline GET Projects Near Deadline
 * @apiName GetProjectsNearDeadline
 * @apiGroup Dashboard
 * @apiDescription Láº¥y 5 dá»± Ã¡n gáº§n deadline nháº¥t
 * @apiSuccess {Array} data Danh sÃ¡ch dá»± Ã¡n gáº§n deadline
 */
router.get(
  "/projects-near-deadline",
  dashboardController.getProjectsNearDeadline,
);

/**
 * @api {get} /api/dashboard/payroll-statistics GET Payroll Statistics
 * @apiName GetPayrollStatistics
 * @apiGroup Dashboard
 * @apiDescription Láº¥y thá»‘ng kÃª lÆ°Æ¡ng theo thÃ¡ng
 * @apiParam {Number} [thang] ThÃ¡ng
 * @apiParam {Number} [nam] NÄƒm
 * @apiSuccess {Array} data Danh sÃ¡ch thá»‘ng kÃª lÆ°Æ¡ng
 */
router.get("/payroll-statistics", dashboardController.getPayrollStatistics);

/**
 * @api {get} /api/dashboard/employees-by-position GET Employees by Position
 * @apiName GetEmployeeByPosition
 * @apiGroup Dashboard
 * @apiDescription Láº¥y thá»‘ng kÃª nhÃ¢n viÃªn theo chá»©c danh
 * @apiSuccess {Array} data Danh sÃ¡ch thá»‘ng kÃª nhÃ¢n viÃªn theo chá»©c danh
 */
router.get("/employees-by-position", dashboardController.getEmployeeByPosition);

/**
 * @api {get} /api/dashboard/recent-activities GET Recent Activities
 * @apiName GetRecentActivities
 * @apiGroup Dashboard
 * @apiDescription Láº¥y hoáº¡t Ä‘á»™ng gáº§n Ä‘Ã¢y (nhÃ¢n viÃªn má»›i, dá»± Ã¡n má»›i)
 * @apiSuccess {Array} data Danh sÃ¡ch hoáº¡t Ä‘á»™ng gáº§n Ä‘Ã¢y
 */
router.get("/recent-activities", dashboardController.getRecentActivities);

/**
 * @api {get} /api/dashboard/main GET Main Dashboard
 * @apiName GetMainDashboard
 * @apiGroup Dashboard
 * @apiDescription Láº¥y dashboard chÃ­nh (táº¥t cáº£ thÃ´ng tin quan trá»ng)
 * @apiSuccess {Object} data Äá»‘i tÆ°á»£ng chá»©a quickStats, departmentStats, projectStats, recentActivities
 */
router.get("/main", dashboardController.getMainDashboard);

/**
 * @api {get} /api/dashboard/payroll-trendline GET Payroll Trendline
 * @apiName GetPayrollTrendline
 * @apiGroup Dashboard
 * @apiDescription Láº¥y trendline lÆ°Æ¡ng 6 thÃ¡ng gáº§n nháº¥t
 * @apiSuccess {Array} data Danh sÃ¡ch trendline lÆ°Æ¡ng
 */
router.get("/payroll-trendline", dashboardController.getPayrollTrendline);

/**
 * @api {get} /api/dashboard/project-trendline GET Project Trendline
 * @apiName GetProjectTrendline
 * @apiGroup Dashboard
 * @apiDescription Láº¥y trendline dá»± Ã¡n (sá»‘ dá»± Ã¡n theo tráº¡ng thÃ¡i)
 * @apiSuccess {Array} data Danh sÃ¡ch trendline dá»± Ã¡n
 */
router.get("/project-trendline", dashboardController.getProjectTrendline);

/**
 * @api {get} /api/dashboard/report GET Dashboard Report
 * @apiName GetDashboardReport
 * @apiGroup Dashboard
 * @apiDescription Láº¥y bÃ¡o cÃ¡o dashboard Ä‘áº§y Ä‘á»§ (dÃ nh cho Admin)
 * @apiSuccess {Object} data Äá»‘i tÆ°á»£ng chá»©a táº¥t cáº£ thá»‘ng kÃª chi tiáº¿t
 */
router.get("/report", dashboardController.getDashboardReport);
router.get("/realtime", dashboardController.getRealtimeDashboard);

// â”€â”€ HR Analytics Routes (Phase 3) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/analytics/turnover",     dashboardController.getAnalyticsTurnover);
router.get("/analytics",              dashboardController.getAnalyticsTurnover);
router.get("/analytics/salary-cost",  dashboardController.getAnalyticsSalaryCost);
router.get("/analytics/attendance",   dashboardController.getAnalyticsAttendance);
router.get("/analytics/summary",      dashboardController.getAnalyticsSummary);

export default router;

