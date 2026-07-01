import { appPool, connectDB } from './config/db';

async function run() {
  await connectDB();
  const res = await appPool.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%DU_AN%' OR TABLE_NAME LIKE '%GIAI_DOAN%'");
  console.log(res.recordset);
  process.exit(0);
}
run();
