import { appPool, connectDB } from "./config/db";

const dumpDefinitions = async () => {
  try {
    await connectDB();
    const procs = [
      "sp_getMyRooms",
      "sp_isRoomMember",
      "sp_getRoomById",
      "sp_getRoomMessages",
      "sp_sendMessage",
      "fn_LayTinNhanMoiNhat",
      "fn_TimKiemTinNhan"
    ];

    for (const proc of procs) {
      const result = await appPool.request()
        .input("name", proc)
        .query(`SELECT OBJECT_DEFINITION(OBJECT_ID(@name)) AS Def`);
      
      const def = result.recordset[0]?.Def;
      console.log(`\n======================================`);
      console.log(`DEFINITION OF: ${proc}`);
      console.log(`======================================`);
      console.log(def || "NOT FOUND");
    }

    process.exit(0);
  } catch (err: any) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

dumpDefinitions();
