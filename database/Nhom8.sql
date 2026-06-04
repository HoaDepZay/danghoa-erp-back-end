-- 1. sp_getDashboardSummary
CREATE PROCEDURE sp_getDashboardSummary
AS
BEGIN
    SELECT TieuChi, SoLuong, IconType
    FROM VW_DASHBOARD_SUMMARY
    ORDER BY 
        CASE 
            WHEN TieuChi = N'Tổng nhân viên' THEN 1
            WHEN TieuChi = N'Nhân viên tạm' THEN 2
            WHEN TieuChi = N'Tổng phòng ban' THEN 3
            WHEN TieuChi = N'Tổng dự án' THEN 4
            WHEN TieuChi = N'Dự án đang chạy' THEN 5
            ELSE 6
        END ASC;
END;
GO

-- 5. sp_getPayrollStatistics
CREATE PROCEDURE sp_getPayrollStatistics
    @Thang INT = NULL,
    @Nam INT = NULL
AS
BEGIN
    SELECT Thang, Nam, SoNHAN_VIENTinhLuong, 
           ROUND(TongLuongCoBan, 0) AS TongLuongCoBan,
           ROUND(TongPhuCap, 0) AS TongPhuCap, 
           ROUND(TongThuong, 0) AS TongThuong,
           ROUND(TongKhauTruBHXH, 0) AS TongKhauTruBHXH,
           ROUND(TongThucLanh, 0) AS TongThucLanh,
           ROUND(LuongTrungBinh, 0) AS LuongTrungBinh
    FROM VW_THONGKE_LUONG_THANG
    WHERE (@Thang IS NULL OR Thang = @Thang)
      AND (@Nam IS NULL OR Nam = @Nam)
    ORDER BY Nam DESC, Thang DESC;
END;
GO

-- 11. sp_getRealtimeDashboard (Trả về nhiều result sets)
CREATE PROCEDURE sp_getRealtimeDashboard
AS
BEGIN
    -- Result set 1: Quick Stats
    ;WITH EmployeeStats AS (
        SELECT COUNT(1) AS TotalEmployees,
               SUM(CASE WHEN ISNULL(TrangThaiLamViec, N'') = N'Chính thức' THEN 1 ELSE 0 END) AS OfficialEmployees,
               SUM(CASE WHEN ISNULL(TrangThaiLamViec, N'') <> N'Chính thức' THEN 1 ELSE 0 END) AS NonOfficialEmployees,
               AVG(CAST(ISNULL(LUONG, 0) AS FLOAT)) AS AvgSalary,
               SUM(CAST(ISNULL(LUONG, 0) AS FLOAT)) AS TotalSalary
        FROM NHAN_VIEN
    ),
    ProjectStats AS (
        SELECT COUNT(1) AS TotalProjects,
               SUM(CASE WHEN ISNULL(TrangThai, N'') = N'Đang thực hiện' THEN 1 ELSE 0 END) AS ActiveProjects,
               SUM(CASE WHEN ISNULL(TrangThai, N'') = N'Hoàn thành' THEN 1 ELSE 0 END) AS CompletedProjects
        FROM DU_AN
    ),
    LeaveStats AS (
        SELECT SUM(CASE WHEN ISNULL(TrangThaiDuyet, N'') = N'Chờ duyệt' THEN 1 ELSE 0 END) AS PendingLeaves,
               SUM(CASE WHEN ISNULL(TrangThaiDuyet, N'') = N'Đã duyệt' THEN 1 ELSE 0 END) AS ApprovedLeaves
        FROM DON_NGHI_PHEP
    )
    SELECT es.*, ps.TotalProjects, ps.ActiveProjects, ps.CompletedProjects,
           ISNULL(ls.PendingLeaves, 0) AS PendingLeaves, ISNULL(ls.ApprovedLeaves, 0) AS ApprovedLeaves,
           (SELECT COUNT(1) FROM PHONG_BAN) AS TotalDepartments, GETDATE() AS GeneratedAt
    FROM EmployeeStats es CROSS JOIN ProjectStats ps CROSS JOIN LeaveStats ls;

    -- Result set 2: Department Headcount
    SELECT pb.MAPHG, pb.TENPB, COUNT(nv.MANV) AS EmployeeCount,
           CAST(AVG(CAST(ISNULL(nv.LUONG, 0) AS FLOAT)) AS DECIMAL(18, 2)) AS AvgSalary
    FROM PHONG_BAN pb
    LEFT JOIN NHAN_VIEN nv ON nv.MAPHG = pb.MAPHG
    GROUP BY pb.MAPHG, pb.TENPB
    ORDER BY EmployeeCount DESC;

    -- Result set 3: Project Status
    SELECT ISNULL(TrangThai, N'Không xác định') AS TrangThai, COUNT(1) AS SoLuong
    FROM DU_AN
    GROUP BY ISNULL(TrangThai, N'Không xác định')
    ORDER BY SoLuong DESC;

    -- Result set 4: Attendance
    SELECT COUNT(DISTINCT CASE WHEN bcc.Ngay = CAST(GETDATE() AS DATE) THEN bcc.MaNV END) AS CheckedInToday,
           COUNT(DISTINCT nv.MANV) AS TotalEmployees,
           CASE WHEN COUNT(DISTINCT nv.MANV) = 0 THEN 0 
                ELSE CAST((COUNT(DISTINCT bcc.MaNV) * 100.0) / COUNT(DISTINCT nv.MANV) AS DECIMAL(5, 2)) END AS AttendanceRate
    FROM NHAN_VIEN nv
    LEFT JOIN BAN_CHAM_CONG bcc ON bcc.MaNV = nv.MANV;
END;
GO
-- 4. sp_createDepartment
CREATE PROCEDURE sp_createDepartment
    @MaPhg INT,
    @TenPb NVARCHAR(100),
    @MaTruongPhg VARCHAR(10) = NULL,
    @NgThanhLap DATETIME = NULL
AS
BEGIN
    INSERT INTO PHONG_BAN (MAPHG, TENPB, MaTruongPhg, NG_THANHLAP)
    VALUES (@MaPhg, @TenPb, @MaTruongPhg, ISNULL(@NgThanhLap, GETDATE()));
END;
GO

-- 5. sp_updateDepartment
CREATE PROCEDURE sp_updateDepartment
    @MaPhg INT,
    @TenPb NVARCHAR(100) = NULL,
    @MaTruongPhg VARCHAR(10) = NULL
AS
BEGIN
    UPDATE PHONG_BAN
    SET TENPB = ISNULL(@TenPb, TENPB),
        MaTruongPhg = ISNULL(@MaTruongPhg, MaTruongPhg)
    WHERE MAPHG = @MaPhg;
END;
GO
-- 1. sp_getAllEmployees (Phân trang và Tìm kiếm)
CREATE PROCEDURE sp_getAllEmployees
    @PageNum INT = 1,
    @PageSize INT = 10,
    @SearchKeyword NVARCHAR(100) = ''
AS
BEGIN
    DECLARE @Offset INT = (@PageNum - 1) * @PageSize;
    
    -- Lấy dữ liệu
    SELECT nv.MANV, nv.HOTEN, nv.EMAIL, nv.CHUCVU, nv.LUONG, pb.TENPB, nv.MAPHG,
           nv.NgaySinh, nv.GioiTinh, nv.DiaChi, nv.NgayTuyenDung
    FROM NHAN_VIEN nv
    LEFT JOIN PHONG_BAN pb ON nv.MAPHG = pb.MAPHG
    WHERE (@SearchKeyword = '' OR nv.HOTEN LIKE '%' + @SearchKeyword + '%' 
           OR nv.MANV LIKE '%' + @SearchKeyword + '%' OR nv.EMAIL LIKE '%' + @SearchKeyword + '%')
    ORDER BY nv.MANV
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Lấy tổng số record (Result set 2)
    SELECT COUNT(*) as TotalRecords 
    FROM NHAN_VIEN 
    WHERE (@SearchKeyword = '' OR HOTEN LIKE '%' + @SearchKeyword + '%' 
           OR MANV LIKE '%' + @SearchKeyword + '%' OR EMAIL LIKE '%' + @SearchKeyword + '%');
END;
GO

-- 5. sp_deleteEmployee (Dùng Transaction)
CREATE PROCEDURE sp_deleteEmployee
    @MaNV NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM NHAN_VIEN WHERE MANV = @MaNV)
            THROW 50001, N'Nhân viên không tồn tại', 1;

        DELETE FROM PHAN_CONG_DU_AN WHERE MaNV = @MaNV;
        DELETE FROM NHAN_VIEN WHERE MANV = @MaNV;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
-- 1. sp_handleDatabaseUser (Sử dụng Dynamic SQL để tạo User)
CREATE PROCEDURE sp_handleDatabaseUser
    @Email NVARCHAR(100),
    @Password NVARCHAR(255),
    @Action VARCHAR(10)
AS
BEGIN
    DECLARE @SafeEmail NVARCHAR(200) = QUOTENAME(@Email);
    DECLARE @SQL NVARCHAR(MAX);

    IF UPPER(@Action) = 'CREATE'
    BEGIN
        SET @SQL = 'IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = ' + QUOTENAME(@Email, '''') + ')
                    BEGIN
                        CREATE USER ' + @SafeEmail + ' WITH PASSWORD = ' + QUOTENAME(@Password, '''') + ';
                    END';
    END
    ELSE IF UPPER(@Action) = 'DROP'
    BEGIN
        SET @SQL = 'IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = ' + QUOTENAME(@Email, '''') + ')
                    BEGIN
                        DROP USER ' + @SafeEmail + ';
                    END';
    END
    EXEC sp_executesql @SQL;
END;
GO

-- 2. sp_savePendingRegistration
CREATE PROCEDURE sp_savePendingRegistration
    @MaNV NVARCHAR(10),
    @Email NVARCHAR(100),
    @PassEnc NVARCHAR(MAX),
    @HoTen NVARCHAR(200),
    @MaPhg INT,
    @Luong DECIMAL(18,2),
    @ChucVu NVARCHAR(100),
    @OtpCode NVARCHAR(6),
    @ExpiredAt DATETIME
AS
BEGIN
    MERGE [dbo].[DANG_KY_CHO] AS target
    USING (SELECT @Email AS Email) AS source
    ON (target.Email = source.Email)
    WHEN MATCHED THEN
        UPDATE SET MaNV = @MaNV, PasswordMaHoa = @PassEnc, HoTen = @HoTen, 
                   MaPhg = @MaPhg, Luong = @Luong, ChucVu = @ChucVu, 
                   OtpCode = @OtpCode, ExpiredAt = @ExpiredAt, CreatedAt = GETDATE(),
                   RegistrationStatus = 'PENDING_OTP', OtpVerifiedAt = NULL
    WHEN NOT MATCHED THEN
        INSERT (MaNV, Email, PasswordMaHoa, HoTen, MaPhg, Luong, ChucVu, OtpCode, ExpiredAt, RegistrationStatus)
        VALUES (@MaNV, @Email, @PassEnc, @HoTen, @MaPhg, @Luong, @ChucVu, @OtpCode, @ExpiredAt, 'PENDING_OTP');
END;
GO
