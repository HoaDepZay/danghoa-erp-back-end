import { connectDB, appPool } from "./config/db";

async function run() {
  await connectDB();
  
  console.log("Adding TRANG_THAI column...");
  await appPool.request().query(`
    ALTER TABLE HOP_DONG_LAO_DONG 
    ADD TRANG_THAI VARCHAR(50) DEFAULT 'CHUA BAT DAU' WITH VALUES
  `);

  console.log("Adding CHECK constraint...");
  await appPool.request().query(`
    ALTER TABLE HOP_DONG_LAO_DONG 
    ADD CONSTRAINT CHK_TrangThaiHopDong 
    CHECK (TRANG_THAI IN ('CHUA BAT DAU', 'DANG THUC HIEN', 'HET HAN', 'HUY'))
  `);

  console.log("Done!");
  process.exit(0);
}
run().catch(console.error);
