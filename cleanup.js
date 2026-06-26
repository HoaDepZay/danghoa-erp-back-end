const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "1433"),
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function check() {
  try {
    await sql.connect(config);
    console.log("Deleting orphaned data for NVRUL9...");
    await sql.query("DELETE FROM THONG_TIN_TAI_CHINH WHERE MA_NV = 'NVRUL9'");
    await sql.query("DELETE FROM TAI_KHOANG WHERE MA_NV = 'NVRUL9'");
    await sql.query("DELETE FROM THONG_TIN_CONG_VIEC WHERE MA_NV = 'NVRUL9'");
    await sql.query("DELETE FROM NHAN_VIEN WHERE MA_NV = 'NVRUL9'");
    console.log("Cleanup done.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
