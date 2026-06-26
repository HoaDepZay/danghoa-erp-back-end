const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "1433"),
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

const alterSpQuery = `
ALTER PROCEDURE [dbo].[sp_updateProfile]
    @Email NVARCHAR(100),
    @HoTen NVARCHAR(100) = NULL,
    @NgaySinh DATE = NULL,
    @GioiTinh NVARCHAR(10) = NULL,
    @DiaChi NVARCHAR(255) = NULL,
    @SDT NVARCHAR(20) = NULL,
    @MaSoThue NVARCHAR(50) = NULL,
    @SoTaiKhoan NVARCHAR(50) = NULL,
    @NganHang NVARCHAR(100) = NULL
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
        SDT = ISNULL(@SDT, SDT)
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
`;

async function fix() {
  try {
    await sql.connect(config);
    await sql.query(alterSpQuery);
    console.log("Successfully altered sp_updateProfile!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
