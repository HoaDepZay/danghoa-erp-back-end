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

async function checkColumns() {
  try {
    await sql.connect(config);
    const result1 = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'BAN_CHAM_CONG'
    `);
    console.log('--- BAN_CHAM_CONG COLUMNS ---');
    console.table(result1.recordset);

    const result2 = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'BANG_LUONG'
    `);
    console.log('--- BANG_LUONG COLUMNS ---');
    console.table(result2.recordset);

  } catch (err) {
    console.error(err);
  } finally {
    sql.close();
  }
}

checkColumns();
