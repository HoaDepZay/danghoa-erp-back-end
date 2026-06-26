const { appPool } = require('./dist/config/db.js');
async function run() {
  await appPool.connect();
  const res = await appPool.request().query("EXEC sp_helptext 'vw_BangLuongCaNhan'");
  console.log(res.recordset.map(r => r.Text).join(''));
  process.exit(0);
}
run();
