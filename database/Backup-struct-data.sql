USE [master]
GO
/****** Object:  Database [QuanTriNhanSu]    Script Date: 09/03/2026 8:35:37 CH ******/
CREATE DATABASE [QuanTriNhanSu]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'QuanTriNhanSu', FILENAME = N'/var/opt/mssql/data/QuanTriNhanSu.mdf' , SIZE = 8192KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'QuanTriNhanSu_log', FILENAME = N'/var/opt/mssql/data/QuanTriNhanSu_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
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
/****** Object:  User [Thuong123]    Script Date: 09/03/2026 8:35:40 CH ******/
CREATE USER [Thuong123] FOR LOGIN [Thuong123] WITH DEFAULT_SCHEMA=[dbo]
GO
/****** Object:  User [hoadang0869@gmail.com]    Script Date: 09/03/2026 8:35:40 CH ******/
CREATE USER [hoadang0869@gmail.com] FOR LOGIN [hoadang0869@gmail.com] WITH DEFAULT_SCHEMA=[dbo]
GO
/****** Object:  User [Giang123]    Script Date: 09/03/2026 8:35:40 CH ******/
CREATE USER [Giang123] FOR LOGIN [Giang123] WITH DEFAULT_SCHEMA=[dbo]
GO
ALTER ROLE [db_datareader] ADD MEMBER [hoadang0869@gmail.com]
GO
ALTER ROLE [db_datawriter] ADD MEMBER [hoadang0869@gmail.com]
GO
/****** Object:  Table [dbo].[DANG_KY_CHO]    Script Date: 09/03/2026 8:35:41 CH ******/
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
/****** Object:  Table [dbo].[DU_AN]    Script Date: 09/03/2026 8:35:41 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DU_AN](
	[MADA] [int] IDENTITY(1,1) NOT NULL,
	[TENDA] [nvarchar](200) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[MADA] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[HOSOBM]    Script Date: 09/03/2026 8:35:41 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[HOSOBM](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[MANV] [varchar](20) NOT NULL,
	[SO_CCCD] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[NHAN_VIEN]    Script Date: 09/03/2026 8:35:41 CH ******/
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
PRIMARY KEY CLUSTERED 
(
	[MANV] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PHONG_BAN]    Script Date: 09/03/2026 8:35:41 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PHONG_BAN](
	[MAPHG] [int] NOT NULL,
	[TENPB] [nvarchar](100) NOT NULL,
	[NG_THANHLAP] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[MAPHG] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[test]    Script Date: 09/03/2026 8:35:41 CH ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[test](
	[vd] [char](2) NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[DANG_KY_CHO] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[NHAN_VIEN] ADD  DEFAULT ((0)) FOR [LUONG]
GO
ALTER TABLE [dbo].[NHAN_VIEN] ADD  DEFAULT (N'Nhân viên') FOR [CHUCVU]
GO
ALTER TABLE [dbo].[PHONG_BAN] ADD  DEFAULT (getdate()) FOR [NG_THANHLAP]
GO
ALTER TABLE [dbo].[HOSOBM]  WITH CHECK ADD  CONSTRAINT [FK_HS_NV] FOREIGN KEY([MANV])
REFERENCES [dbo].[NHAN_VIEN] ([MANV])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[HOSOBM] CHECK CONSTRAINT [FK_HS_NV]
GO
ALTER TABLE [dbo].[NHAN_VIEN]  WITH CHECK ADD  CONSTRAINT [FK_NV_PB] FOREIGN KEY([MAPHG])
REFERENCES [dbo].[PHONG_BAN] ([MAPHG])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[NHAN_VIEN] CHECK CONSTRAINT [FK_NV_PB]
GO
/****** Object:  StoredProcedure [dbo].[sp_DangKyUserMoi]    Script Date: 09/03/2026 8:35:41 CH ******/
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
/****** Object:  StoredProcedure [dbo].[sp_KichHoatTaiKhoanChinhThuc]    Script Date: 09/03/2026 8:35:41 CH ******/
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
/****** Object:  StoredProcedure [dbo].[sp_LuuDangKyTam]    Script Date: 09/03/2026 8:35:41 CH ******/
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
/****** Object:  StoredProcedure [dbo].[sp_VerifyOTP]    Script Date: 09/03/2026 8:35:41 CH ******/
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
