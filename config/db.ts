import sql from "mssql";
import "dotenv/config";

// 1. Cấu hình cơ sở (Base Config)
const baseConfig: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER || "",
  port: parseInt(process.env.DB_PORT || "1433"),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// 2. Cấu hình cho Database Nghiệp vụ (QuanTriNhanSu)
const appConfig = {
  ...baseConfig,
  database: process.env.DB_NAME,
};

// Tạo các Pool kết nối
const appPool = new sql.ConnectionPool(appConfig);

/**
 * Hàm khởi tạo toàn bộ kết nối
 */
const connectDB = async () => {
  try {
    // Kết nối vào DB chính
    await appPool.connect();
    console.log(`✅ Kết nối thành công Database: ${process.env.DB_NAME}`);
  } catch (err: any) {
    console.error("❌ Lỗi kết nối SQL Server:", err.message);
    process.exit(1);
  }
};

// Export các Pool và thư viện sql để sử dụng ở các Service
export { connectDB, appPool, sql };
