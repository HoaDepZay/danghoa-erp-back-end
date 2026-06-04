USE [master]
GO
/****** Object:  Database [QuanTriNhanSu]    Script Date: 13/03/2026 11:08:13 CH ******/
CREATE DATABASE [QuanTriNhanSu]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'QuanTriNhanSu', FILENAME = N'/var/opt/mssql/data/QuanTriNhanSu.mdf' , SIZE = 8192KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'QuanTriNhanSu_log', FILENAME = N'/var/opt/mssql/data/QuanTriNhanSu_log.ldf' , SIZE = 73728KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
ALTER DATABASE [QuanTriNhanSu] SET COMPATIBILITY_LEVEL = 160
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [QuanTriNhanSu].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [QuanTriNhanSu] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET ARITHABORT OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [QuanTriNhanSu] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [QuanTriNhanSu] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET  DISABLE_BROKER 
GO
ALTER DATABASE [QuanTriNhanSu] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [QuanTriNhanSu] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET RECOVERY FULL 
GO
ALTER DATABASE [QuanTriNhanSu] SET  MULTI_USER 
GO
ALTER DATABASE [QuanTriNhanSu] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [QuanTriNhanSu] SET DB_CHAINING OFF 
GO
ALTER DATABASE [QuanTriNhanSu] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [QuanTriNhanSu] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [QuanTriNhanSu] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [QuanTriNhanSu] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
EXEC sys.sp_db_vardecimal_storage_format N'QuanTriNhanSu', N'ON'
GO
ALTER DATABASE [QuanTriNhanSu] SET QUERY_STORE = ON
GO
ALTER DATABASE [QuanTriNhanSu] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [QuanTriNhanSu]
GO
/****** Object:  User [Thuong123]    Script Date: 13/03/2026 11:08:19 CH ******/
CREATE USER [Thuong123] FOR LOGIN [Thuong123] WITH DEFAULT_SCHEMA=[dbo]
GO
/****** Object:  User [hoadang0869@gmail.com]    Script Date: 13/03/2026 11:08:19 CH ******/
CREATE USER [hoadang0869@gmail.com] FOR LOGIN [hoadang0869@gmail.com] WITH DEFAULT_SCHEMA=[dbo]
GO
/****** Object:  User [Giang123]    Script Date: 13/03/2026 11:08:19 CH ******/
CREATE USER [Giang123] FOR LOGIN [Giang123] WITH DEFAULT_SCHEMA=[dbo]
GO
/****** Object:  User [Dung1234]    Script Date: 13/03/2026 11:08:19 CH ******/
CREATE USER [Dung1234] FOR LOGIN [Dung1234] WITH DEFAULT_SCHEMA=[dbo]
GO
ALTER ROLE [db_owner] ADD MEMBER [Thuong123]
GO
ALTER ROLE [db_accessadmin] ADD MEMBER [Thuong123]
GO
ALTER ROLE [db_securityadmin] ADD MEMBER [Thuong123]
GO
ALTER ROLE [db_ddladmin] ADD MEMBER [Thuong123]
GO
ALTER ROLE [db_backupoperator] ADD MEMBER [Thuong123]
GO
ALTER ROLE [db_datareader] ADD MEMBER [Thuong123]
GO
ALTER ROLE [db_datawriter] ADD MEMBER [Thuong123]
GO
ALTER ROLE [db_denydatareader] ADD MEMBER [Thuong123]
GO
ALTER ROLE [db_denydatawriter] ADD MEMBER [Thuong123]
GO
ALTER ROLE [db_datareader] ADD MEMBER [hoadang0869@gmail.com]
GO
ALTER ROLE [db_datawriter] ADD MEMBER [hoadang0869@gmail.com]
GO
ALTER ROLE [db_owner] ADD MEMBER [Dung1234]
GO
ALTER ROLE [db_accessadmin] ADD MEMBER [Dung1234]
GO
ALTER ROLE [db_securityadmin] ADD MEMBER [Dung1234]
GO
ALTER ROLE [db_ddladmin] ADD MEMBER [Dung1234]
GO
ALTER ROLE [db_backupoperator] ADD MEMBER [Dung1234]
GO
ALTER ROLE [db_datareader] ADD MEMBER [Dung1234]
GO
ALTER ROLE [db_datawriter] ADD MEMBER [Dung1234]
GO
ALTER ROLE [db_denydatareader] ADD MEMBER [Dung1234]
GO
ALTER ROLE [db_denydatawriter] ADD MEMBER [Dung1234]
GO
/****** Object:  Table [dbo].[BAN_CHAM_CONG]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BAN_CHAM_CONG](
	[MaCC] [int] IDENTITY(1,1) NOT NULL,
	[MaNV] [varchar](20) NOT NULL,
	[Ngay] [date] NOT NULL,
	[GioVao] [time](7) NULL,
	[GioRa] [time](7) NULL,
	[TrangThai] [nvarchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[MaCC] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[BANG_LUONG]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[BANG_LUONG](
	[MaBL] [int] IDENTITY(1,1) NOT NULL,
	[MaNV] [varchar](20) NOT NULL,
	[Thang] [int] NOT NULL,
	[Nam] [int] NOT NULL,
	[SoNgayCongThucTe] [float] NOT NULL,
	[LuongCoBan] [decimal](18, 2) NOT NULL,
	[PhuCap] [decimal](18, 2) NOT NULL,
	[Thuong] [decimal](18, 2) NOT NULL,
	[KhauTruBHXH] [decimal](18, 2) NOT NULL,
	[ThucLanh] [decimal](18, 2) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[MaBL] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CHUC_DANH]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CHUC_DANH](
	[MaChucDanh] [int] IDENTITY(1,1) NOT NULL,
	[TenChucDanh] [nvarchar](100) NOT NULL,
	[PhuCapChucVu] [decimal](18, 2) NULL,
PRIMARY KEY CLUSTERED 
(
	[MaChucDanh] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DANG_KY_CHO]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DANG_KY_CHO](
	[Email] [nvarchar](100) NOT NULL,
	[MaNV] [nvarchar](10) NULL,
	[PasswordMaHoa] [nvarchar](max) NULL,
	[HoTen] [nvarchar](200) NULL,
	[MaPhg] [int] NULL,
	[Luong] [decimal](18, 2) NULL,
	[ChucVu] [nvarchar](100) NULL,
	[OtpCode] [nvarchar](6) NULL,
	[ExpiredAt] [datetime] NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DON_NGHI_PHEP]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DON_NGHI_PHEP](
	[MaDon] [int] IDENTITY(1,1) NOT NULL,
	[MaNV] [varchar](20) NOT NULL,
	[MaLoaiNghi] [int] NOT NULL,
	[TuNgay] [datetime] NOT NULL,
	[DenNgay] [datetime] NOT NULL,
	[LyDo] [nvarchar](max) NULL,
	[TrangThaiDuyet] [nvarchar](50) NULL,
	[NguoiDuyet] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[MaDon] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DU_AN]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DU_AN](
	[MADA] [int] IDENTITY(1,1) NOT NULL,
	[TENDA] [nvarchar](200) NOT NULL,
	[MoTa] [nvarchar](max) NULL,
	[NgayBatDau] [date] NULL,
	[NgayKetThuc] [date] NULL,
	[TrangThai] [nvarchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[MADA] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[HO_SO_BM]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HO_SO_BM](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[MANV] [varchar](20) NOT NULL,
	[SO_CCCD] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[HOP_DONG]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HOP_DONG](
	[MaHD] [varchar](50) NOT NULL,
	[MaNV] [varchar](20) NOT NULL,
	[LoaiHOP_DONG_LAO_DONG] [nvarchar](50) NOT NULL,
	[TuNgay] [date] NOT NULL,
	[DenNgay] [date] NULL,
	[LuongCoBan] [decimal](18, 2) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[MaHD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[LOAI_NGHI_PHEP]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[LOAI_NGHI_PHEP](
	[MaLoaiNghi] [int] NOT NULL,
	[TenLoaiNghi] [nvarchar](100) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[MaLoaiNghi] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[NHAN_VIEN]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[NHAN_VIEN](
	[MANV] [varchar](20) NOT NULL,
	[HOTEN] [nvarchar](100) NOT NULL,
	[EMAIL] [varchar](100) NULL,
	[LUONG] [decimal](18, 2) NULL,
	[CHUCVU] [nvarchar](50) NULL,
	[MAPHG] [int] NULL,
	[GioiTinh] [tinyint] NULL,
	[NgaySinh] [date] NULL,
	[SDT] [varchar](15) NULL,
	[DiaChi] [nvarchar](255) NULL,
	[MaChucDanh] [int] NULL,
	[NgayTuyenDung] [date] NULL,
	[TrangThaiLamViec] [nvarchar](50) NULL,
	[TEN_DANG_NHAP] [varchar](100) NULL,
	[VerificationCode] [varchar](6) NULL,
	[CodeExpiredAt] [datetime] NULL,
	[IsVerified] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[MANV] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PHAN_CONG_DU_AN]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PHAN_CONG_DU_AN](
	[MaDA] [int] NOT NULL,
	[MaNV] [varchar](20) NOT NULL,
	[VaiTroDU_AN] [nvarchar](100) NOT NULL,
	[NgayThamGia] [date] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[MaDA] ASC,
	[MaNV] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PHONG_BAN]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PHONG_BAN](
	[MAPHG] [int] NOT NULL,
	[TENPB] [nvarchar](100) NOT NULL,
	[NG_THANHLAP] [datetime] NULL,
	[MaTruongPhg] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[MAPHG] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[TAI_KHOAN]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[TAI_KHOAN](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[MaNV] [varchar](20) NULL,
	[Email] [varchar](100) NOT NULL,
	[PasswordHash] [varchar](255) NOT NULL,
	[MaVaiTro] [int] NULL,
	[TrangThai] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[VAI_TRO]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[VAI_TRO](
	[MaVaiTro] [int] NOT NULL,
	[TenVaiTro] [nvarchar](50) NOT NULL,
	[MoTa] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[MaVaiTro] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[BANG_LUONG] ADD  DEFAULT ((0)) FOR [SoNgayCongThucTe]
GO
ALTER TABLE [dbo].[BANG_LUONG] ADD  DEFAULT ((0)) FOR [LuongCoBan]
GO
ALTER TABLE [dbo].[BANG_LUONG] ADD  DEFAULT ((0)) FOR [PhuCap]
GO
ALTER TABLE [dbo].[BANG_LUONG] ADD  DEFAULT ((0)) FOR [Thuong]
GO
ALTER TABLE [dbo].[BANG_LUONG] ADD  DEFAULT ((0)) FOR [KhauTruBHXH]
GO
ALTER TABLE [dbo].[BANG_LUONG] ADD  DEFAULT ((0)) FOR [ThucLanh]
GO
ALTER TABLE [dbo].[CHUC_DANH] ADD  DEFAULT ((0)) FOR [PhuCapChucVu]
GO
ALTER TABLE [dbo].[DANG_KY_CHO] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[DON_NGHI_PHEP] ADD  DEFAULT (N'Ch? duy?t') FOR [TrangThaiDuyet]
GO
ALTER TABLE [dbo].[DU_AN] ADD  DEFAULT (N'Ðang lên k? ho?ch') FOR [TrangThai]
GO
ALTER TABLE [dbo].[HOP_DONG] ADD  DEFAULT ((0)) FOR [LuongCoBan]
GO
ALTER TABLE [dbo].[NHAN_VIEN] ADD  DEFAULT ((0)) FOR [LUONG]
GO
ALTER TABLE [dbo].[NHAN_VIEN] ADD  DEFAULT (N'Nhân viên') FOR [CHUCVU]
GO
ALTER TABLE [dbo].[NHAN_VIEN] ADD  DEFAULT (N'Chính th?c') FOR [TrangThaiLamViec]
GO
ALTER TABLE [dbo].[NHAN_VIEN] ADD  DEFAULT ((0)) FOR [IsVerified]
GO
ALTER TABLE [dbo].[PHAN_CONG_DU_AN] ADD  DEFAULT (getdate()) FOR [NgayThamGia]
GO
ALTER TABLE [dbo].[PHONG_BAN] ADD  DEFAULT (getdate()) FOR [NG_THANHLAP]
GO
ALTER TABLE [dbo].[TAI_KHOAN] ADD  DEFAULT ((1)) FOR [TrangThai]
GO
ALTER TABLE [dbo].[BAN_CHAM_CONG]  WITH CHECK ADD FOREIGN KEY([MaNV])
REFERENCES [dbo].[NHAN_VIEN] ([MANV])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[BANG_LUONG]  WITH CHECK ADD FOREIGN KEY([MaNV])
REFERENCES [dbo].[NHAN_VIEN] ([MANV])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[DON_NGHI_PHEP]  WITH CHECK ADD FOREIGN KEY([MaLoaiNghi])
REFERENCES [dbo].[LOAI_NGHI_PHEP] ([MaLoaiNghi])
GO
ALTER TABLE [dbo].[DON_NGHI_PHEP]  WITH CHECK ADD FOREIGN KEY([NguoiDuyet])
REFERENCES [dbo].[NHAN_VIEN] ([MANV])
GO
ALTER TABLE [dbo].[DON_NGHI_PHEP]  WITH CHECK ADD FOREIGN KEY([MaNV])
REFERENCES [dbo].[NHAN_VIEN] ([MANV])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[HO_SO_BM]  WITH CHECK ADD  CONSTRAINT [FK_HS_NV] FOREIGN KEY([MANV])
REFERENCES [dbo].[NHAN_VIEN] ([MANV])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[HO_SO_BM] CHECK CONSTRAINT [FK_HS_NV]
GO
ALTER TABLE [dbo].[HOP_DONG]  WITH CHECK ADD FOREIGN KEY([MaNV])
REFERENCES [dbo].[NHAN_VIEN] ([MANV])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[NHAN_VIEN]  WITH CHECK ADD  CONSTRAINT [FK_NV_CHUCDANH] FOREIGN KEY([MaChucDanh])
REFERENCES [dbo].[CHUC_DANH] ([MaChucDanh])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[NHAN_VIEN] CHECK CONSTRAINT [FK_NV_CHUCDANH]
GO
ALTER TABLE [dbo].[NHAN_VIEN]  WITH CHECK ADD  CONSTRAINT [FK_NV_PB] FOREIGN KEY([MAPHG])
REFERENCES [dbo].[PHONG_BAN] ([MAPHG])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[NHAN_VIEN] CHECK CONSTRAINT [FK_NV_PB]
GO
ALTER TABLE [dbo].[PHAN_CONG_DU_AN]  WITH CHECK ADD FOREIGN KEY([MaDA])
REFERENCES [dbo].[DU_AN] ([MADA])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PHAN_CONG_DU_AN]  WITH CHECK ADD FOREIGN KEY([MaNV])
REFERENCES [dbo].[NHAN_VIEN] ([MANV])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[PHONG_BAN]  WITH CHECK ADD  CONSTRAINT [FK_PB_TRUONGPHONG] FOREIGN KEY([MaTruongPhg])
REFERENCES [dbo].[NHAN_VIEN] ([MANV])
GO
ALTER TABLE [dbo].[PHONG_BAN] CHECK CONSTRAINT [FK_PB_TRUONGPHONG]
GO
ALTER TABLE [dbo].[TAI_KHOAN]  WITH CHECK ADD FOREIGN KEY([MaNV])
REFERENCES [dbo].[NHAN_VIEN] ([MANV])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[TAI_KHOAN]  WITH CHECK ADD FOREIGN KEY([MaVaiTro])
REFERENCES [dbo].[VAI_TRO] ([MaVaiTro])
ON DELETE SET NULL
GO
/****** Object:  StoredProcedure [dbo].[sp_DangKyUserMoi]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[sp_DangKyUserMoi]  
    @MaNV NVARCHAR(10),               -- Mã NVXXXX t? Node.js
    @Email NVARCHAR(100),  
    @Password NVARCHAR(50),  -- V?n c?n d? t?o Login h? th?ng
    @HoTen NVARCHAR(200),  
    @MaPhg INT,  
    @Luong DECIMAL(18,2) = 0,  
    @ChucVu NVARCHAR(100) = NULL,
    @OtpCode NVARCHAR(6) = NULL,      
    @ExpiredAt DATETIME = NULL       
AS  
BEGIN  
    SET NOCOUNT ON;  
    BEGIN TRY  
        BEGIN TRANSACTION;  
  
        -- 1. Khai báo bi?n chu?i SQL d?ng
        DECLARE @SqlLogin NVARCHAR(MAX);
        DECLARE @SqlUser NVARCHAR(MAX);
        DECLARE @SqlRole NVARCHAR(MAX);

        -- 2. T?o LOGIN h? th?ng b?ng Email
        SET @SqlLogin = N'CREATE LOGIN ' + QUOTENAME(@Email) +   
                        N' WITH PASSWORD = ''' + REPLACE(@Password, '''', '''''') + N''', ' +  
                        N' DEFAULT_DATABASE = [QuanTriNhanSu], CHECK_POLICY = ON;';  
        EXEC sp_executesql @SqlLogin;  
  
        -- 3. T?o USER trong Database ?ng v?i Login v?a t?o
        SET @SqlUser = N'CREATE USER ' + QUOTENAME(@Email) + N' FOR LOGIN ' + QUOTENAME(@Email);  
        EXEC sp_executesql @SqlUser;  
  
        -- 4. Gán quy?n co b?n cho User (Ð?c/Ghi d? li?u)
        SET @SqlRole = N'ALTER ROLE [db_datareader] ADD MEMBER ' + QUOTENAME(@Email) + N'; ' +  
                       N'ALTER ROLE [db_datawriter] ADD MEMBER ' + QUOTENAME(@Email) + N';';  
        EXEC sp_executesql @SqlRole;  
  
        -- 5. INSERT vào b?ng NHAN_VIEN (Ðã b? c?t MAT_KHAU)
        INSERT INTO [dbo].[NHAN_VIEN] (
            MANV, 
            TEN_DANG_NHAP, 
            EMAIL, 
            HOTEN, 
            MAPHG, 
            LUONG, 
            CHUCVU, 
            VerificationCode, 
            CodeExpiredAt, 
            IsVerified
            -- KHÔNG CÓ MAT_KHAU ? ÐÂY
        )
        VALUES (
            @MaNV, 
            @Email, 
            @Email, 
            ISNULL(@HoTen, @Email), 
            @MaPhg, 
            ISNULL(@Luong, 0), 
            ISNULL(@ChucVu, N'Nhân viên'),
            @OtpCode, 
            @ExpiredAt, 
            0 -- M?c d?nh chua xác th?c OTP
        );
  
        -- Tr? v? thông tin d? Node.js bi?t là dã t?o thành công
        SELECT MANV, HOTEN, EMAIL FROM [dbo].[NHAN_VIEN] WHERE MANV = @MaNV;  
  
        COMMIT TRANSACTION;  
    END TRY  
    BEGIN CATCH  
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;  
        
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH  
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_KichHoatTaiKhoanChinhThuc]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   PROCEDURE [dbo].[sp_KichHoatTaiKhoanChinhThuc]
    @MaNV NVARCHAR(10), 
    @Email NVARCHAR(100), 
    @Password NVARCHAR(50),
    @HoTen NVARCHAR(200), 
    @MaPhg INT, 
    @Luong DECIMAL(18,2), 
    @ChucVu NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- 1. Khai báo các bi?n chu?i d?ng (Ch? khai báo, không gán ngay)
        DECLARE @SqlDrop NVARCHAR(MAX);
        DECLARE @SqlLogin NVARCHAR(MAX);
        DECLARE @SqlUser NVARCHAR(MAX);
        DECLARE @SqlRoleRead NVARCHAR(MAX);
        DECLARE @SqlRoleWrite NVARCHAR(MAX);

        -- 2. Ki?m tra và xóa Login cu n?u t?n t?i
        IF EXISTS (SELECT * FROM sys.server_principals WHERE name = @Email)
        BEGIN
            SET @SqlDrop = N'DROP LOGIN ' + QUOTENAME(@Email);
            EXEC sp_executesql @SqlDrop;
        END

        -- 3. Xây d?ng l?nh CREATE LOGIN (Tách riêng l?nh SET d? tránh l?i '+')
        SET @SqlLogin = N'CREATE LOGIN ' + QUOTENAME(@Email) + 
                        N' WITH PASSWORD = ''' + REPLACE(@Password, '''', '''''') + N''', ' +  
                        N' DEFAULT_DATABASE = [QuanTriNhanSu], CHECK_POLICY = ON;';  
        EXEC sp_executesql @SqlLogin;

        -- 4. Xây d?ng l?nh CREATE USER
        SET @SqlUser = N'CREATE USER ' + QUOTENAME(@Email) + N' FOR LOGIN ' + QUOTENAME(@Email) + N';';  
        EXEC sp_executesql @SqlUser;

        -- 5. Xây d?ng l?nh gán quy?n
        SET @SqlRoleRead = N'ALTER ROLE [db_datareader] ADD MEMBER ' + QUOTENAME(@Email);
        SET @SqlRoleWrite = N'ALTER ROLE [db_datawriter] ADD MEMBER ' + QUOTENAME(@Email);
        
        EXEC sp_executesql @SqlRoleRead;
        EXEC sp_executesql @SqlRoleWrite;

        -- 6. CHÈN D? LI?U: Ðã lu?c b? các c?t du th?a v?a xóa
        INSERT INTO [dbo].[NHAN_VIEN] (
            MANV, 
            EMAIL, 
            HOTEN, 
            MAPHG, 
            LUONG, 
            CHUCVU
        )
        VALUES (
            @MaNV, 
            @Email, 
            ISNULL(@HoTen, @Email), 
            @MaPhg, 
            ISNULL(@Luong, 0), 
            ISNULL(@ChucVu, N'Nhân viên')
        );

        COMMIT TRANSACTION;
        -- Tr? v? Success cho Backend
        SELECT 1 AS Success, N'Kích ho?t tài kho?n thành công' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END
GO
/****** Object:  StoredProcedure [dbo].[sp_LuuDangKyTam]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 2. Procedure luu d? li?u t?m
CREATE PROCEDURE [dbo].[sp_LuuDangKyTam]
    @MaNV NVARCHAR(10), @Email NVARCHAR(100), @PassEnc NVARCHAR(MAX),
    @HoTen NVARCHAR(200), @MaPhg INT, @Luong DECIMAL(18,2),
    @ChucVu NVARCHAR(100), @OtpCode NVARCHAR(6), @ExpiredAt DATETIME
AS
BEGIN
    -- N?u email dã t?n t?i trong hàng d?i, c?p nh?t l?i thông tin m?i nh?t
    IF EXISTS (SELECT 1 FROM DANG_KY_CHO WHERE Email = @Email)
        UPDATE DANG_KY_CHO SET 
            MaNV = @MaNV, PasswordMaHoa = @PassEnc, HoTen = @HoTen, 
            MaPhg = @MaPhg, Luong = @Luong, ChucVu = @ChucVu, 
            OtpCode = @OtpCode, ExpiredAt = @ExpiredAt, CreatedAt = GETDATE()
        WHERE Email = @Email;
    ELSE
        INSERT INTO DANG_KY_CHO (MaNV, Email, PasswordMaHoa, HoTen, MaPhg, Luong, ChucVu, OtpCode, ExpiredAt)
        VALUES (@MaNV, @Email, @PassEnc, @HoTen, @MaPhg, @Luong, @ChucVu, @OtpCode, @ExpiredAt);
END;
GO
/****** Object:  StoredProcedure [dbo].[sp_VerifyOTP]    Script Date: 13/03/2026 11:08:22 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[sp_VerifyOTP]
    @Email NVARCHAR(100),
    @OtpCode NVARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;
    -- Ki?m tra mã kh?p và chua h?t h?n
    IF EXISTS (
        SELECT 1 FROM NHAN_VIEN 
        WHERE EMAIL = @Email 
          AND VerificationCode = @OtpCode 
          AND CodeExpiredAt > GETDATE()
    )
    BEGIN
        -- C?p nh?t tr?ng thái thành công
        UPDATE NHAN_VIEN 
        SET IsVerified = 1, 
            VerificationCode = NULL, 
            CodeExpiredAt = NULL 
        WHERE EMAIL = @Email;

        SELECT 1 AS Success, N'Xác th?c thành công' AS Message;
    END
    ELSE
    BEGIN
        SELECT 0 AS Success, N'Mã OTP không dúng ho?c dã h?t h?n' AS Message;
    END
END;
GO
USE [master]
GO
ALTER DATABASE [QuanTriNhanSu] SET  READ_WRITE 
GO
