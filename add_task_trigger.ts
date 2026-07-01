import { appPool, connectDB } from './config/db';

async function run() {
  try {
    await connectDB();
    
    // Xóa trigger cũ nếu có
    await appPool.query(`IF OBJECT_ID('TRG_CheckTaskAssigneeInPhase', 'TR') IS NOT NULL DROP TRIGGER TRG_CheckTaskAssigneeInPhase;`);
    
    // Tạo trigger cho bảng Nhiệm vụ giai đoạn
    await appPool.query(`
      CREATE TRIGGER TRG_CheckTaskAssigneeInPhase
      ON NHIEM_VU_GIAI_DOAN
      FOR INSERT, UPDATE
      AS
      BEGIN
          -- Kiểm tra xem người được giao (MA_NV) có thuộc giai đoạn đó (MA_GD) hay không
          IF EXISTS (
              SELECT 1 
              FROM inserted i
              LEFT JOIN PHAN_CONG_GIAI_DOAN p ON i.MA_GD = p.MA_GD AND i.MA_NV = p.MA_NV
              WHERE i.MA_NV IS NOT NULL AND p.MA_NV IS NULL
          )
          BEGIN
              RAISERROR(N'Lỗi (Database Trigger): Không thể giao việc cho nhân viên không nằm trong danh sách thành viên của giai đoạn này.', 16, 1);
              ROLLBACK TRANSACTION;
          END
      END
    `);
    console.log("✅ Tạo Trigger TRG_CheckTaskAssigneeInPhase thành công!");
    
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    process.exit(0);
  }
}

run();
