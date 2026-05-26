import { connectDB, appPool } from "./config/db";

async function debugChatRooms() {
    await connectDB();
    
    // 1. Get sp_getMyRooms code
    try {
        const r1 = await appPool.request().query("SELECT OBJECT_DEFINITION(OBJECT_ID('sp_getMyRooms')) AS Code");
        console.log("=== sp_getMyRooms CODE ===");
        console.log(r1.recordset[0]?.Code || "NOT FOUND");
    } catch(e) { console.error(e.message); }

    // 2. Test sp_getMyRooms for NV53F54
    try {
        const r2 = await appPool.request()
            .input("MaNV", "NV53F54")
            .execute("sp_getMyRooms");
        console.log("\n=== ROOMS FOR NV53F54 ===");
        console.log(r2.recordset);
    } catch(e) { console.error(e.message); }

    process.exit(0);
}
debugChatRooms();
