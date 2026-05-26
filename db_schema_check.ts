import { connectDB, appPool } from "./config/db";

async function run() {
  await connectDB();
  
  const tables = await appPool.request().query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_TYPE = 'BASE TABLE'
  `);
  
  console.log("=== TABLES ===");
  console.log(tables.recordset.map(r => r.TABLE_NAME).join(", "));
  
  const cols = await appPool.request().query(`
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME IN ('NHAN_VIEN', 'HOP_DONG_LAO_DONG', 'HOP_DONG', 'LOAI_NGHI_PHEP', 'DON_NGHI_PHEP', 'THONG_BAO', 'LUONG_THUONG', 'BAN_CHAM_CONG')
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `);
  
  console.log("\n=== COLUMNS ===");
  let currTable = "";
  for (const c of cols.recordset) {
    if (c.TABLE_NAME !== currTable) {
      console.log(`\nTable: ${c.TABLE_NAME}`);
      currTable = c.TABLE_NAME;
    }
    console.log(` - ${c.COLUMN_NAME} (${c.DATA_TYPE})`);
  }
  
  process.exit(0);
}

run().catch(console.error);
