import { appPool, connectDB } from "./config/db";

const run = async () => {
  try {
    await connectDB();
    const result = await appPool.request().query(`
      SELECT TABLE_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo'
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);
    
    const tables: { [key: string]: string[] } = {};
    result.recordset.forEach((row: any) => {
      const table = row.TABLE_NAME;
      const col = row.COLUMN_NAME;
      if (!tables[table]) {
        tables[table] = [];
      }
      tables[table].push(col);
    });

    console.log("DATABASE COLUMNS SCHEMA:");
    Object.keys(tables).forEach(table => {
      console.log(`\nTable: ${table}`);
      tables[table].forEach(col => {
        console.log(`  - ${col}`);
      });
    });

    process.exit(0);
  } catch (err: any) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

run();
