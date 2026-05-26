import { appPool, connectDB } from "./config/db";

const testSP = async () => {
  try {
    await connectDB();

    const empRes = await appPool.request().query("SELECT TOP 1 MANV FROM NHAN_VIEN");
    const existingMaNV = empRes.recordset[0]?.MANV;
    if (!existingMaNV) {
      console.error("No employees found!");
      process.exit(1);
    }

    // Create room
    await appPool.request().query(`
      INSERT INTO PHONG_CHAT (TENPHONG, LOAIPHONG, MATHAMCHIEU) 
      VALUES (N'Phòng Test Msg', 1, 'TEST_MSG_ROOM');
    `);

    const roomRes = await appPool.request().query("SELECT TOP 1 MAPHONG FROM PHONG_CHAT WHERE MATHAMCHIEU = 'TEST_MSG_ROOM'");
    const roomId = roomRes.recordset[0]?.MAPHONG;

    console.log("Testing sp_sendMessage...");
    const resSendMsg = await appPool.request()
      .input("MaPhong", roomId)
      .input("MaNV_Gui", existingMaNV)
      .input("NoiDung", "Hello world from test script")
      .execute("sp_sendMessage");
    
    console.log("sp_sendMessage output row:", resSendMsg.recordset[0]);

    // Clean up
    await appPool.request().query(`
      DELETE FROM TIN_NHAN WHERE MAPHONG = ${roomId};
      DELETE FROM PHONG_CHAT WHERE MAPHONG = ${roomId};
    `);

    process.exit(0);
  } catch (err: any) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

testSP();
