import { connectDB, appPool } from "./config/db";

async function addConstraints() {
  console.log("🔍 Đang kết nối Database để cập nhật và bổ sung các ràng buộc (CHECK constraints) cho module Tuyển dụng...");
  try {
    await connectDB();
    console.log("✅ Kết nối thành công!");

    // 1. Xóa các constraints cũ nếu đã tồn tại
    const dropQueries = [
      `IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_CHIEN_DICH_TRANG_THAI' AND parent_object_id = OBJECT_ID('CHIEN_DICH_TUYEN_DUNG'))
       ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] DROP CONSTRAINT [CK_CHIEN_DICH_TRANG_THAI];`,
      
      `IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_CHIEN_DICH_LOAI_HINH' AND parent_object_id = OBJECT_ID('CHIEN_DICH_TUYEN_DUNG'))
       ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] DROP CONSTRAINT [CK_CHIEN_DICH_LOAI_HINH];`,

      `IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_CHIEN_DICH_KINH_NGHIEM' AND parent_object_id = OBJECT_ID('CHIEN_DICH_TUYEN_DUNG'))
       ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] DROP CONSTRAINT [CK_CHIEN_DICH_KINH_NGHIEM];`,

      `IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_CHIEN_DICH_HAN_NOP' AND parent_object_id = OBJECT_ID('CHIEN_DICH_TUYEN_DUNG'))
       ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] DROP CONSTRAINT [CK_CHIEN_DICH_HAN_NOP];`,

      `IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_UNG_VIEN_TRANG_THAI' AND parent_object_id = OBJECT_ID('UNG_VIEN'))
       ALTER TABLE [dbo].[UNG_VIEN] DROP CONSTRAINT [CK_UNG_VIEN_TRANG_THAI];`
    ];

    for (const q of dropQueries) {
      await appPool.request().query(q);
    }
    console.log("🧹 Đã làm sạch các ràng buộc cũ.");

    // 2. Thêm mới các CHECK constraints (Bao gồm đầy đủ 6 trạng thái quy trình ứng viên và trạng thái chiến dịch)
    const addQueries = [
      {
        name: "CK_CHIEN_DICH_TRANG_THAI",
        query: `ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] 
                ADD CONSTRAINT [CK_CHIEN_DICH_TRANG_THAI] 
                CHECK ([TRANG_THAI] IN ('OPEN', 'CLOSED', 'PAUSED', 'DRAFT', 'NEW', 'INTERVIEW', 'OFFER', 'PASSED', 'FAILED', 'HIRED'));`
      },
      {
        name: "CK_CHIEN_DICH_LOAI_HINH",
        query: `ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] 
                ADD CONSTRAINT [CK_CHIEN_DICH_LOAI_HINH] 
                CHECK ([LOAI_HINH] IS NULL OR [LOAI_HINH] = '' OR [LOAI_HINH] IN ('Full-time', 'Part-time', 'Remote', 'Internship', 'Freelance'));`
      },
      {
        name: "CK_CHIEN_DICH_KINH_NGHIEM",
        query: `ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] 
                ADD CONSTRAINT [CK_CHIEN_DICH_KINH_NGHIEM] 
                CHECK ([KINH_NGHIEM] IS NULL OR [KINH_NGHIEM] = '' OR [KINH_NGHIEM] IN (N'Không yêu cầu', N'Dưới 1 năm', N'1-3 năm', N'3-5 năm', N'Trên 5 năm'));`
      },
      {
        name: "CK_CHIEN_DICH_HAN_NOP",
        query: `ALTER TABLE [dbo].[CHIEN_DICH_TUYEN_DUNG] 
                ADD CONSTRAINT [CK_CHIEN_DICH_HAN_NOP] 
                CHECK ([HAN_NOP] IS NULL OR [NGAY_TAO] IS NULL OR CONVERT([date], [HAN_NOP]) >= CONVERT([date], [NGAY_TAO]));`
      },
      {
        name: "CK_UNG_VIEN_TRANG_THAI",
        query: `ALTER TABLE [dbo].[UNG_VIEN] 
                ADD CONSTRAINT [CK_UNG_VIEN_TRANG_THAI] 
                CHECK ([TRANG_THAI] IN ('NEW', 'INTERVIEW', 'OFFER', 'PASSED', 'FAILED', 'HIRED'));`
      }
    ];

    for (const item of addQueries) {
      console.log(`⏳ Đang tạo ràng buộc ${item.name}...`);
      await appPool.request().query(item.query);
      console.log(`✅ Đã tạo thành công ${item.name}`);
    }

    // 3. Hiển thị lại danh sách ràng buộc
    console.log("\n📋 DANH SÁCH RÀNG BUỘC HIỆN CÓ TRONG MODUDLE TUYỂN DỤNG (CHIEN_DICH_TUYEN_DUNG & UNG_VIEN):");
    const constraints = await appPool.request().query(`
      SELECT OBJECT_NAME(parent_object_id) AS TableName, name, definition 
      FROM sys.check_constraints 
      WHERE parent_object_id IN (OBJECT_ID('CHIEN_DICH_TUYEN_DUNG'), OBJECT_ID('UNG_VIEN'))
    `);
    console.table(constraints.recordset);

  } catch (error) {
    console.error("❌ Lỗi khi thiết lập ràng buộc Database:", error);
  } finally {
    process.exit(0);
  }
}

addConstraints();
