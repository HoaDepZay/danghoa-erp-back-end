-- Reverse engineered stored procedures for Department operations

-- sp_getAllDepartments
CREATE OR ALTER PROCEDURE sp_getAllDepartments
AS
BEGIN
    SELECT * FROM PHONG_BAN;
END;
GO

-- sp_getDepartmentById
CREATE OR ALTER PROCEDURE sp_getDepartmentById
    @MaPhg INT
AS
BEGIN
    SELECT * FROM PHONG_BAN WHERE MaPhg = @MaPhg;
END;
GO

-- sp_getEmployeesByDepartment
CREATE OR ALTER PROCEDURE sp_getEmployeesByDepartment
    @MaPhg INT
AS
BEGIN
    SELECT * FROM NHAN_VIEN WHERE MaPhg = @MaPhg;
END;
GO

-- sp_createDepartment
CREATE OR ALTER PROCEDURE sp_createDepartment
    @MaPhg INT,
    @TenPb NVARCHAR(100),
    @MaTruongPhg VARCHAR(10),
    @NgThanhLap DATETIME
AS
BEGIN
    INSERT INTO PHONG_BAN (MaPhg, TenPb, MaTruongPhg, NgThanhLap)
    VALUES (@MaPhg, @TenPb, @MaTruongPhg, @NgThanhLap);
END;
GO

-- sp_updateDepartment
CREATE OR ALTER PROCEDURE sp_updateDepartment
    @MaPhg INT,
    @TenPb NVARCHAR(100) = NULL,
    @MaTruongPhg VARCHAR(10) = NULL,
    @Status INT OUTPUT
AS
BEGIN
    BEGIN TRY
        UPDATE PHONG_BAN
        SET 
            TenPb = ISNULL(@TenPb, TenPb),
            MaTruongPhg = ISNULL(@MaTruongPhg, MaTruongPhg)
        WHERE MaPhg = @MaPhg;

        IF @@ROWCOUNT > 0
            SET @Status = 1;
        ELSE
            SET @Status = 0;
    END TRY
    BEGIN CATCH
        SET @Status = -1;
    END CATCH
END;
GO

-- sp_deleteDepartment
CREATE OR ALTER PROCEDURE sp_deleteDepartment
    @MaPhg INT
AS
BEGIN
    DELETE FROM PHONG_BAN WHERE MaPhg = @MaPhg;
END;
GO

-- sp_getDepartmentsByEmployee
CREATE OR ALTER PROCEDURE sp_getDepartmentsByEmployee
    @MaNV VARCHAR(20)
AS
BEGIN
    SELECT p.* 
    FROM PHONG_BAN p
    INNER JOIN NHAN_VIEN n ON p.MaPhg = n.MaPhg
    WHERE n.MaNV = @MaNV;
END;
GO

-- sp_getDepartmentDetailsByEmployee
CREATE OR ALTER PROCEDURE sp_getDepartmentDetailsByEmployee
    @MaNV VARCHAR(20)
AS
BEGIN
    DECLARE @MaPhg INT;
    
    SELECT @MaPhg = MaPhg FROM NHAN_VIEN WHERE MaNV = @MaNV;
    
    -- Recordset 1: Thông tin phòng ban
    SELECT * FROM PHONG_BAN WHERE MaPhg = @MaPhg;
    
    -- Recordset 2: Danh sách nhân viên
    SELECT * FROM NHAN_VIEN WHERE MaPhg = @MaPhg;
END;
GO

-- sp_isEmployeeInDepartment
CREATE OR ALTER PROCEDURE sp_isEmployeeInDepartment
    @MaNV VARCHAR(20),
    @MaPhg INT
AS
BEGIN
    SELECT COUNT(*) AS count
    FROM NHAN_VIEN
    WHERE MaNV = @MaNV AND MaPhg = @MaPhg;
END;
GO