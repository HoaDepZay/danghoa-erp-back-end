/*
===================================================================================
HUIT ERP - DATABASE INITIALIZATION SCRIPT
Database Engine: SQL Server
Description: Khởi tạo toàn bộ cấu trúc cơ sở dữ liệu cho hệ thống Quản trị nhân sự.
===================================================================================
*/

USE [master];
GO

-- 1. Tạo Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'QuanTriNhanSu')
BEGIN
    CREATE DATABASE [QuanTriNhanSu];
END
GO

USE [QuanTriNhanSu];
GO

-- ===================================================================================
-- 2. TẠO CÁC BẢNG DANH MỤC (CATEGORY TABLES)
-- ===================================================================================

-- Bảng Vai trò (Quyền hạn)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VAITRO')
BEGIN
    CREATE TABLE [dbo].[VAITRO] (
        [MaVaiTro] INT PRIMARY KEY,
        [TenVaiTro] NVARCHAR(50) NOT NULL,
        [MoTa] NVARCHAR(200)
    );
    -- Thêm dữ liệu mặc định
    INSERT INTO [dbo].[VAITRO] ([MaVaiTro], [TenVaiTro], [MoTa]) VALUES 
    (1, N'Admin', N'Quản trị viên toàn hệ thống'),
    (2, N'Manager', N'Quản lý phòng ban/dự án'),
    (3, N'Employee', N'Nhân viên chính thức');
END
GO

-- Bảng Chức danh
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CHUCDANH')
BEGIN
    CREATE TABLE [dbo].[CHUCDANH] (
        [MaChucDanh] INT PRIMARY KEY IDENTITY(1,1),
        [TenChucDanh] NVARCHAR(100) NOT NULL,
        [PhuCapChucVu] DECIMAL(18,2) DEFAULT 0
    );
END
GO

-- Bảng Phòng ban
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PHONG_BAN')
BEGIN
    CREATE TABLE [dbo].[PHONG_BAN] (
        [MAPHG] INT PRIMARY KEY,
        [TENPB] [nvarchar](100) NOT NULL,
        [NG_THANHLAP] [datetime] DEFAULT GETDATE(),
        [MaTruongPhg] VARCHAR(20) NULL -- Sẽ gán Foreign Key sau khi có bảng NHAN_VIEN
    );
END
GO

-- Bảng Loại nghỉ phép
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LOAI_NGHI_PHEP')
BEGIN
    CREATE TABLE [dbo].[LOAI_NGHI_PHEP] (
        [MaLoaiNghi] INT PRIMARY KEY,
        [TenLoaiNghi] NVARCHAR(100) NOT NULL
    );
    INSERT INTO [dbo].[LOAI_NGHI_PHEP] ([MaLoaiNghi], [TenLoaiNghi]) VALUES 
    (1, N'Nghỉ phép năm'),
    (2, N'Nghỉ bệnh'),
    (3, N'Nghỉ việc riêng'),
    (4, N'Nghỉ thai sản');
END
GO

-- ===================================================================================
-- 3. TẠO CÁC BẢNG CHÍNH (MAIN TABLES)
-- ===================================================================================

-- Bảng Nhân viên
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NHAN_VIEN')
BEGIN
    CREATE TABLE [dbo].[NHAN_VIEN] (
        [MANV] VARCHAR(20) PRIMARY KEY,
        [HOTEN] NVARCHAR(100) NOT NULL,
        [EMAIL] VARCHAR(100) UNIQUE,
        [LUONG] DECIMAL(18,2) DEFAULT 0,
        [CHUCVU] NVARCHAR(50) DEFAULT N'Nhân viên',
        [MAPHG] INT FOREIGN KEY REFERENCES [dbo].[PHONG_BAN]([MAPHG]) ON DELETE SET NULL,
        [GioiTinh] TINYINT NULL, -- 0: Nữ, 1: Nam
        [NgaySinh] DATE NULL,
        [SDT] VARCHAR(15) NULL,
        [DiaChi] NVARCHAR(255) NULL,
        [MaChucDanh] INT FOREIGN KEY REFERENCES [dbo].[CHUCDANH]([MaChucDanh]) ON DELETE SET NULL,
        [NgayTuyenDung] DATE NULL,
        [TrangThaiLamViec] NVARCHAR(50) DEFAULT N'Chính thức',
        [TEN_DANG_NHAP] VARCHAR(100) NULL,
        [VerificationCode] VARCHAR(6) NULL,
        [CodeExpiredAt] DATETIME NULL,
        [IsVerified] BIT DEFAULT 0
    );
END
GO

-- Cập nhật Foreign Key cho PHONG_BAN (Trưởng phòng)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_PB_TRUONGPHONG')
BEGIN
    ALTER TABLE [dbo].[PHONG_BAN] ADD CONSTRAINT [FK_PB_TRUONGPHONG] 
    FOREIGN KEY([MaTruongPhg]) REFERENCES [dbo].[NHAN_VIEN] ([MANV]);
END
GO

-- Bảng Tài khoản người dùng
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TAIKHOAN')
BEGIN
    CREATE TABLE [dbo].[TAIKHOAN] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [MaNV] VARCHAR(20) FOREIGN KEY REFERENCES [dbo].[NHAN_VIEN]([MANV]) ON DELETE CASCADE,
        [Email] VARCHAR(100) UNIQUE NOT NULL,
        [PasswordHash] VARCHAR(255) NOT NULL,
        [MaVaiTro] INT FOREIGN KEY REFERENCES [dbo].[VAITRO]([MaVaiTro]) ON DELETE SET NULL,
        [TrangThai] BIT DEFAULT 1
    );
END
GO

-- Bảng Dự án
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DU_AN')
BEGIN
    CREATE TABLE [dbo].[DU_AN] (
        [MADA] INT IDENTITY(1,1) PRIMARY KEY,
        [TENDA] [nvarchar](200) NOT NULL,
        [MoTa] NVARCHAR(MAX) NULL,
        [NgayBatDau] DATE NULL,
        [NgayKetThuc] DATE NULL,
        [TrangThai] NVARCHAR(50) DEFAULT N'Đang lên kế hoạch'
    );
END
GO

-- ===================================================================================
-- 4. TẠO CÁC BẢNG CHI TIẾT & GIAO DỊCH (TRANSACTION TABLES)
-- ===================================================================================

-- Bảng Hợp đồng lao động
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HOP_DONG_LAO_DONG')
BEGIN
    CREATE TABLE [dbo].[HOP_DONG_LAO_DONG] (
        [MaHD] VARCHAR(50) PRIMARY KEY,
        [MaNV] VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES [dbo].[NHAN_VIEN]([MANV]) ON DELETE CASCADE,
        [LoaiHOP_DONG_LAO_DONG] NVARCHAR(50) NOT NULL,
        [TuNgay] DATE NOT NULL,
        [DenNgay] DATE NULL,
        [LuongCoBan] DECIMAL(18,2) NOT NULL DEFAULT 0
    );
END
GO

-- Bảng Phân công dự án
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PHANCONG_DU_AN')
BEGIN
    CREATE TABLE [dbo].[PHANCONG_DU_AN] (
        [MaDA] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[DU_AN]([MADA]) ON DELETE CASCADE,
        [MaNV] VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES [dbo].[NHAN_VIEN]([MANV]) ON DELETE CASCADE,
        [VaiTroDU_AN] NVARCHAR(100) NOT NULL,
        [NgayThamGia] DATE NOT NULL DEFAULT GETDATE(),
        PRIMARY KEY ([MaDA], [MaNV])
    );
END
GO

-- Bảng Chấm công
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BAN_CHAM_CONG')
BEGIN
    CREATE TABLE [dbo].[BAN_CHAM_CONG] (
        [MaCC] INT IDENTITY(1,1) PRIMARY KEY,
        [MaNV] VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES [dbo].[NHAN_VIEN]([MANV]) ON DELETE CASCADE,
        [Ngay] DATE NOT NULL,
        [GioVao] TIME NULL,
        [GioRa] TIME NULL,
        [TrangThai] NVARCHAR(50) NULL
    );
END
GO

-- Bảng Đơn nghỉ phép
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DON_NGHI_PHEP')
BEGIN
    CREATE TABLE [dbo].[DON_NGHI_PHEP] (
        [MaDon] INT IDENTITY(1,1) PRIMARY KEY,
        [MaNV] VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES [dbo].[NHAN_VIEN]([MANV]) ON DELETE CASCADE,
        [MaLoaiNghi] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[LOAI_NGHI_PHEP]([MaLoaiNghi]),
        [TuNgay] DATETIME NOT NULL,
        [DenNgay] DATETIME NOT NULL,
        [LyDo] NVARCHAR(MAX) NULL,
        [TrangThaiDuyet] NVARCHAR(50) DEFAULT N'Chờ duyệt',
        [NguoiDuyet] VARCHAR(20) NULL FOREIGN KEY REFERENCES [dbo].[NHAN_VIEN]([MANV])
    );
END
GO

-- Bảng Bảng lương
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BANG_LUONG')
BEGIN
    CREATE TABLE [dbo].[BANG_LUONG] (
        [MaBL] INT IDENTITY(1,1) PRIMARY KEY,
        [MaNV] VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES [dbo].[NHAN_VIEN]([MANV]) ON DELETE CASCADE,
        [Thang] INT NOT NULL,
        [Nam] INT NOT NULL,
        [SoNgayCongThucTe] FLOAT NOT NULL DEFAULT 0,
        [LuongCoBan] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [PhuCap] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Thuong] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [KhauTruBHXH] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [ThucLanh] DECIMAL(18,2) NOT NULL DEFAULT 0
    );
END
GO

-- Bảng Hồ sơ bảo mật (CCCD, v.v.)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HOSOBM')
BEGIN
    CREATE TABLE [dbo].[HOSOBM](
        [ID] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [MANV] [varchar](20) NOT NULL FOREIGN KEY REFERENCES [dbo].[NHAN_VIEN]([MANV]) ON DELETE CASCADE,
        [SO_CCCD] [varchar](20) NULL
    );
END
GO

PRINT N'Database initialization completed successfully.';
GO
