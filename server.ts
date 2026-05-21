import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
// THAY ĐỔI Ở ĐÂY: Import connectDB thay vì msnodesqlv8
import { connectDB } from "./config/db";

import authRoutes from "./routers/authRoutes";
import employeeRoutes from "./routers/employee";
import adminRoutes from "./routers/admin";
import departmentRoutes from "./routers/departmentRoutes";
import projectRoutes from "./routers/projectRoutes";
import payrollRoutes from "./routers/payrollRoutes";
import dashboardRoutes from "./routers/dashboardRoutes";
import chatRoutes from "./routers/chatRoutes";

import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import setupChatSocket from "./sockets/chatSocket";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Set up Swagger
const swaggerDocument = YAML.load(path.join(__dirname, "docs/swagger.yaml"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ĐẢM BẢO Body Parser được setup đúng
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ✅ CORS Configuration cho Desktop + Mobile
app.use(
  cors({
    origin: function (origin, callback) {
      // Danh sách whitelist origins
      const allowedOrigins = [
        "http://localhost:3000", // React dev
        "http://localhost:5173", // Vite dev
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
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

// PHÂN LOẠI Endpoint
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat", chatRoutes);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

setupChatSocket(io);

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
