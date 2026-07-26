import { connectDB, appPool } from "./config/db";

async function run() {
  await connectDB();
  
  console.log("Creating sp_updateContract...");
  await appPool.request().query(`
    CREATE OR ALTER PROCEDURE [dbo].[sp_updateContract]
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
        UPDATE HOP_DONG_LAO_DONG
        SET MA_NV = @MA_NV,
            LOAI_HOP_DONG = @LOAI_HOP_DONG,
            TU_NGAY = @TU_NGAY,
            DEN_NGAY = @DEN_NGAY,
            LUONG_CO_BAN = @LUONG_CO_BAN,
            URL_CHI_TIET = @URL_CHI_TIET,
            TRANG_THAI = @TRANG_THAI
        WHERE MA_HD = @MA_HD;
    END
  `);

  console.log("Creating sp_getContractById...");
  await appPool.request().query(`
    CREATE OR ALTER PROCEDURE [dbo].[sp_getContractById]
        @MA_HD VARCHAR(50)
    AS
    BEGIN
        SELECT * FROM HOP_DONG_LAO_DONG WHERE MA_HD = @MA_HD;
    END
  `);

  console.log("Done!");
  process.exit(0);
}
run().catch(console.error);
