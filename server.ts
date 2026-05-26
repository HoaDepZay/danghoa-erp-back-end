import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./config/db";
import setupChatSocket from "./sockets/chatSocket";
import setupNotificationSocket from "./sockets/notificationSocket";
import { keysToCamelCase } from "./utils/camelCaseHelper";

import authRoutes from "./routers/authRoutes";
import employeeRoutes from "./routers/employee";
import adminRoutes from "./routers/admin";
import departmentRoutes from "./routers/departmentRoutes";
import projectRoutes from "./routers/projectRoutes";
import payrollRoutes from "./routers/payrollRoutes";
import dashboardRoutes from "./routers/dashboardRoutes";
import chatRoutes from "./routers/chatRoutes";
import shiftRoutes from "./routers/shiftRoutes";
import leaveRoutes from "./routers/leaveRoutes";
import contractRoutes from "./routers/contractRoutes";
import timesheetRoutes from "./routers/timesheetRoutes";
import notificationRoutes from "./routers/notificationRoutes";

import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Set up Swagger
const swaggerDocument = YAML.load(path.join(__dirname, "docs/swagger.yaml"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ĐẢM BẢO Body Parser được setup đúng
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ CORS Configuration cho Desktop + Mobile
app.use(
  cors({
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
  }),
);

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
      body = keysToCamelCase(body);
    }
    return originalJson.call(this, body);
  };
  next();
});

// PHÂN LOẠI Endpoint
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/timesheet", timesheetRoutes);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

export const emitNotification = (maNv: string, payload: any) => {
  io.to(`user_${maNv}`).emit("new_notification", payload);
};

setupChatSocket(io);
setupNotificationSocket(io);

import { initCronJobs } from "./cron/notificationCron";
initCronJobs();

console.log("🔍 Đang kết nối Database...");

// Sử dụng hàm connectDB (async) đã viết ở db.js
connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`✅ HUIT ERP RUNNING AT http://localhost:${PORT}`);
      console.log("✅ Chat WebSocket is running via Socket.IO");
    });
  })
  .catch((err) => {
    console.error("❌ Không thể khởi động server do lỗi kết nối DB.");
  });
