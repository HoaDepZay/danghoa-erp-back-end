import { appPool } from "./config/db";

async function fixSP() {
  try {
    await appPool.connect();
    const query = `
      CREATE OR ALTER PROCEDURE sp_createProject
          @TENDA NVARCHAR(255),
          @MOTA NVARCHAR(MAX),
          @NGAYBATDAU DATE,
          @NGAYKETTHUC DATE,
          @TRANGTHAI NVARCHAR(50)
      AS
      BEGIN
          DECLARE @InsertedTable TABLE (MA_DA INT);
          
          INSERT INTO DU_AN (TEN_DA, MO_TA, NGAY_BAT_DAU, NGAY_KET_THUC, TRANG_THAI)
          OUTPUT INSERTED.MA_DA INTO @InsertedTable
          VALUES (@TENDA, @MOTA, @NGAYBATDAU, @NGAYKETTHUC, @TRANGTHAI);
          
          SELECT * FROM DU_AN WHERE MA_DA = (SELECT TOP 1 MA_DA FROM @InsertedTable);
      END;
    `;
    await appPool.request().query(query);
    console.log("Fixed sp_createProject successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error fixing SP:", err);
    process.exit(1);
  }
}

fixSP();
