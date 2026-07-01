import { appPool, connectDB } from './config/db';

async function run() {
  await connectDB();
  const queries = [
    "sp_helptext 'sp_deleteProjectTasks'",
    "sp_helptext 'sp_deleteProjectAssignments'",
    "sp_helptext 'sp_deleteProject'"
  ];
  
  for (const q of queries) {
    try {
      console.log(`\n--- ${q} ---`);
      const res = await appPool.query(q);
      const text = res.recordset.map(r => r.Text).join('');
      console.log(text);
    } catch(e) {
      console.error("Lỗi:", e.message);
    }
  }
  process.exit(0);
}
run();
