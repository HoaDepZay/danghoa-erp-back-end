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

async function createSP() {
  try {
    await sql.connect(config);
    console.log('Connected to SQL Server.');

    const query = `
      CREATE OR ALTER PROCEDURE sp_changePassword
          @Email VARCHAR(100),
          @NewPassword VARCHAR(255)
      AS
      BEGIN
          SET NOCOUNT ON;
          
          IF EXISTS (SELECT 1 FROM TAIKHOAN WHERE Email = @Email)
          BEGIN
              UPDATE TAIKHOAN 
              SET PasswordHash = @NewPassword 
              WHERE Email = @Email;
              
              SELECT 1 AS Success, 'Cập nhật mật khẩu thành công' AS Message;
          END
          ELSE
          BEGIN
              SELECT 0 AS Success, 'Không tìm thấy tài khoản với EMAIL này' AS Message;
          END
      END
    `;
    
    await sql.query(query);
    console.log('Successfully created sp_changePassword.');

  } catch (err) {
    console.error('Failed to create SP:', err);
  } finally {
    sql.close();
  }
}

createSP();
