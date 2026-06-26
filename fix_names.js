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

async function fix() {
  try {
    await sql.connect(config);
    await sql.query(`UPDATE NHAN_VIEN SET HO_TEN = N'Nguyễn Minh Tuấn' WHERE MA_NV = 'NV_TEST01'`);
    await sql.query(`UPDATE NHAN_VIEN SET HO_TEN = N'Trần Thị Hoa' WHERE MA_NV = 'NV_TEST02'`);
    await sql.query(`UPDATE THONG_TIN_CONG_VIEC SET TRANG_THAI_LAM_VIEC = N'Đang làm việc' WHERE TRANG_THAI_LAM_VIEC LIKE N'%ang l%m vi%c%'`);
    await sql.query(`UPDATE THONG_TIN_CONG_VIEC SET TRANG_THAI_LAM_VIEC = N'Chính thức' WHERE TRANG_THAI_LAM_VIEC LIKE N'%h%nh th%c%'`);
    console.log("Fixed corrupted test data.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
