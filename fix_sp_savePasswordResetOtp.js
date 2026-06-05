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

async function fixSP() {
  try {
    await sql.connect(config);
    console.log('Connected.');

    await sql.query(`
      CREATE OR ALTER PROCEDURE sp_savePasswordResetOtp
          @EMAIL NVARCHAR(100),
          @OTPCODE NVARCHAR(6),
          @EXPIREDAT DATETIME
      AS
      BEGIN
          SET NOCOUNT ON; -- FIX: Prevent UPDATE from messing up recordsets
          
          UPDATE NHAN_VIEN
          SET VerificationCode = @OTPCODE,
              CodeExpiredAt = @EXPIREDAT
          WHERE EMAIL = @EMAIL;
          
          SELECT @@ROWCOUNT AS AffectedRows;
      END
    `);
    
    console.log('sp_savePasswordResetOtp updated successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    sql.close();
  }
}

fixSP();
