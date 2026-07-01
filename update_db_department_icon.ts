import { appPool, connectDB } from './config/db';

const ICONS = ['Building', 'Building2', 'Briefcase', 'Users', 'Megaphone', 'Heart', 'Shield', 'BadgeDollarSign', 'Settings', 'GraduationCap'];
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

function getRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function run() {
  try {
    await connectDB();
    
    // 1. Thêm cột vào bảng PHONG_BAN
    console.log("Thêm cột ICON và COLOR vào bảng PHONG_BAN...");
    try {
      await appPool.query(`ALTER TABLE PHONG_BAN ADD ICON NVARCHAR(50), COLOR NVARCHAR(20)`);
      console.log("Thêm cột thành công!");
    } catch (e: any) {
      if (e.message.includes("already exists") || e.message.includes("Column already has names")) {
        console.log("Cột đã tồn tại, bỏ qua bước này.");
      } else {
        console.error("Lỗi khi thêm cột:", e.message);
      }
    }
    
    // 2. Gán icon và color ngẫu nhiên cho các phòng ban hiện có
    console.log("Gán random icon và color cho các phòng ban...");
    const departments = await appPool.query("SELECT MA_PHG FROM PHONG_BAN");
    for (const dept of departments.recordset) {
      const icon = getRandom(ICONS);
      const color = getRandom(COLORS);
      await appPool.query(`UPDATE PHONG_BAN SET ICON = '${icon}', COLOR = '${color}' WHERE MA_PHG = ${dept.MA_PHG}`);
    }
    console.log("Gán random thành công!");
    
    // 3. Cập nhật Stored Procedure sp_createDepartment
    console.log("Cập nhật sp_createDepartment...");
    await appPool.query(`
      ALTER PROCEDURE [dbo].[sp_createDepartment]
          @MA_PHG INT,
          @TenPb NVARCHAR(100),
          @MaTruongPhg VARCHAR(10) = NULL,
          @NgThanhLap DATETIME = NULL,
          @ICON NVARCHAR(50) = 'Building',
          @COLOR NVARCHAR(20) = '#3b82f6'
      AS
      BEGIN
          SET NOCOUNT ON;
          
          IF @NgThanhLap IS NULL
              SET @NgThanhLap = GETDATE();

          INSERT INTO PHONG_BAN (MA_PHG, TEN_PB, MA_TRUONG_PHG, NGAY_THANH_LAP, ICON, COLOR)
          VALUES (@MA_PHG, @TenPb, @MaTruongPhg, @NgThanhLap, @ICON, @COLOR);
          
          SELECT * FROM PHONG_BAN WHERE MA_PHG = @MA_PHG;
      END
    `);
    
    // 4. Cập nhật Stored Procedure sp_updateDepartment
    console.log("Cập nhật sp_updateDepartment...");
    await appPool.query(`
      ALTER PROCEDURE [dbo].[sp_updateDepartment]
          @MA_PHG INT,
          @TenPb NVARCHAR(100) = NULL,
          @TenPb_PASSED BIT = 0,
          @MaTruongPhg VARCHAR(10) = NULL,
          @MaTruongPhg_PASSED BIT = 0,
          @ICON NVARCHAR(50) = NULL,
          @ICON_PASSED BIT = 0,
          @COLOR NVARCHAR(20) = NULL,
          @COLOR_PASSED BIT = 0,
          @Status INT OUTPUT
      AS
      BEGIN
          BEGIN TRY
              UPDATE PHONG_BAN
              SET 
                  TEN_PB = CASE WHEN @TenPb_PASSED = 1 THEN @TenPb ELSE TEN_PB END,
                  MA_TRUONG_PHG = CASE WHEN @MaTruongPhg_PASSED = 1 THEN @MaTruongPhg ELSE MA_TRUONG_PHG END,
                  ICON = CASE WHEN @ICON_PASSED = 1 THEN @ICON ELSE ICON END,
                  COLOR = CASE WHEN @COLOR_PASSED = 1 THEN @COLOR ELSE COLOR END
              WHERE MA_PHG = @MA_PHG;

              IF @@ROWCOUNT > 0
                  SET @Status = 1;
              ELSE
                  SET @Status = 0;
          END TRY
          BEGIN CATCH
              SET @Status = -1;
          END CATCH
      END;
    `);
    
    console.log("Hoàn tất cập nhật DB!");
    process.exit(0);
  } catch (error) {
    console.error("Có lỗi xảy ra:", error);
    process.exit(1);
  }
}

run();
