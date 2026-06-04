-- ========================================================
-- PHASE 1: SHIFT & LEAVE MANAGEMENT
-- ========================================================

-- 1. Create CA_LAM_VIEC table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CA_LAM_VIEC]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[CA_LAM_VIEC](
        [MaCa] [int] IDENTITY(1,1) NOT NULL,
        [TenCa] [nvarchar](100) NOT NULL,
        [GioBatDau] [time](7) NOT NULL,
        [GioKetThuc] [time](7) NOT NULL,
        PRIMARY KEY CLUSTERED ([MaCa] ASC)
    );
END
GO

-- 2. Create PHAN_CONG_CA table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PHAN_CONG_CA]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PHAN_CONG_CA](
        [ID] [int] IDENTITY(1,1) NOT NULL,
        [MaNV] [varchar](20) NOT NULL,
        [MaCa] [int] NOT NULL,
        [NgayLamViec] [date] NOT NULL,
        [TrangThai] [nvarchar](50) DEFAULT N'Đã duyệt',
        PRIMARY KEY CLUSTERED ([ID] ASC),
        FOREIGN KEY ([MaNV]) REFERENCES [dbo].[NHAN_VIEN] ([MANV]),
        FOREIGN KEY ([MaCa]) REFERENCES [dbo].[CA_LAM_VIEC] ([MaCa])
    );
END
GO

-- 3. Alter DON_NGHI_PHEP table for multi-level approval
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[DON_NGHI_PHEP]') AND name = 'NguoiDuyet1')
BEGIN
    ALTER TABLE [dbo].[DON_NGHI_PHEP] ADD [NguoiDuyet1] [varchar](20) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[DON_NGHI_PHEP]') AND name = 'NguoiDuyet2')
BEGIN
    ALTER TABLE [dbo].[DON_NGHI_PHEP] ADD [NguoiDuyet2] [varchar](20) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[DON_NGHI_PHEP]') AND name = 'LyDoTuChoi')
BEGIN
    ALTER TABLE [dbo].[DON_NGHI_PHEP] ADD [LyDoTuChoi] [nvarchar](500) NULL;
END
GO

-- 4. Initial Seed for CA_LAM_VIEC
IF NOT EXISTS (SELECT 1 FROM [dbo].[CA_LAM_VIEC])
BEGIN
    INSERT INTO [dbo].[CA_LAM_VIEC] (TenCa, GioBatDau, GioKetThuc)
    VALUES 
        (N'Ca sáng', '08:00:00', '12:00:00'),
        (N'Ca chiều', '13:00:00', '17:00:00'),
        (N'Ca hành chính', '08:00:00', '17:00:00');
END
GO

-- 5. Stored Procedures for Shifts
CREATE OR ALTER PROCEDURE sp_getShifts
AS
BEGIN
    SELECT * FROM CA_LAM_VIEC ORDER BY GioBatDau ASC;
END
GO

CREATE OR ALTER PROCEDURE sp_getShiftAssignments
    @MaNV VARCHAR(20) = NULL,
    @TuNgay DATE = NULL,
    @DenNgay DATE = NULL
AS
BEGIN
    SELECT p.ID, p.MaNV, p.MaCa, p.NgayLamViec, p.TrangThai,
           c.TenCa, c.GioBatDau, c.GioKetThuc,
           n.HOTEN as TenNHAN_VIEN
    FROM PHAN_CONG_CA p
    JOIN CA_LAM_VIEC c ON p.MaCa = c.MaCa
    JOIN NHAN_VIEN n ON p.MaNV = n.MANV
    WHERE (@MaNV IS NULL OR p.MaNV = @MaNV)
      AND (@TuNgay IS NULL OR p.NgayLamViec >= @TuNgay)
      AND (@DenNgay IS NULL OR p.NgayLamViec <= @DenNgay)
    ORDER BY p.NgayLamViec DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_createShiftAssignment
    @MaNV VARCHAR(20),
    @MaCa INT,
    @NgayLamViec DATE,
    @TrangThai NVARCHAR(50) = N'Đã duyệt'
AS
BEGIN
    IF EXISTS (SELECT 1 FROM PHAN_CONG_CA WHERE MaNV = @MaNV AND NgayLamViec = @NgayLamViec)
    BEGIN
        -- Update existing shift
        UPDATE PHAN_CONG_CA
        SET MaCa = @MaCa, TrangThai = @TrangThai
        WHERE MaNV = @MaNV AND NgayLamViec = @NgayLamViec;
    END
    ELSE
    BEGIN
        INSERT INTO PHAN_CONG_CA (MaNV, MaCa, NgayLamViec, TrangThai)
        VALUES (@MaNV, @MaCa, @NgayLamViec, @TrangThai);
    END
END
GO

CREATE OR ALTER PROCEDURE sp_deleteShiftAssignment
    @ID INT
AS
BEGIN
    DELETE FROM PHAN_CONG_CA WHERE ID = @ID;
END
GO

-- 6. Stored Procedures for Leaves (Multi-level approval)
CREATE OR ALTER PROCEDURE sp_getLeaves
    @MaNV VARCHAR(20) = NULL,
    @TrangThaiDuyet NVARCHAR(50) = NULL
AS
BEGIN
    SELECT d.*, n.HOTEN as TenNHAN_VIEN, n.MAPHG
    FROM DON_NGHI_PHEP d
    JOIN NHAN_VIEN n ON d.MANV = n.MANV
    WHERE (@MaNV IS NULL OR d.MANV = @MaNV)
      AND (@TrangThaiDuyet IS NULL OR d.TRANGTHAIDUYET = @TrangThaiDuyet)
    ORDER BY d.TUNGAY DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_approveLeave
    @MaDon INT,
    @NguoiDuyet VARCHAR(20),
    @CapDuyet INT, -- 1: Truong phong, 2: HR/Admin
    @TrangThai NVARCHAR(50), -- N'Đã duyệt', N'Từ chối'
    @LyDoTuChoi NVARCHAR(500) = NULL
AS
BEGIN
    IF @TrangThai = N'Từ chối'
    BEGIN
        UPDATE DON_NGHI_PHEP
        SET TRANGTHAIDUYET = @TrangThai,
            LyDoTuChoi = @LyDoTuChoi,
            NGUOIDUYET = @NguoiDuyet
        WHERE MADON = @MaDon;
    END
    ELSE
    BEGIN
        IF @CapDuyet = 1
        BEGIN
            UPDATE DON_NGHI_PHEP
            SET TRANGTHAIDUYET = N'Chờ duyệt (Cấp 2)',
                NguoiDuyet1 = @NguoiDuyet
            WHERE MADON = @MaDon;
        END
        ELSE IF @CapDuyet = 2
        BEGIN
            UPDATE DON_NGHI_PHEP
            SET TRANGTHAIDUYET = N'Đã duyệt',
                NguoiDuyet2 = @NguoiDuyet,
                NGUOIDUYET = @NguoiDuyet
            WHERE MADON = @MaDon;
        END
    END
END
GO
