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

async function checkDatabase() {
  try {
    await sql.connect(config);
    console.log('Connected to SQL Server.');

    const result = await sql.query(`
      SELECT 
        o.name AS ObjectName,
        o.type_desc AS ObjectType
      FROM sys.objects o
      WHERE o.is_ms_shipped = 0
        AND o.type IN ('TR', 'U')
      ORDER BY o.type_desc, o.name
    `);
    
    const objects = result.recordset;
    console.log('\n=== List of Tables ===');
    objects.filter(o => o.ObjectType === 'USER_TABLE').forEach(o => {
      console.log('- ' + o.ObjectName);
    });

    console.log('\n=== List of Triggers ===');
    objects.filter(o => o.ObjectType === 'SQL_TRIGGER').forEach(o => {
      console.log('- ' + o.ObjectName);
    });

    // Check columns of BAN_CHAM_CONG and BANG_LUONG
    const tables = ['BAN_CHAM_CONG', 'BANG_LUONG', 'PHANCONG_DU_AN', 'PHAN_CONG_DU_AN'];
    for (const table of tables) {
      const colResult = await sql.query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${table}'
      `);
      if (colResult.recordset.length > 0) {
        console.log(`\n=== Columns of ${table} ===`);
        console.table(colResult.recordset);
      } else {
        console.log(`\n=== Table ${table} does not exist ===`);
      }
    }

  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    sql.close();
  }
}

checkDatabase();
