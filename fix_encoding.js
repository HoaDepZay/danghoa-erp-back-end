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

function fixMojibake(str) {
  if (!str) return str;
  // Try to decode. If it contains mostly standard ascii, don't touch it.
  // Actually, if it has "Ã", "Ä", it's mojibake.
  if (/[ÃÄÁÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ]/.test(str)) {
    try {
      const fixed = Buffer.from(str, 'latin1').toString('utf8');
      if (fixed.includes("")) return str; // failed
      return fixed;
    } catch (e) {
      return str;
    }
  }
  return str;
}

async function fix() {
  try {
    await sql.connect(config);
    
    // Fix NHAN_VIEN
    const nvResult = await sql.query("SELECT MA_NV, HO_TEN, DIA_CHI FROM NHAN_VIEN");
    for (const row of nvResult.recordset) {
      const fixedName = fixMojibake(row.HO_TEN);
      const fixedAddress = fixMojibake(row.DIA_CHI);
      if (fixedName !== row.HO_TEN || fixedAddress !== row.DIA_CHI) {
        console.log(`Fixing NHAN_VIEN ${row.MA_NV}: ${row.HO_TEN} -> ${fixedName}`);
        await sql.query(`UPDATE NHAN_VIEN SET HO_TEN = N'${fixedName.replace(/'/g, "''")}' WHERE MA_NV = '${row.MA_NV}'`);
      }
    }
    
    // Fix THONG_TIN_CONG_VIEC
    const ttcvResult = await sql.query("SELECT MA_NV, TRANG_THAI_LAM_VIEC, CHUC_VU FROM THONG_TIN_CONG_VIEC");
    for (const row of ttcvResult.recordset) {
      const fixedStatus = fixMojibake(row.TRANG_THAI_LAM_VIEC);
      const fixedChucvu = fixMojibake(row.CHUC_VU);
      if (fixedStatus !== row.TRANG_THAI_LAM_VIEC || fixedChucvu !== row.CHUC_VU) {
        console.log(`Fixing THONG_TIN_CONG_VIEC ${row.MA_NV}: ${row.TRANG_THAI_LAM_VIEC} -> ${fixedStatus}`);
        await sql.query(`UPDATE THONG_TIN_CONG_VIEC SET TRANG_THAI_LAM_VIEC = N'${fixedStatus.replace(/'/g, "''")}', CHUC_VU = N'${fixedChucvu ? fixedChucvu.replace(/'/g, "''") : ''}' WHERE MA_NV = '${row.MA_NV}'`);
      }
    }
    
    console.log("Database encoding fix complete.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
