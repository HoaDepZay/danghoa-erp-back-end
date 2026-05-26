import { appPool, connectDB } from "./config/db";

const test = async () => {
  try {
    await connectDB();
    const procs = [
      "sp_updateEmployee",
      "sp_deleteEmployee",
      "sp_deleteEmployeeFull",
      "sp_createDepartment",
      "sp_deleteDepartment"
    ];
    for (const proc of procs) {
      const result = await appPool.request().query(`
        SELECT OBJECT_DEFINITION(OBJECT_ID('${proc}')) as Def
      `);
      console.log(`=== ${proc} ===`);
      console.log(result.recordset[0]?.Def);
      console.log("\n");
    }
    process.exit(0);
  } catch (err: any) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
};

test();
