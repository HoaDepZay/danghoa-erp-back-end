import { connectDB, appPool } from "./config/db";

async function run() {
  await connectDB();
  
  console.log("Updating sp_createContract...");
  await appPool.request().query(`
    ALTER PROCEDURE [dbo].[sp_createContract]
        @MA_HD      VARCHAR(50),
        @MA_NV      VARCHAR(20),
        @LOAI_HOP_DONG NVARCHAR(100),
        @TU_NGAY    DATE,
        @DEN_NGAY   DATE = NULL,
        @LUONG_CO_BAN DECIMAL(18,2),
        @URL_CHI_TIET NVARCHAR(MAX) = NULL,
        @TRANG_THAI VARCHAR(50) = 'CHUA BAT DAU'
    AS
    BEGIN
        INSERT INTO HOP_DONG_LAO_DONG (MA_HD, MA_NV, LOAI_HOP_DONG, TU_NGAY, DEN_NGAY, LUONG_CO_BAN, URL_CHI_TIET, TRANG_THAI)
        VALUES (@MA_HD, @MA_NV, @LOAI_HOP_DONG, @TU_NGAY, @DEN_NGAY, @LUONG_CO_BAN, @URL_CHI_TIET, @TRANG_THAI);
    END
  `);

  console.log("Creating sp_updateContractStatus...");
  await appPool.request().query(`
    CREATE OR ALTER PROCEDURE [dbo].[sp_updateContractStatus]
        @MA_HD VARCHAR(50),
        @TRANG_THAI VARCHAR(50)
    AS
    BEGIN
        UPDATE HOP_DONG_LAO_DONG
        SET TRANG_THAI = @TRANG_THAI
        WHERE MA_HD = @MA_HD;
    END
  `);

  console.log("Done!");
  process.exit(0);
}
run().catch(console.error);
