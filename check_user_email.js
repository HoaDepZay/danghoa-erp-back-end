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

async function checkUser() {
  try {
    await sql.connect(config);
    const result = await sql.query(`SELECT MANV, HOTEN, EMAIL FROM NHAN_VIEN WHERE EMAIL = 'hoadang0869@gmail.com'`);
    console.log('NHAN_VIEN:', result.recordset);
    
    const result2 = await sql.query(`SELECT * FROM TAIKHOAN WHERE EMAIL = 'hoadang0869@gmail.com'`);
    console.log('TAIKHOAN:', result2.recordset);
  } catch (err) {
    console.error(err);
  } finally {
    sql.close();
  }
}

checkUser();
