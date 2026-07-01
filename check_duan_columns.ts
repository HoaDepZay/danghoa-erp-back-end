import { appPool, connectDB } from './config/db';

async function run() {
  await connectDB();
  const res = await appPool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DU_AN'");
  console.log(res.recordset);
  process.exit(0);
}
run();
