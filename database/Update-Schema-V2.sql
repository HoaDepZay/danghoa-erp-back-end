USE [QuanTriNhanSu]
GO


IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VAITRO')
BEGIN
    CREATE TABLE [dbo].[VAITRO] (
        [MaVaiTro] INT PRIMARY KEY,
        [TenVaiTro] NVARCHAR(50) NOT NULL,
        [MoTa] NVARCHAR(200)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CHUCDANH')
BEGIN
    CREATE TABLE [dbo].[CHUCDANH] (
        [MaChucDanh] INT PRIMARY KEY IDENTITY(1,1),
        [TenChucDanh] NVARCHAR(100) NOT NULL,
        [PhuCapChucVu] DECIMAL(18,2) DEFAULT 0
    );
END
GO

-- ===================================================================================
-- 2. CẬP NHẬT CÁC BẢNG HIỆN TẠI (ALTER TABLE)
-- Đảm bảo giữ nguyên dữ liệu hiện có
-- ===================================================================================

-- Bảng PHONG_BAN: Thêm MaTruongPhg
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.PHONG_BAN') AND name = 'MaTruongPhg')
BEGIN
    ALTER TABLE [dbo].[PHONG_BAN] ADD [MaTruongPhg] VARCHAR(20) NULL;
END
GO

-- Cập nhật bảng NHAN_VIEN
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.NHAN_VIEN') AND name = 'GioiTinh')
BEGIN
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [GioiTinh] TINYINT NULL; -- 0: Nữ, 1: Nam
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [NgaySinh] DATE NULL;
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [SDT] VARCHAR(15) NULL;
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [DiaChi] NVARCHAR(255) NULL;
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [MaChucDanh] INT NULL;
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [NgayTuyenDung] DATE NULL;
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [TrangThaiLamViec] NVARCHAR(50) NULL DEFAULT N'Chính thức';
    
    -- Thêm các cột phục vụ cho Stored Procedure cũ đang gọi mà bị thiếu trong cấu trúc cũ
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [TEN_DANG_NHAP] VARCHAR(100) NULL;
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [VerificationCode] VARCHAR(6) NULL;
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [CodeExpiredAt] DATETIME NULL;
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [IsVerified] BIT NULL DEFAULT 0;
END
GO

-- Tạo khóa ngoại từ NHAN_VIEN tới CHUCDANH
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID('dbo.FK_NV_CHUCDANH'))
BEGIN
    ALTER TABLE [dbo].[NHAN_VIEN] ADD CONSTRAINT [FK_NV_CHUCDANH] FOREIGN KEY([MaChucDanh]) REFERENCES [dbo].[CHUCDANH] ([MaChucDanh]) ON DELETE SET NULL;
END
GO

-- Tạo khóa ngoại từ PHONG_BAN tới NHAN_VIEN (Trưởng phòng)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE object_id = OBJECT_ID('dbo.FK_PB_TRUONGPHONG'))
BEGIN
    ALTER TABLE [dbo].[PHONG_BAN] ADD CONSTRAINT [FK_PB_TRUONGPHONG] FOREIGN KEY([MaTruongPhg]) REFERENCES [dbo].[NHAN_VIEN] ([MANV]);
END
GO

-- Cập nhật bảng DU_AN
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.DU_AN') AND name = 'MoTa')
BEGIN
    ALTER TABLE [dbo].[DU_AN] ADD [MoTa] NVARCHAR(MAX) NULL;
    ALTER TABLE [dbo].[DU_AN] ADD [NgayBatDau] DATE NULL;
    ALTER TABLE [dbo].[DU_AN] ADD [NgayKetThuc] DATE NULL;
    ALTER TABLE [dbo].[DU_AN] ADD [TrangThai] NVARCHAR(50) NULL DEFAULT N'Đang lên kế hoạch';
END
GO

-- ===================================================================================
-- 3. TẠO CÁC BẢNG MỚI CÒN LẠI (TÀI KHOẢN, HỢP ĐỒNG, DỰ ÁN...)
-- ===================================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TAIKHOAN')
BEGIN
    CREATE TABLE [dbo].[TAIKHOAN] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [MaNV] VARCHAR(20) NULL FOREIGN KEY REFERENCES [dbo].[NHAN_VIEN]([MANV]) ON DELETE CASCADE,
        [Email] VARCHAR(100) UNIQUE NOT NULL,
        [PasswordHash] VARCHAR(255) NOT NULL,
        [MaVaiTro] INT NULL FOREIGN KEY REFERENCES [dbo].[VAITRO]([MaVaiTro]) ON DELETE SET NULL,
        [TrangThai] BIT DEFAULT 1
    );
END
GO

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

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LOAI_NGHI_PHEP')
BEGIN
    CREATE TABLE [dbo].[LOAI_NGHI_PHEP] (
        [MaLoaiNghi] INT PRIMARY KEY,
        [TenLoaiNghi] NVARCHAR(100) NOT NULL
    );
END
GO

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

-- ===================================================================================
-- 4. DỌN DẸP BẢNG THỪA
-- ===================================================================================
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'test')
BEGIN
    DROP TABLE [dbo].[test];
END
GO
