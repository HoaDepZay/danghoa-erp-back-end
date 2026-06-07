-- Stored procedures for employee operations after table splitting and account standardisation

GO

-- 1. sp_getAllEmployees
CREATE OR ALTER PROCEDURE sp_getAllEmployees
    @PageNum INT = 1,
    @PageSize INT = 10,
    @SearchKeyword NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNum - 1) * @PageSize;

    SELECT nv.*, 
           cv.MAPHG, cv.CHUCVU, cv.MaChucDanh, cv.NgayTuyenDung, cv.TrangThaiLamViec,
           tk.TEN_DANG_NHAP, tk.VerificationCode, tk.CodeExpiredAt, tk.IsVerified,
           tc.LUONG, tc.PHUCAP, tc.PHIBHXH, tc.MaSoThue, tc.SoNguoiPhuThuoc, tc.SoTaiKhoan, tc.NganHang
    FROM NHAN_VIEN nv
    LEFT JOIN THONG_TIN_CONG_VIEC cv ON nv.MANV = cv.MANV
    LEFT JOIN TAI_KHOANG tk ON nv.MANV = tk.MANV
    LEFT JOIN THONG_TIN_TAI_CHINH tc ON nv.MANV = tc.MANV
    WHERE (@SearchKeyword IS NULL OR @SearchKeyword = '' OR nv.HoTen LIKE N'%' + @SearchKeyword + N'%' OR nv.MaNV LIKE N'%' + @SearchKeyword + N'%')
    ORDER BY nv.MaNV
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    SELECT COUNT(*) AS TotalRecords
    FROM NHAN_VIEN nv
    WHERE (@SearchKeyword IS NULL OR @SearchKeyword = '' OR nv.HoTen LIKE N'%' + @SearchKeyword + N'%' OR nv.MaNV LIKE N'%' + @SearchKeyword + N'%');
END
GO

-- 2. sp_getEmployeeById
CREATE OR ALTER PROCEDURE sp_getEmployeeById
    @MaNV NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT nv.*, 
           cv.MAPHG, cv.CHUCVU, cv.MaChucDanh, cv.NgayTuyenDung, cv.TrangThaiLamViec,
           tk.TEN_DANG_NHAP, tk.VerificationCode, tk.CodeExpiredAt, tk.IsVerified,
           tc.LUONG, tc.PHUCAP, tc.PHIBHXH, tc.MaSoThue, tc.SoNguoiPhuThuoc, tc.SoTaiKhoan, tc.NganHang
    FROM NHAN_VIEN nv
    LEFT JOIN THONG_TIN_CONG_VIEC cv ON nv.MANV = cv.MANV
    LEFT JOIN TAI_KHOANG tk ON nv.MANV = tk.MANV
    LEFT JOIN THONG_TIN_TAI_CHINH tc ON nv.MANV = tc.MANV
    WHERE nv.MaNV = @MaNV;
END
GO

-- 3. sp_createEmployee
CREATE OR ALTER PROCEDURE sp_createEmployee
    @MaNV NVARCHAR(50),
    @HoTen NVARCHAR(100),
    @Email NVARCHAR(100),
    @ChucVu NVARCHAR(100) = NULL,
    @Luong DECIMAL(18, 2) = NULL,
    @MaPhg INT = NULL,
    @NgaySinh DATE = NULL,
    @GioiTinh NVARCHAR(10) = NULL,
    @DiaChi NVARCHAR(255) = NULL,
    @NgayTuyenDung DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO NHAN_VIEN (MaNV, HoTen, Email, NgaySinh, GioiTinh, DiaChi)
    VALUES (@MaNV, @HoTen, @Email, @NgaySinh, @GioiTinh, @DiaChi);

    INSERT INTO THONG_TIN_CONG_VIEC (MANV, MAPHG, CHUCVU, NgayTuyenDung)
    VALUES (@MaNV, @MaPhg, @ChucVu, @NgayTuyenDung);

    INSERT INTO TAI_KHOANG (MANV, Email, IsVerified)
    VALUES (@MaNV, @Email, 0);

    INSERT INTO THONG_TIN_TAI_CHINH (MANV, LUONG)
    VALUES (@MaNV, @Luong);
END
GO

-- 4. sp_updateEmployee
CREATE OR ALTER PROCEDURE sp_updateEmployee
    @MaNV NVARCHAR(50),
    @HoTen NVARCHAR(100) = NULL,
    @Email NVARCHAR(100) = NULL,
    @ChucVu NVARCHAR(100) = NULL,
    @Luong DECIMAL(18, 2) = NULL,
    @MaPhg INT = NULL,
    @NgaySinh DATE = NULL,
    @GioiTinh NVARCHAR(10) = NULL,
    @DiaChi NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE NHAN_VIEN
    SET 
        HoTen = ISNULL(@HoTen, HoTen),
        Email = ISNULL(@Email, Email),
        NgaySinh = ISNULL(@NgaySinh, NgaySinh),
        GioiTinh = ISNULL(@GioiTinh, GioiTinh),
        DiaChi = ISNULL(@DiaChi, DiaChi)
    WHERE MaNV = @MaNV;

    UPDATE THONG_TIN_CONG_VIEC
    SET
        ChucVu = ISNULL(@ChucVu, ChucVu),
        MaPhg = ISNULL(@MaPhg, MaPhg)
    WHERE MANV = @MaNV;

    UPDATE THONG_TIN_TAI_CHINH
    SET
        Luong = ISNULL(@Luong, Luong)
    WHERE MANV = @MaNV;
END
GO

-- sp_updateEmployeeLegal
CREATE OR ALTER PROCEDURE sp_updateEmployeeLegal
    @MaNV NVARCHAR(50),
    @HoTen NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE NHAN_VIEN
    SET 
        HoTen = ISNULL(@HoTen, HoTen)
    WHERE MaNV = @MaNV;
END
GO

-- 5. sp_deleteEmployeeFull
CREATE OR ALTER PROCEDURE sp_deleteEmployeeFull
    @MaNV NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM NHAN_VIEN WHERE MaNV = @MaNV;
END
GO

-- 6. sp_changePassword
CREATE OR ALTER PROCEDURE sp_changePassword
    @Email VARCHAR(100),
    @NewPassword VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM TAI_KHOANG WHERE Email = @Email)
    BEGIN
        UPDATE TAI_KHOANG 
        SET PasswordHash = @NewPassword 
        WHERE Email = @Email;
        
        SELECT 1 AS Success, 'Cập nhật mật khẩu thành công' AS Message;
    END
    ELSE
    BEGIN
        SELECT 0 AS Success, 'Không tìm thấy tài khoản với email này' AS Message;
    END
END
GO

-- 7. sp_updateProfile
CREATE OR ALTER PROCEDURE sp_updateProfile
    @Email NVARCHAR(100),
    @HoTen NVARCHAR(100) = NULL,
    @NgaySinh DATE = NULL,
    @GioiTinh NVARCHAR(10) = NULL,
    @DiaChi NVARCHAR(255) = NULL,
    @SDT NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE NHAN_VIEN
    SET 
        HoTen = ISNULL(@HoTen, HoTen),
        NgaySinh = ISNULL(@NgaySinh, NgaySinh),
        GioiTinh = ISNULL(CASE WHEN @GioiTinh = N'Nam' OR @GioiTinh = '1' THEN 1 WHEN @GioiTinh = N'Nữ' OR @GioiTinh = '0' THEN 0 ELSE NULL END, GioiTinh),
        DiaChi = ISNULL(@DiaChi, DiaChi),
        SDT = ISNULL(@SDT, SDT)
    WHERE Email = @Email;
END
GO

-- 8. sp_getEmployeeByPosition
CREATE OR ALTER PROCEDURE sp_getEmployeeByPosition
    @ChucVu NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT nv.*, 
           cv.MAPHG, cv.CHUCVU, cv.MaChucDanh, cv.NgayTuyenDung, cv.TrangThaiLamViec,
           tk.TEN_DANG_NHAP, tk.VerificationCode, tk.CodeExpiredAt, tk.IsVerified,
           tc.LUONG, tc.PHUCAP, tc.PHIBHXH, tc.MaSoThue, tc.SoNguoiPhuThuoc, tc.SoTaiKhoan, tc.NganHang
    FROM NHAN_VIEN nv
    INNER JOIN THONG_TIN_CONG_VIEC cv ON nv.MANV = cv.MANV
    LEFT JOIN TAI_KHOANG tk ON nv.MANV = tk.MANV
    LEFT JOIN THONG_TIN_TAI_CHINH tc ON nv.MANV = tc.MANV
    WHERE cv.ChucVu = @ChucVu;
END
GO

-- 9. sp_getUserByEmail
CREATE OR ALTER PROCEDURE sp_getUserByEmail
    @EMAIL NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT nv.*, 
           cv.MAPHG, cv.CHUCVU, cv.MaChucDanh, cv.NgayTuyenDung, cv.TrangThaiLamViec,
           tk.TEN_DANG_NHAP, tk.VerificationCode, tk.CodeExpiredAt, tk.IsVerified,
           tc.LUONG, tc.PHUCAP, tc.PHIBHXH, tc.MaSoThue, tc.SoNguoiPhuThuoc, tc.SoTaiKhoan, tc.NganHang
    FROM NHAN_VIEN nv
    LEFT JOIN THONG_TIN_CONG_VIEC cv ON nv.MANV = cv.MANV
    LEFT JOIN TAI_KHOANG tk ON nv.MANV = tk.MANV
    LEFT JOIN THONG_TIN_TAI_CHINH tc ON nv.MANV = tc.MANV
    WHERE nv.EMAIL = @EMAIL;
END
GO

-- 10. sp_approvePendingRegistration
CREATE OR ALTER PROCEDURE sp_approvePendingRegistration
    @EMAIL NVARCHAR(100),
    @PASSWORD NVARCHAR(255),
    @MANV VARCHAR(10) = NULL,
    @HOTEN NVARCHAR(200) = NULL,
    @MAPHG INT = NULL,
    @LUONG DECIMAL(18,2) = NULL,
    @CHUCVU NVARCHAR(100) = NULL,
    @STATUS_VERIFIED VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT EXISTS (SELECT 1 FROM DANG_KY_CHO WHERE Email = @EMAIL AND RegistrationStatus = @STATUS_VERIFIED)
    BEGIN
        SELECT 0 AS Success, N'Yêu cầu đăng ký không tồn tại hoặc chưa xác thực OTP' AS Message, NULL AS MaNV, NULL AS Email;
        RETURN;
    END

    -- Insert into NHAN_VIEN
    INSERT INTO NHAN_VIEN (MaNV, HoTen, Email)
    VALUES (@MANV, @HOTEN, @EMAIL);

    -- Insert into THONG_TIN_CONG_VIEC
    INSERT INTO THONG_TIN_CONG_VIEC (MANV, MAPHG, CHUCVU, NgayTuyenDung)
    VALUES (@MANV, @MAPHG, @CHUCVU, GETDATE());

    -- Insert into TAI_KHOANG
    INSERT INTO TAI_KHOANG (MANV, Email, PasswordHash, MaVaiTro, TEN_DANG_NHAP, IsVerified, TrangThai)
    VALUES (@MANV, @EMAIL, @PASSWORD, 3, @EMAIL, 1, 1);

    -- Insert into THONG_TIN_TAI_CHINH
    INSERT INTO THONG_TIN_TAI_CHINH (MANV, LUONG)
    VALUES (@MANV, @LUONG);

    -- Update DANG_KY_CHO status
    UPDATE DANG_KY_CHO
    SET RegistrationStatus = 'APPROVED'
    WHERE Email = @EMAIL AND RegistrationStatus = @STATUS_VERIFIED;

    SELECT 1 AS Success, N'Duyệt nhân viên thành công' AS Message, @MANV AS MaNV, @EMAIL AS Email;
END
GO