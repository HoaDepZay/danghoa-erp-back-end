-- 1. Sử dụng Database chính
USE [QuanTriNhanSu];
GO

-- 2. Cập nhật lại stored procedure phê duyệt đăng ký để tạo LOGIN, USER vật lý và gán vào Role_Staff
CREATE OR ALTER PROCEDURE [dbo].[sp_approvePendingRegistration]
    @EMAIL NVARCHAR(100),
    @PASSWORD NVARCHAR(255),            -- Bcrypt Hash để lưu vào bảng TAI_KHOANG
    @PLAINTEXT_PASSWORD NVARCHAR(100),  -- Password thô để tạo LOGIN SQL Server
    @MANV VARCHAR(20) = NULL,
    @HOTEN NVARCHAR(200) = NULL,
    @MAPHG INT = NULL,
    @LUONG DECIMAL(18,2) = NULL,
    @CHUCVU NVARCHAR(100) = NULL,
    @STATUS_VERIFIED VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Kiểm tra đăng ký chờ
    IF NOT EXISTS (SELECT 1 FROM DANG_KY_CHO WHERE EMAIL = @EMAIL AND REGISTRATION_STATUS = @STATUS_VERIFIED)
    BEGIN
        SELECT 0 AS Success, N'Yêu cầu đăng ký không tồn tại hoặc chưa xác thực OTP' AS Message, NULL AS MaNV, NULL AS Email;
        RETURN;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        -- A. PHÂN QUYỀN MỨC VẬT LÝ SQL SERVER
        -- 1. Tạo LOGIN vật lý trên SQL Server cho nhân sự mới
        DECLARE @SqlLogin NVARCHAR(MAX);
        SET @SqlLogin = N'IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = ' + QUOTENAME(@EMAIL, '''') + N')
                         BEGIN
                             CREATE LOGIN ' + QUOTENAME(@EMAIL) + N' WITH PASSWORD = ' + QUOTENAME(@PLAINTEXT_PASSWORD, '''') + N', DEFAULT_DATABASE = [QuanTriNhanSu], CHECK_POLICY = OFF;
                         END';
        EXEC sp_executesql @SqlLogin;

        -- 2. Tạo USER vật lý tương ứng trong DB QuanTriNhanSu
        DECLARE @SqlUser NVARCHAR(MAX);
        SET @SqlUser = N'IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = ' + QUOTENAME(@EMAIL, '''') + N')
                        BEGIN
                            CREATE USER ' + QUOTENAME(@EMAIL) + N' FOR LOGIN ' + QUOTENAME(@EMAIL) + N';
                        END';
        EXEC sp_executesql @SqlUser;

        -- 3. Gán mặc định vào Database Role [Role_Staff]
        DECLARE @SqlRole NVARCHAR(MAX);
        SET @SqlRole = N'IF DATABASE_PRINCIPAL_ID(''Role_Staff'') IS NOT NULL
                         BEGIN
                             ALTER ROLE [Role_Staff] ADD MEMBER ' + QUOTENAME(@EMAIL) + N';
                         END';
        EXEC sp_executesql @SqlRole;

        -- B. GHI NHẬN HỒ SƠ ỨNG DỤNG
        -- Insert vào NHAN_VIEN
        INSERT INTO NHAN_VIEN (MA_NV, HO_TEN, EMAIL)
        VALUES (@MANV, @HOTEN, @EMAIL);

        -- Lấy mã chức danh tương ứng với tên chức vụ
        DECLARE @MaChucDanh INT = NULL;
        IF @CHUCVU IS NOT NULL
        BEGIN
            SELECT TOP 1 @MaChucDanh = MA_CHUC_DANH 
            FROM CHUC_DANH 
            WHERE TEN_CHUC_DANH LIKE '%' + @CHUCVU + '%';
        END

        IF @MaChucDanh IS NULL
        BEGIN
            SELECT TOP 1 @MaChucDanh = MA_CHUC_DANH FROM CHUC_DANH;
        END

        -- Insert into THONG_TIN_CONG_VIEC
        INSERT INTO THONG_TIN_CONG_VIEC (MA_NV, MA_PHG, MA_CHUC_DANH, NGAY_TUYEN_DUNG, TRANG_THAI_LAM_VIEC)
        VALUES (@MANV, @MAPHG, @MaChucDanh, GETDATE(), N'Chính thức');

        -- Insert into TAI_KHOANG
        INSERT INTO TAI_KHOANG (MA_NV, EMAIL, PASSWORD_HASH, MA_VAI_TRO, TEN_DANG_NHAP, IS_VERIFIED, TRANG_THAI)
        VALUES (@MANV, @EMAIL, @PASSWORD, 3, @EMAIL, 1, 1);

        -- Insert into THONG_TIN_TAI_CHINH
        INSERT INTO THONG_TIN_TAI_CHINH (MA_NV, LUONG)
        VALUES (@MANV, @LUONG);

        -- Update DANG_KY_CHO status
        UPDATE DANG_KY_CHO
        SET REGISTRATION_STATUS = 'APPROVED', APPROVED_AT = GETDATE()
        WHERE EMAIL = @EMAIL AND REGISTRATION_STATUS = @STATUS_VERIFIED;

        COMMIT TRANSACTION;
        SELECT 1 AS Success, N'Duyệt nhân viên và khởi tạo Database Login thành công' AS Message, @MANV AS MaNV, @EMAIL AS Email;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        SELECT 0 AS Success, N'Lỗi phê duyệt: ' + @ErrMsg AS Message, NULL AS MaNV, NULL AS Email;
    END CATCH
END
GO
