import { appPool, connectDB } from './config/db';

async function check() {
  await connectDB();
  const createSP = await appPool.query(`EXEC sp_helptext 'sp_createDepartment'`);
  console.log("--- sp_createDepartment ---");
  createSP.recordset.forEach(r => console.log(r.Text));
  
  const updateSP = await appPool.query(`EXEC sp_helptext 'sp_updateDepartment'`);
  console.log("--- sp_updateDepartment ---");
  updateSP.recordset.forEach(r => console.log(r.Text));
}

check().catch(console.error).then(() => process.exit(0));
