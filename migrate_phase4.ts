import { connectDB, appPool } from "./config/db";

async function runMigrations() {
  try {
    await connectDB();
    
    // 1. Tạo bảng TIMESHEET_DU_AN
    await appPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TIMESHEET_DU_AN]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[TIMESHEET_DU_AN](
            [Id] [int] IDENTITY(1,1) NOT NULL,
            [MaNV] [varchar](20) NOT NULL,
            [MaDA] [int] NOT NULL,
            [Ngay] [date] NOT NULL,
            [SoGioLam] [decimal](5, 2) NOT NULL,
            [NoiDungCongViec] [nvarchar](500) NULL,
            [TrangThai] [nvarchar](50) DEFAULT N'Chờ duyệt',
            [NguoiDuyet] [varchar](20) NULL,
          CONSTRAINT [PK_TIMESHEET_DU_AN] PRIMARY KEY CLUSTERED ([Id] ASC)
        )
      END
    `);

    // 2. Thêm cột FileUrl và FileType vào TIN_NHAN
    await appPool.request().query(`
      IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'FileUrl' AND Object_ID = Object_ID(N'TIN_NHAN'))
      BEGIN
          ALTER TABLE TIN_NHAN ADD FileUrl NVARCHAR(MAX) NULL
      END
    `);
    
    await appPool.request().query(`
      IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'FileType' AND Object_ID = Object_ID(N'TIN_NHAN'))
      BEGIN
          ALTER TABLE TIN_NHAN ADD FileType VARCHAR(50) NULL
      END
    `);

    console.log("Migration Giai đoạn 4 thành công!");
    process.exit(0);
  } catch (error) {
    console.error("Lỗi:", error);
    process.exit(1);
  }
}

runMigrations();
