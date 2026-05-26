import { connectDB, appPool } from "./config/db";

async function run() {
    try {
        await connectDB();
        const result = await appPool.request().query(`
            SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'NHAN_VIEN' AND COLUMN_NAME = 'MANV'
        `);
        console.log("MANV Type:", result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
