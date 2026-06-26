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
    const result = await sql.query("SELECT name FROM sys.triggers WHERE parent_id = OBJECT_ID('NHAN_VIEN')");
    console.log("Triggers on NHAN_VIEN:", result.recordset.map(r => r.name).join(", "));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
