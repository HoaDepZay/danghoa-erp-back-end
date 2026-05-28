"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitNotification = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const db_1 = require("./config/db");
const chatSocket_1 = __importDefault(require("./sockets/chatSocket"));
const notificationSocket_1 = __importDefault(require("./sockets/notificationSocket"));
const camelCaseHelper_1 = require("./utils/camelCaseHelper");
const authRoutes_1 = __importDefault(require("./routers/authRoutes"));
const employee_1 = __importDefault(require("./routers/employee"));
const admin_1 = __importDefault(require("./routers/admin"));
const departmentRoutes_1 = __importDefault(require("./routers/departmentRoutes"));
const projectRoutes_1 = __importDefault(require("./routers/projectRoutes"));
const payrollRoutes_1 = __importDefault(require("./routers/payrollRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routers/dashboardRoutes"));
const chatRoutes_1 = __importDefault(require("./routers/chatRoutes"));
const shiftRoutes_1 = __importDefault(require("./routers/shiftRoutes"));
const leaveRoutes_1 = __importDefault(require("./routers/leaveRoutes"));
const contractRoutes_1 = __importDefault(require("./routers/contractRoutes"));
const timesheetRoutes_1 = __importDefault(require("./routers/timesheetRoutes"));
const notificationRoutes_1 = __importDefault(require("./routers/notificationRoutes"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 5000;
// Set up Swagger
const swaggerDocument = yamljs_1.default.load(path_1.default.join(__dirname, "docs/swagger.yaml"));
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
// ĐẢM BẢO Body Parser được setup đúng
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
// Serve static uploads
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, 'uploads')));
// ✅ CORS Configuration cho Desktop + Mobile
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Danh sách whitelist origins
        const allowedOrigins = [
            "http://localhost:3000", // React dev
            "http://localhost:5173", // Vite dev (primary)
            "http://localhost:5174", // Vite dev (fallback)
            "http://localhost:5175", // Vite dev (fallback)
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
        ];
        // Nếu không có origin (request từ server/curl), cho phép
        if (!origin) {
            return callback(null, true);
        }
        // Check exact match
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Cho phép local network (192.168.x.x)
        if (/^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin)) {
            return callback(null, true);
        }
        // Cho phép tất cả Vercel domains (*.vercel.app)
        if (/^https?:\/\/.+\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }
        // Cho phép custom domain từ .env (nếu có)
        const normalizedFrontendUrl = String(process.env.FRONTEND_URL || "")
            .trim()
            .replace(/\/+$/, "");
        if (normalizedFrontendUrl && origin === normalizedFrontendUrl) {
            return callback(null, true);
        }
        console.warn(`⚠️  CORS: Rejected origin: ${origin}`);
        callback(new Error("Not allowed by CORS policy"));
    },
    credentials: true, // Cho phép cookies/auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
}));
// Middleware để debug request body
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    console.log("   Body:", JSON.stringify(req.body, null, 2));
    next();
});
// Tự động chuyển đổi toàn bộ response JSON sang camelCase
app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
        if (body) {
            body = (0, camelCaseHelper_1.keysToCamelCase)(body);
        }
        return originalJson.call(this, body);
    };
    next();
});
// PHÂN LOẠI Endpoint
app.use("/api/auth", authRoutes_1.default);
app.use("/api/notifications", notificationRoutes_1.default);
app.use("/api/employees", employee_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/departments", departmentRoutes_1.default);
app.use("/api/projects", projectRoutes_1.default);
app.use("/api/payroll", payrollRoutes_1.default);
app.use("/api/dashboard", dashboardRoutes_1.default);
app.use("/api/chat", chatRoutes_1.default);
app.use("/api/shifts", shiftRoutes_1.default);
app.use("/api/leaves", leaveRoutes_1.default);
app.use("/api/contracts", contractRoutes_1.default);
app.use("/api/timesheet", timesheetRoutes_1.default);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});
const emitNotification = (maNv, payload) => {
    io.to(`user_${maNv}`).emit("new_notification", payload);
};
exports.emitNotification = emitNotification;
(0, chatSocket_1.default)(io);
(0, notificationSocket_1.default)(io);
const notificationCron_1 = require("./cron/notificationCron");
(0, notificationCron_1.initCronJobs)();
console.log("🔍 Đang kết nối Database...");
// Sử dụng hàm connectDB (async) đã viết ở db.js
(0, db_1.connectDB)()
    .then(() => {
    httpServer.listen(PORT, () => {
        console.log(`✅ HUIT ERP RUNNING AT http://localhost:${PORT}`);
        console.log("✅ Chat WebSocket is running via Socket.IO");
    });
})
    .catch((err) => {
    console.error("❌ Không thể khởi động server do lỗi kết nối DB.");
});
