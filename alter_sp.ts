import { sql, appPool } from "./config/db";

async function main() {
    await appPool.connect();
    const query = `
      ALTER PROCEDURE sp_sendMessage
          @MA_PHG    NVARCHAR(100),
          @MaNV_Gui  VARCHAR(20),
          @NOI_DUNG  NVARCHAR(MAX),
          @FILE_URL  NVARCHAR(MAX) = NULL,
          @FILE_TYPE VARCHAR(100) = NULL
      AS BEGIN
          SET NOCOUNT ON;
          INSERT INTO TIN_NHAN (MA_PHONG, MA_NV_GUI, NOI_DUNG, FILE_URL, FILE_TYPE, THOI_GIAN_GUI)
          VALUES (@MA_PHG, @MaNV_Gui, @NOI_DUNG, @FILE_URL, @FILE_TYPE, GETDATE());
          
          SELECT SCOPE_IDENTITY() AS MA_TN, 
                 @MA_PHG AS MA_PHONG, 
                 @MaNV_Gui AS MANV_GUI, 
                 @NOI_DUNG AS NOI_DUNG, 
                 @FILE_URL AS FILE_URL,
                 @FILE_TYPE AS FILE_TYPE,
                 GETDATE() AS THOI_GIAN_GUI;
      END
    `;
    await appPool.request().query(query);
    console.log("sp_sendMessage altered successfully!");
    await appPool.close();
}

main().catch(console.error);
