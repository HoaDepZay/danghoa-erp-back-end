import { connectDB, appPool } from "./config/db";

async function getProc() {
  await connectDB();
  await appPool.request().query(`
    ALTER PROCEDURE sp_sendMessage
        @MAPHONG INT,
        @MANV_GUI VARCHAR(20),
        @NOIDUNG NVARCHAR(MAX),
        @FILEURL NVARCHAR(MAX) = NULL,
        @FILETYPE VARCHAR(50) = NULL
    AS
    BEGIN
        INSERT INTO TIN_NHAN (MAPHONG, MANV_GUI, NOIDUNG, FileUrl, FileType)
        OUTPUT INSERTED.*
        VALUES (@MAPHONG, @MANV_GUI, @NOIDUNG, @FILEURL, @FILETYPE);
    END;
  `);
  console.log("Altered!");
  process.exit(0);
}

getProc();
