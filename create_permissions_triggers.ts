import { appPool, connectDB } from './config/db';

async function run() {
  try {
    await connectDB();
    
    // Xóa trigger cũ nếu có
    await appPool.query(`IF OBJECT_ID('TRG_PreventDeleteLastPM', 'TR') IS NOT NULL DROP TRIGGER TRG_PreventDeleteLastPM;`);
    await appPool.query(`IF OBJECT_ID('TRG_PreventDeleteLastPhaseManager', 'TR') IS NOT NULL DROP TRIGGER TRG_PreventDeleteLastPhaseManager;`);
    
    // Tạo trigger cho Dự án
    await appPool.query(`
      CREATE TRIGGER TRG_PreventDeleteLastPM
      ON PHANCONG_DU_AN
      FOR DELETE, UPDATE
      AS
      BEGIN
          -- Kiểm tra xem có đang ảnh hưởng đến người làm Trưởng dự án (MA_VAI_TRO = 2) không
          IF EXISTS (SELECT 1 FROM deleted WHERE MA_VAI_TRO = 2)
          BEGIN
              DECLARE @AffectedProjects TABLE (MA_DA INT);
              INSERT INTO @AffectedProjects SELECT DISTINCT MA_DA FROM deleted WHERE MA_VAI_TRO = 2;
              
              DECLARE @MA_DA INT;
              DECLARE cur CURSOR FOR SELECT MA_DA FROM @AffectedProjects;
              OPEN cur;
              FETCH NEXT FROM cur INTO @MA_DA;
              
              WHILE @@FETCH_STATUS = 0
              BEGIN
                  DECLARE @RemainingPMCount INT;
                  SELECT @RemainingPMCount = COUNT(*) FROM PHANCONG_DU_AN WHERE MA_DA = @MA_DA AND MA_VAI_TRO = 2;
                  
                  IF @RemainingPMCount = 0
                  BEGIN
                      RAISERROR(N'Lỗi: Không thể xóa hoặc giáng chức Trưởng dự án duy nhất của dự án này.', 16, 1);
                      ROLLBACK TRANSACTION;
                      BREAK;
                  END
                  
                  FETCH NEXT FROM cur INTO @MA_DA;
              END
              
              CLOSE cur;
              DEALLOCATE cur;
          END
      END
    `);
    console.log("✅ Tạo Trigger cho Dự án thành công!");
    
    // Tạo trigger cho Giai đoạn
    await appPool.query(`
      CREATE TRIGGER TRG_PreventDeleteLastPhaseManager
      ON PHAN_CONG_GIAI_DOAN
      FOR DELETE, UPDATE
      AS
      BEGIN
          IF EXISTS (SELECT 1 FROM deleted WHERE VAI_TRO LIKE N'%Trưởng%')
          BEGIN
              DECLARE @AffectedPhases TABLE (MA_GD INT);
              INSERT INTO @AffectedPhases SELECT DISTINCT MA_GD FROM deleted WHERE VAI_TRO LIKE N'%Trưởng%';
              
              DECLARE @MA_GD INT;
              DECLARE cur2 CURSOR FOR SELECT MA_GD FROM @AffectedPhases;
              OPEN cur2;
              FETCH NEXT FROM cur2 INTO @MA_GD;
              
              WHILE @@FETCH_STATUS = 0
              BEGIN
                  DECLARE @RemainingManagerCount INT;
                  SELECT @RemainingManagerCount = COUNT(*) FROM PHAN_CONG_GIAI_DOAN WHERE MA_GD = @MA_GD AND VAI_TRO LIKE N'%Trưởng%';
                  
                  IF @RemainingManagerCount = 0
                  BEGIN
                      RAISERROR(N'Lỗi: Không thể xóa hoặc giáng chức Trưởng giai đoạn duy nhất của giai đoạn này.', 16, 1);
                      ROLLBACK TRANSACTION;
                      BREAK;
                  END
                  
                  FETCH NEXT FROM cur2 INTO @MA_GD;
              END
              
              CLOSE cur2;
              DEALLOCATE cur2;
          END
      END
    `);
    console.log("✅ Tạo Trigger cho Giai đoạn thành công!");
    
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    process.exit(0);
  }
}

run();
