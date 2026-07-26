import { appPool } from "./config/db";

async function alterRecruitmentTable() {
  console.log("🔍 Đang kết nối Database để thêm các cột JD cho CHIEN_DICH_TUYEN_DUNG...");
  try {
    await appPool.connect();
    console.log("✅ Kết nối thành công!");

    const queries = [
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CHIEN_DICH_TUYEN_DUNG]') AND name = 'MO_TA_CONG_VIEC')
       BEGIN
         ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] ADD [MO_TA_CONG_VIEC] [nvarchar](max) NULL;
         PRINT 'Added MO_TA_CONG_VIEC';
       END`,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CHIEN_DICH_TUYEN_DUNG]') AND name = 'YEU_CAU_CONG_VIEC')
       BEGIN
         ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] ADD [YEU_CAU_CONG_VIEC] [nvarchar](max) NULL;
         PRINT 'Added YEU_CAU_CONG_VIEC';
       END`,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CHIEN_DICH_TUYEN_DUNG]') AND name = 'QUYEN_LOI')
       BEGIN
         ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] ADD [QUYEN_LOI] [nvarchar](max) NULL;
         PRINT 'Added QUYEN_LOI';
       END`,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CHIEN_DICH_TUYEN_DUNG]') AND name = 'MUC_LUONG')
       BEGIN
         ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] ADD [MUC_LUONG] [nvarchar](100) NULL;
         PRINT 'Added MUC_LUONG';
       END`,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CHIEN_DICH_TUYEN_DUNG]') AND name = 'DIA_DIEM')
       BEGIN
         ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] ADD [DIA_DIEM] [nvarchar](255) NULL;
         PRINT 'Added DIA_DIEM';
       END`,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CHIEN_DICH_TUYEN_DUNG]') AND name = 'LOAI_HINH')
       BEGIN
         ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] ADD [LOAI_HINH] [varchar](50) NULL DEFAULT 'Full-time';
         PRINT 'Added LOAI_HINH';
       END`,
      `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CHIEN_DICH_TUYEN_DUNG]') AND name = 'KINH_NGHIEM')
       BEGIN
         ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] ADD [KINH_NGHIEM] [nvarchar](100) NULL;
         PRINT 'Added KINH_NGHIEM';
       END`
    ];

    for (const q of queries) {
      await appPool.request().query(q);
    }

    console.log("🎉 Hoàn tất cập nhật cấu trúc Database cho bảng CHIEN_DICH_TUYEN_DUNG!");
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật Database:", error);
  } finally {
    process.exit(0);
  }
}

alterRecruitmentTable();
