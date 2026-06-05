-- Reverse engineered stored procedures for NHAN_VIEN table based on employeeRepository.ts

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

    SELECT *
    FROM NHAN_VIEN
    WHERE (@SearchKeyword IS NULL OR @SearchKeyword = '' OR HoTen LIKE N'%' + @SearchKeyword + N'%' OR MaNV LIKE N'%' + @SearchKeyword + N'%')
    ORDER BY MaNV
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    SELECT COUNT(*) AS TotalRecords
    FROM NHAN_VIEN
    WHERE (@SearchKeyword IS NULL OR @SearchKeyword = '' OR HoTen LIKE N'%' + @SearchKeyword + N'%' OR MaNV LIKE N'%' + @SearchKeyword + N'%');
END
GO

-- 2. sp_getEmployeeById
CREATE OR ALTER PROCEDURE sp_getEmployeeById
    @MaNV NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT *
    FROM NHAN_VIEN
    WHERE MaNV = @MaNV;
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
    @DiaChiNhan NVARCHAR(255) = NULL,
    @NgayVaoLam DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO NHAN_VIEN (MaNV, HoTen, Email, ChucVu, Luong, MaPhg, NgaySinh, GioiTinh, DiaChiNhan, NgayVaoLam)
    VALUES (@MaNV, @HoTen, @Email, @ChucVu, @Luong, @MaPhg, @NgaySinh, @GioiTinh, @DiaChiNhan, @NgayVaoLam);

    -- Logic for handling database user
    -- EXEC sp_handleDatabaseUser @MaNV, @Email, @ChucVu;
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
    @DiaChiNhan NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE NHAN_VIEN
    SET 
        HoTen = ISNULL(@HoTen, HoTen),
        Email = ISNULL(@Email, Email),
        ChucVu = ISNULL(@ChucVu, ChucVu),
        Luong = ISNULL(@Luong, Luong),
        MaPhg = ISNULL(@MaPhg, MaPhg),
        NgaySinh = ISNULL(@NgaySinh, NgaySinh),
        GioiTinh = ISNULL(@GioiTinh, GioiTinh),
        DiaChiNhan = ISNULL(@DiaChiNhan, DiaChiNhan)
    WHERE MaNV = @MaNV;
END
GO

-- sp_updateEmployeeLegal
CREATE OR ALTER PROCEDURE sp_updateEmployeeLegal
    @MaNV NVARCHAR(50),
    @HoTen NVARCHAR(100) = NULL
    -- Add any other specific legal fields here
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
    -- Full delete (or implement soft delete by updating a status column)
    DELETE FROM NHAN_VIEN WHERE MaNV = @MaNV;
END
GO

-- 6. sp_changePassword
CREATE OR ALTER PROCEDURE sp_changePassword
    @Email NVARCHAR(100),
    @NewPassword NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE NHAN_VIEN
    SET Password = @NewPassword -- Assuming Password column exists in NHAN_VIEN
    WHERE Email = @Email;
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
        GioiTinh = ISNULL(@GioiTinh, GioiTinh),
        DiaChiNhan = ISNULL(@DiaChi, DiaChiNhan),
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
    SELECT *
    FROM NHAN_VIEN
    WHERE ChucVu = @ChucVu;
END
GO