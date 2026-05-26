import { appPool, connectDB } from "./config/db";

const test = async () => {
  try {
    await connectDB();
    const result = await appPool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'BAN_CHAM_CONG'
    `);
    console.log(result.recordset);
    process.exit(0);
  } catch (err: any) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
};

test();
