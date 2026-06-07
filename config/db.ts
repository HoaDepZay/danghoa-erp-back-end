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

const connectDB = async () => {
  try {
    // Kết nối vào DB chính
    await appPool.connect();
    console.log(`✅ Kết nối thành công Database: ${process.env.DB_NAME}`);
    
    // Khởi tạo cache tham số SP
    await cacheSpParams();
  } catch (err: any) {
    console.error("❌ Lỗi kết nối SQL Server:", err.message);
    process.exit(1);
  }
};

// ── Cache tham số stored procedures để tự động map tên biến ─────────────────
const spParamsCache: Record<string, Record<string, string>> = {};

const normalizeName = (name: string) => name.toLowerCase().replace(/_/g, "");

const cacheSpParams = async () => {
  try {
    const result = await appPool.request().query(`
      SELECT 
        LOWER(o.name) AS proc_name,
        p.name AS actual_param_name
      FROM sys.parameters p
      JOIN sys.objects o ON p.object_id = o.object_id
      WHERE o.type = 'P'
    `);
    
    for (const row of result.recordset) {
      const proc = row.proc_name;
      const paramKey = normalizeName(row.actual_param_name.replace(/^@/, ''));
      if (!spParamsCache[proc]) {
        spParamsCache[proc] = {};
      }
      spParamsCache[proc][paramKey] = row.actual_param_name;
    }
    console.log(`ℹ️ [DB] Đã cache tham số của ${Object.keys(spParamsCache).length} Stored Procedures`);
  } catch (err: any) {
    console.error("⚠️ [DB] Lỗi khi tạo cache tham số SP:", err.message);
  }
};

// Ghi đè execute để tự động map tham số
const originalExecute = sql.Request.prototype.execute;
(sql.Request.prototype as any).execute = function(this: any, procedureName: string, callback?: any) {
  const procKey = procedureName.toLowerCase();
  const procParams = spParamsCache[procKey];
  if (procParams && this.parameters) {
    for (const key of Object.keys(this.parameters)) {
      const normalizedKey = normalizeName(key);
      const dbParamName = procParams[normalizedKey];
      if (dbParamName) {
        const dbKeyWithoutAt = dbParamName.replace(/^@/, '');
        if (dbKeyWithoutAt !== key) {
          this.parameters[dbKeyWithoutAt] = this.parameters[key];
          this.parameters[dbKeyWithoutAt].name = dbKeyWithoutAt;
          delete this.parameters[key];
        }
      }
    }
  }
  return originalExecute.call(this, procedureName, callback);
};

// Export các Pool và thư viện sql để sử dụng ở các Service
export { connectDB, appPool, sql };

