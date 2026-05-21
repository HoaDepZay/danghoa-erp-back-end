import { appPool, sql } from "./config/db";

/**
 * Debug script cho UPDATE department
 */
async function debugUpdateDepartment() {
  try {
    console.log("=== DEBUG: Update Department ===\n");

    // Connect
    await appPool.connect();
    console.log("✓ Connected\n");

    // Step 1: Check existing data
    console.log("Step 1: Kiểm tra dữ liệu hiện tại của ID 1003");
    const request1 = appPool.request();
    const existing = await request1
      .input("MaPhg", sql.Int, 1003)
      .execute("sp_getDepartmentById");
    console.log("Dữ liệu hiện tại:");
    console.table(existing.recordset);

    if (!existing.recordset || existing.recordset.length === 0) {
      console.log("❌ ID 1003 không tồn tại!");
      process.exit(1);
    }

    const currentData = existing.recordset[0];
    console.log("\nChi tiết dữ liệu hiện tại:");
    console.log("  TENPB hiện tại:", currentData.TENPB);
    console.log("  MaTruongPhg hiện tại:", currentData.MaTruongPhg);

    // Step 2: Try update
    console.log("\n\nStep 2: Thử UPDATE với dữ liệu mới");
    const newTenPb = "Phòng Hành Chính Nhân Sự";
    const newMaTruongPhg = "NV53F54";

    console.log(`  Tên mới: ${newTenPb}`);
    console.log(`  Trưởng mới: ${newMaTruongPhg}`);

    const request2 = appPool.request();
    request2.output("Status", sql.Int);

    const result = await request2
      .input("MaPhg", sql.Int, 1003)
      .input("TenPb", sql.NVarChar(100), newTenPb)
      .input("MaTruongPhg", sql.VarChar(10), newMaTruongPhg)
      .execute("sp_updateDepartment");

    const status = request2.parameters.Status.value;
    console.log("\n✓ SP executed");
    console.log(`  Output Status: ${status}`);
    console.log(`  Success: ${status === 1 ? "YES" : "NO"}`);

    // Step 3: Check updated data
    console.log("\n\nStep 3: Kiểm tra dữ liệu sau UPDATE");
    const request3 = appPool.request();
    const afterUpdate = await request3
      .input("MaPhg", sql.Int, 1003)
      .execute("sp_getDepartmentById");

    console.log("Dữ liệu sau update:");
    console.table(afterUpdate.recordset);

    if (afterUpdate.recordset && afterUpdate.recordset.length > 0) {
      const updatedData = afterUpdate.recordset[0];
      console.log("\nSo sánh:");
      console.log(
        `  TENPB thay đổi: ${currentData.TENPB} → ${updatedData.TENPB}`,
      );
      console.log(
        `  MaTruongPhg thay đổi: ${currentData.MaTruongPhg} → ${updatedData.MaTruongPhg}`,
      );
    }
  } catch (error) {
    console.error("ERROR:", error);
  } finally {
    process.exit(0);
  }
}

debugUpdateDepartment();
