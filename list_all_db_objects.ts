import { appPool, connectDB } from "./config/db";

const run = async () => {
  try {
    await connectDB();
    const result = await appPool.request().query(`
      SELECT name, type_desc 
      FROM sys.objects 
      WHERE type IN ('P', 'FN', 'IF', 'TF') 
        AND is_ms_shipped = 0
      ORDER BY type_desc, name
    `);
    
    console.log("ALL DB PROCEDURES AND FUNCTIONS:");
    result.recordset.forEach((row: any) => {
      console.log(`- ${row.name} (${row.type_desc})`);
    });
    
    process.exit(0);
  } catch (err: any) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

run();
