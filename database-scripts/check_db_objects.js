const sql = require('mssql');

const config = {
  user: 'sa',
  password: '31052006Hoa*',
  server: '100.109.65.2',
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
        t.name AS TriggerName,
        o.name AS TableName
      FROM sys.triggers t
      INNER JOIN sys.objects o ON t.parent_id = o.object_id
      WHERE o.name = 'DU_AN'
    `);
    
    console.log('\n=== Triggers on DU_AN ===');
    console.table(result.recordset);

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
