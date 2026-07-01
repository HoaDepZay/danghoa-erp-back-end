import { appPool, connectDB } from './config/db';

const ICONS = ['FolderKanban', 'Briefcase', 'Code', 'Globe', 'Zap', 'Target', 'Star', 'Rocket', 'Monitor', 'Database', 'Layout', 'Smartphone'];
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function getRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function run() {
  try {
    await connectDB();
    
    // 1. Thêm cột vào bảng DU_AN
    console.log("Thêm cột ICON và COLOR vào bảng DU_AN...");
    try {
      await appPool.query(`ALTER TABLE DU_AN ADD ICON NVARCHAR(50), COLOR NVARCHAR(20)`);
      console.log("Thêm cột thành công!");
    } catch (e: any) {
      if (e.message.includes("already exists")) {
        console.log("Cột đã tồn tại, bỏ qua bước này.");
      } else {
        console.error("Lỗi khi thêm cột:", e.message);
      }
    }
    
    // 2. Gán icon và color ngẫu nhiên cho các dự án hiện có
    console.log("Gán random icon và color cho các dự án...");
    const projects = await appPool.query("SELECT MA_DA FROM DU_AN");
    for (const proj of projects.recordset) {
      const icon = getRandom(ICONS);
      const color = getRandom(COLORS);
      await appPool.query(`UPDATE DU_AN SET ICON = '${icon}', COLOR = '${color}' WHERE MA_DA = ${proj.MA_DA}`);
    }
    console.log("Gán random thành công!");
    
    // 3. Cập nhật Stored Procedure sp_createProject
    console.log("Cập nhật sp_createProject...");
    await appPool.query(`
      ALTER PROCEDURE [dbo].[sp_createProject]
          @TENDA NVARCHAR(255),
          @MOTA NVARCHAR(MAX) = NULL,
          @NGAYBATDAU DATE = NULL,
          @NGAYKETTHUC DATE = NULL,
          @TRANGTHAI NVARCHAR(50) = N'Đang lên kế hoạch',
          @CONGKHAI BIT = 1,
          @ICON NVARCHAR(50) = 'FolderKanban',
          @COLOR NVARCHAR(20) = '#3b82f6'
      AS
      BEGIN
          SET NOCOUNT ON;
          
          INSERT INTO DU_AN (TEN_DA, MO_TA, NGAY_BAT_DAU, NGAY_KET_THUC, TRANG_THAI, CONG_KHAI, ICON, COLOR)
          VALUES (@TENDA, @MOTA, @NGAYBATDAU, @NGAYKETTHUC, @TRANGTHAI, @CONGKHAI, @ICON, @COLOR);
          
          SELECT * FROM DU_AN WHERE MA_DA = SCOPE_IDENTITY();
      END
    `);
    
    // 4. Cập nhật Stored Procedure sp_updateProject
    console.log("Cập nhật sp_updateProject...");
    await appPool.query(`
      ALTER PROCEDURE [dbo].[sp_updateProject]
          @MADA INT,
          @TENDA NVARCHAR(255) = NULL,
          @TENDA_PASSED BIT = 0,
          
          @MOTA NVARCHAR(MAX) = NULL,
          @MOTA_PASSED BIT = 0,
          
          @NGAYBATDAU DATE = NULL,
          @NGAYBATDAU_PASSED BIT = 0,
          
          @NGAYKETTHUC DATE = NULL,
          @NGAYKETTHUC_PASSED BIT = 0,
          
          @TRANGTHAI NVARCHAR(50) = NULL,
          @TRANGTHAI_PASSED BIT = 0,
          
          @CONGKHAI BIT = NULL,
          @CONGKHAI_PASSED BIT = 0,
          
          @ICON NVARCHAR(50) = NULL,
          @ICON_PASSED BIT = 0,
          
          @COLOR NVARCHAR(20) = NULL,
          @COLOR_PASSED BIT = 0
      AS
      BEGIN
          SET NOCOUNT ON;
          
          UPDATE DU_AN
          SET 
              TEN_DA = CASE WHEN @TENDA_PASSED = 1 THEN @TENDA ELSE TEN_DA END,
              MO_TA = CASE WHEN @MOTA_PASSED = 1 THEN @MOTA ELSE MO_TA END,
              NGAY_BAT_DAU = CASE WHEN @NGAYBATDAU_PASSED = 1 THEN @NGAYBATDAU ELSE NGAY_BAT_DAU END,
              NGAY_KET_THUC = CASE WHEN @NGAYKETTHUC_PASSED = 1 THEN @NGAYKETTHUC ELSE NGAY_KET_THUC END,
              TRANG_THAI = CASE WHEN @TRANGTHAI_PASSED = 1 THEN @TRANGTHAI ELSE TRANG_THAI END,
              CONG_KHAI = CASE WHEN @CONGKHAI_PASSED = 1 THEN @CONGKHAI ELSE CONG_KHAI END,
              ICON = CASE WHEN @ICON_PASSED = 1 THEN @ICON ELSE ICON END,
              COLOR = CASE WHEN @COLOR_PASSED = 1 THEN @COLOR ELSE COLOR END
          WHERE MA_DA = @MADA;
      END
    `);
    
    console.log("Hoàn tất Database!");
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    process.exit(0);
  }
}

run();
