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

async function cleanupAll() {
  try {
    await sql.connect(config);
    
    // Tìm tất cả MA_NV trong DANG_KY_CHO mà chưa APPROVED
    const result = await sql.query(`
      SELECT MaNV 
      FROM DANG_KY_CHO 
      WHERE REGISTRATION_STATUS != 'APPROVED'
    `);
    
    const orphanedNVs = result.recordset.map(r => r.MaNV).filter(Boolean);
    
    if (orphanedNVs.length === 0) {
      console.log("No orphaned MA_NV found in DANG_KY_CHO.");
      process.exit(0);
    }
    
    console.log("Found potentially orphaned MA_NVs:", orphanedNVs);
    
    for (const manv of orphanedNVs) {
      console.log(`Cleaning up ${manv}...`);
      await sql.query(`DELETE FROM THONG_TIN_TAI_CHINH WHERE MA_NV = '${manv}'`);
      await sql.query(`DELETE FROM TAI_KHOANG WHERE MA_NV = '${manv}'`);
      await sql.query(`DELETE FROM THONG_TIN_CONG_VIEC WHERE MA_NV = '${manv}'`);
      await sql.query(`DELETE FROM NHAN_VIEN WHERE MA_NV = '${manv}'`);
    }
    
    console.log("Global cleanup done.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
cleanupAll();
