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
    // Find a user who has a room of type 1
    const roomRes = await pool.request().query("SELECT TOP 1 MA_PHONG FROM PHONG_CHAT WHERE LOAI_PHONG = 1");
    if (roomRes.recordset.length > 0) {
      const maPhong = roomRes.recordset[0].MA_PHONG;
      const tvRes = await pool.request().query(`SELECT MA_NV FROM THANH_VIEN_PHONG_CHAT WHERE MA_PHONG = ${maPhong}`);
      
      for (const row of tvRes.recordset) {
        const maNv = row.MA_NV;
        console.log("Calling sp_getMyRooms for", maNv);
        const result = await pool.request().input('MA_NV', sql.VarChar(20), maNv).execute("sp_getMyRooms");
        const directRoom = result.recordset.find(r => r.LOAI_PHONG === 1);
        console.log(`MA_NV: '${maNv}', Room Name: '${directRoom?.TEN_PHONG}'`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
  }
}
run();
