import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "1433"),
  options: { encrypt: false, trustServerCertificate: true },
};

async function run() {
  try {
    const pool = await sql.connect(config);
    const proj = await pool.request().input("MANV", sql.VarChar(20), "NVRAVF").execute("sp_getProjectsWithMembersByEmployee");
    console.log("Projects for NVRAVF:", proj.recordset.length, proj.recordset[0] || "None");
    
    const proj2 = await pool.request().input("MANV", sql.VarChar(20), "NVE9FQ").execute("sp_getProjectsWithMembersByEmployee");
    console.log("Projects for NVE9FQ:", proj2.recordset.length, proj2.recordset[0] || "None");

    const shifts = await pool.request().execute("sp_getShiftAssignments");
    console.log("Shifts for all:", shifts.recordset.length, shifts.recordset[0] || "None");
    process.exit(0);
  } catch (err) {
    console.error(err);
  }
}
run();
