import { appPool } from "./config/db";

async function querySchema() {
  try {
    await appPool.connect();
    const result = await appPool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'DU_AN'
    `);
    console.log("Columns:", result.recordset.map(r => r.COLUMN_NAME).join(", "));
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

querySchema();
