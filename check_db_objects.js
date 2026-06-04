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
        AND o.type IN ('P', 'FN', 'TF', 'IF', 'TR', 'U')
      ORDER BY o.type_desc, o.name
    `);
    
    const objects = result.recordset;
    const stats = objects.reduce((acc, obj) => {
      acc[obj.ObjectType] = (acc[obj.ObjectType] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\\n=== Database Objects Summary ===');
    console.log(stats);
    
    console.log('\\n=== List of Stored Procedures ===');
    objects.filter(o => o.ObjectType === 'SQL_STORED_PROCEDURE').forEach(o => {
      console.log('- ' + o.ObjectName);
    });

  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    sql.close();
  }
}

checkDatabase();
