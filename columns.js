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
    const result = await sql.query("EXEC sp_columns DANG_KY_CHO");
    console.log(result.recordset.map(r => r.COLUMN_NAME).join(", "));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
