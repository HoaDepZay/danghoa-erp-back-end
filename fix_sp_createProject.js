import { appPool } from "./config/db.js";

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
          DECLARE @InsertedTable TABLE (MADA INT);
          
          INSERT INTO DU_AN (TENDA, MOTA, NGAYBATDAU, NGAYKETTHUC, TRANGTHAI)
          OUTPUT INSERTED.MADA INTO @InsertedTable
          VALUES (@TENDA, @MOTA, @NGAYBATDAU, @NGAYKETTHUC, @TRANGTHAI);
          
          SELECT * FROM DU_AN WHERE MADA = (SELECT TOP 1 MADA FROM @InsertedTable);
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
