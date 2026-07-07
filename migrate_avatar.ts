import { appPool, connectDB } from "./config/db";

async function run() {
  await connectDB();
  const request = appPool.request();
  
  try {
    // 1. Add Column HINH_DAI_DIEN if not exists
    await request.query(`
      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'[dbo].[NHAN_VIEN]') 
        AND name = 'HINH_DAI_DIEN'
      )
      BEGIN
          ALTER TABLE NHAN_VIEN ADD HINH_DAI_DIEN NVARCHAR(255) NULL;
          PRINT 'Added HINH_DAI_DIEN column to NHAN_VIEN';
      END
    `);
    
    // 2. Alter sp_updateEmployee
    await request.query(`
      ALTER PROCEDURE sp_updateEmployee
          @MaNV NVARCHAR(50),
          @HoTen NVARCHAR(100) = NULL,
          @Email NVARCHAR(100) = NULL,
          @ChucVu NVARCHAR(100) = NULL,
          @Luong DECIMAL(18, 2) = NULL,
          @MaPhg INT = NULL,
          @NgaySinh DATE = NULL,
          @GioiTinh NVARCHAR(10) = NULL,
          @DiaChi NVARCHAR(255) = NULL,
          @HinhDaiDien NVARCHAR(255) = NULL
      AS
      BEGIN
          SET NOCOUNT ON;
          
          UPDATE NHAN_VIEN
          SET 
              HO_TEN = ISNULL(@HoTen, HO_TEN),
              EMAIL = ISNULL(@Email, EMAIL),
              NGAY_SINH = ISNULL(@NgaySinh, NGAY_SINH),
              GIOI_TINH = ISNULL(CASE WHEN @GioiTinh = N'Nam' OR @GioiTinh = '1' THEN 1 WHEN @GioiTinh = N'Nữ' OR @GioiTinh = '0' THEN 0 ELSE NULL END, GIOI_TINH),
              DIA_CHI = ISNULL(@DiaChi, DIA_CHI),
              HINH_DAI_DIEN = ISNULL(@HinhDaiDien, HINH_DAI_DIEN)
          WHERE MA_NV = @MaNV;

          UPDATE THONG_TIN_CONG_VIEC
          SET
              CHUC_VU = ISNULL(@ChucVu, CHUC_VU),
              MA_PHG = ISNULL(@MaPhg, MA_PHG)
          WHERE MA_NV = @MaNV;

          UPDATE THONG_TIN_TAI_CHINH
          SET
              LUONG = ISNULL(@Luong, LUONG)
          WHERE MA_NV = @MaNV;
      END;
    `);
    console.log("Updated sp_updateEmployee");

    // 3. Alter sp_updateProfile
    await request.query(`
      ALTER PROCEDURE [dbo].[sp_updateProfile]
          @Email NVARCHAR(100),
          @HoTen NVARCHAR(100) = NULL,
          @NgaySinh DATE = NULL,
          @GioiTinh NVARCHAR(10) = NULL,
          @DiaChi NVARCHAR(255) = NULL,
          @SDT NVARCHAR(20) = NULL,
          @MaSoThue NVARCHAR(50) = NULL,
          @SoTaiKhoan NVARCHAR(50) = NULL,
          @NganHang NVARCHAR(100) = NULL,
          @HinhDaiDien NVARCHAR(255) = NULL
      AS
      BEGIN
        SET NOCOUNT ON;
          DECLARE @MaNV NVARCHAR(50);
          SELECT @MaNV = MA_NV FROM NHAN_VIEN WHERE EMAIL = @Email;

          IF @MaNV IS NULL RETURN;

          UPDATE NHAN_VIEN
          SET 
              HO_TEN = ISNULL(@HoTen, HO_TEN),
              NGAY_SINH = ISNULL(@NgaySinh, NGAY_SINH),
              GIOI_TINH = ISNULL(CASE WHEN @GioiTinh = N'Nam' OR @GioiTinh = '1' THEN 1 WHEN @GioiTinh = N'Nữ' OR @GioiTinh = '0' THEN 0 ELSE NULL END, GIOI_TINH),
              DIA_CHI = ISNULL(@DiaChi, DIA_CHI),
              SDT = ISNULL(@SDT, SDT),
              HINH_DAI_DIEN = ISNULL(@HinhDaiDien, HINH_DAI_DIEN)
          WHERE MA_NV = @MaNV;

          IF EXISTS (SELECT 1 FROM THONG_TIN_TAI_CHINH WHERE MA_NV = @MaNV)
          BEGIN
              UPDATE THONG_TIN_TAI_CHINH
              SET
                  MA_SO_THUE = ISNULL(@MaSoThue, MA_SO_THUE),
                  SO_TAI_KHOAN = ISNULL(@SoTaiKhoan, SO_TAI_KHOAN),
                  NGAN_HANG = ISNULL(@NganHang, NGAN_HANG)
              WHERE MA_NV = @MaNV;
          END
          ELSE
          BEGIN
              IF @MaSoThue IS NOT NULL OR @SoTaiKhoan IS NOT NULL OR @NganHang IS NOT NULL
              BEGIN
                  INSERT INTO THONG_TIN_TAI_CHINH (MA_NV, MA_SO_THUE, SO_TAI_KHOAN, NGAN_HANG)
                  VALUES (@MaNV, @MaSoThue, @SoTaiKhoan, @NganHang);
              END
          END
      END;
    `);
    console.log("Updated sp_updateProfile");
    
    // Clear cache so db.ts re-fetches params on next restart (or we can just exit)
    console.log("Migration successful");
  } catch (error) {
    console.error("Migration failed", error);
  } finally {
    process.exit(0);
  }
}

run();
