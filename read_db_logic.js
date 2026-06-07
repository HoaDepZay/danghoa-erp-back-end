const sql = require('mssql');

const config = {
  user: 'sa',
  password: '31052006Hoa*',
  server: '100.108.208.39',
  database: 'QuanTriNhanSu',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function getSPContent() {
  try {
    await sql.connect(config);
    const procedures = ['sp_createProject'];
    
    for (const proc of procedures) {
      console.log(`\n=== CONTENT OF ${proc} ===`);
      const result = await sql.query(`EXEC sp_helptext '${proc}'`);
      const text = result.recordset.map(r => r.Text).join('');
      console.log(text);
    }

  } catch (err) {
    console.error(err);
  } finally {
    sql.close();
  }
}

getSPContent();
