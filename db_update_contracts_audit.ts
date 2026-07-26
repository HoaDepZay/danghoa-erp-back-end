import { connectDB, appPool } from "./config/db";

async function run() {
  await connectDB();
  
  console.log("Creating LICH_SU_HOP_DONG table...");
  try {
    await appPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LICH_SU_HOP_DONG')
      BEGIN
        CREATE TABLE LICH_SU_HOP_DONG (
          ID INT IDENTITY(1,1) PRIMARY KEY,
          MA_HD VARCHAR(50) NOT NULL,
          NGUOI_THAY_DOI VARCHAR(20) NOT NULL,
          THOI_GIAN DATETIME DEFAULT GETDATE(),
          NOI_DUNG_THAY_DOI NVARCHAR(MAX) NOT NULL,
          CONSTRAINT FK_LSHD_HD FOREIGN KEY (MA_HD) REFERENCES HOP_DONG_LAO_DONG(MA_HD),
          CONSTRAINT FK_LSHD_NV FOREIGN KEY (NGUOI_THAY_DOI) REFERENCES NHAN_VIEN(MA_NV)
        );
      END
    `);
  } catch (err: any) {
    console.error("Error creating table LICH_SU_HOP_DONG:", err.message);
  }

  console.log("Creating trg_CheckActiveContract...");
  await appPool.request().query(`
    CREATE OR ALTER TRIGGER trg_CheckActiveContract
    ON HOP_DONG_LAO_DONG
    AFTER INSERT, UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;

        IF EXISTS (
            SELECT 1
            FROM HOP_DONG_LAO_DONG h
            JOIN inserted i ON h.MA_NV = i.MA_NV
            WHERE h.TRANG_THAI = 'DANG THUC HIEN'
            GROUP BY h.MA_NV
            HAVING COUNT(*) > 1
        )
        BEGIN
            RAISERROR (N'Một nhân viên không thể có 2 hợp đồng mang trạng thái Đang thực hiện cùng lúc.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
    END
  `);

  console.log("Creating trg_ValidateContractDates...");
  await appPool.request().query(`
    CREATE OR ALTER TRIGGER trg_ValidateContractDates
    ON HOP_DONG_LAO_DONG
    AFTER INSERT, UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;

        -- 1. TU_NGAY must be <= DEN_NGAY
        IF EXISTS (
            SELECT 1 FROM inserted 
            WHERE DEN_NGAY IS NOT NULL AND TU_NGAY > DEN_NGAY
        )
        BEGIN
            RAISERROR (N'Ngày kết thúc hợp đồng không được nhỏ hơn ngày bắt đầu.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 2. If status is DANG THUC HIEN, DEN_NGAY cannot be in the past
        IF EXISTS (
            SELECT 1 FROM inserted 
            WHERE TRANG_THAI = 'DANG THUC HIEN' 
              AND DEN_NGAY IS NOT NULL 
              AND CAST(DEN_NGAY AS DATE) < CAST(GETDATE() AS DATE)
        )
        BEGIN
            RAISERROR (N'Không thể lưu trạng thái Đang thực hiện cho hợp đồng đã quá hạn (Ngày kết thúc trong quá khứ).', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
    END
  `);

  console.log("Done!");
  process.exit(0);
}

run().catch(console.error);
