import { appPool, connectDB } from './config/db';

async function run() {
  await connectDB();
  const queries = [
    `SELECT * FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
     JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
     ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME 
     WHERE kcu.TABLE_NAME IN ('GIAI_DOAN', 'PHAN_CONG_GIAI_DOAN')`
  ];
  
  for (const q of queries) {
    try {
      const res = await appPool.query(q);
      console.log(res.recordset);
    } catch(e) {
      console.error("Lỗi:", e.message);
    }
  }
  process.exit(0);
}
run();
