import { appPool } from "./config/db";

async function updateDatabase() {
  console.log("🔍 Đang kết nối Database...");
  try {
    await appPool.connect();
    console.log("✅ Kết nối thành công!");

    // 1. Tạo bảng CHIEN_DICH_TUYEN_DUNG
    console.log("⏳ Tạo bảng CHIEN_DICH_TUYEN_DUNG...");
    await appPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CHIEN_DICH_TUYEN_DUNG]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG](
          [MA_CD] [varchar](20) NOT NULL PRIMARY KEY,
          [TIEU_DE] [nvarchar](255) NOT NULL,
          [MA_PHG] [int] NULL,
          [SO_LUONG] [int] NOT NULL DEFAULT 1,
          [HAN_NOP] [date] NULL,
          [TRANG_THAI] [varchar](20) NOT NULL DEFAULT 'OPEN', -- OPEN, CLOSED
          [NGAY_TAO] [datetime] DEFAULT GETDATE(),
          CONSTRAINT [FK_CHIEN_DICH_PHONG_BAN] FOREIGN KEY([MA_PHG]) REFERENCES [dbo].[PHONG_BAN] ([MA_PHG])
        );
      END
    `);

    // 2. Tạo bảng UNG_VIEN
    console.log("⏳ Tạo bảng UNG_VIEN...");
    await appPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UNG_VIEN]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[UNG_VIEN](
          [MA_UV] [varchar](50) NOT NULL PRIMARY KEY,
          [MA_CD] [varchar](20) NOT NULL,
          [HO_TEN] [nvarchar](100) NOT NULL,
          [EMAIL] [varchar](100) NOT NULL,
          [SO_DIEN_THOAI] [varchar](20) NOT NULL,
          [URL_CV] [nvarchar](500) NULL,
          [TRANG_THAI] [varchar](20) NOT NULL DEFAULT 'NEW', -- NEW, INTERVIEW, OFFER, PASSED, FAILED
          [GHI_CHU] [nvarchar](1000) NULL,
          [NGAY_UNG_TUYEN] [datetime] DEFAULT GETDATE(),
          CONSTRAINT [FK_UNG_VIEN_CHIEN_DICH] FOREIGN KEY([MA_CD]) REFERENCES [dbo].[CHIEN_DICH_TUYEN_DUNG] ([MA_CD])
        );
      END
    `);

    console.log("🎉 Hoàn tất cập nhật Database cho Module Tuyển Dụng!");
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật Database:", error);
  } finally {
    process.exit(0);
  }
}

updateDatabase();
