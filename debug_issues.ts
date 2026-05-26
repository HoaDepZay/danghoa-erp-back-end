import { connectDB, appPool } from "./config/db";
async function run() {
    await connectDB();
    const r = await appPool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME");
    console.log("All tables:", r.recordset.map((x: any) => x.TABLE_NAME).join(", "));
    process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
