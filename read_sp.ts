import { appPool, connectDB } from "./config/db";

const run = async () => {
  await connectDB();
  const res = await appPool.request().query("SELECT OBJECT_DEFINITION(OBJECT_ID('sp_createEmployee')) AS Def");
  console.log(res.recordset[0].Def);
  process.exit(0);
};

run();
