const sql = require('mssql');

const config = {
  user: 'sa',
  password: '31052006Hoa*',
  server: '100.69.220.17',
  database: 'QuanTriNhanSu',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function checkSP() {
  try {
    await sql.connect(config);
    const result = await sql.query(`EXEC sp_helptext 'sp_savePasswordResetOtp'`);
    const text = result.recordset.map(r => r.Text).join('');
    console.log(text);
  } catch (err) {
    console.error(err);
  } finally {
    sql.close();
  }
}

checkSP();
