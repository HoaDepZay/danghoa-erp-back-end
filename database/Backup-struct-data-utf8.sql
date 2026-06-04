USE [master]
GO
CREATE DATABASE [QuanTriNhanSu]
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
    @MaNV NVARCHAR(10),               -- Mã NVXXXX từ Node.js
    @Email NVARCHAR(100),  
    @Password NVARCHAR(50),  -- Vẫn cần để tạo Login hệ thống
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
  
        -- 1. Khai báo biến chuỗi SQL động
        DECLARE @SqlLogin NVARCHAR(MAX);
        DECLARE @SqlUser NVARCHAR(MAX);
        DECLARE @SqlRole NVARCHAR(MAX);

        -- 2. Tạo LOGIN hệ thống bằng Email
        SET @SqlLogin = N'CREATE LOGIN ' + QUOTENAME(@Email) +   
                        N' WITH PASSWORD = ''' + REPLACE(@Password, '''', '''''') + N''', ' +  
                        N' DEFAULT_DATABASE = [QuanTriNhanSu], CHECK_POLICY = ON;';  
        EXEC sp_executesql @SqlLogin;  
  
        -- 3. Tạo USER trong Database ứng với Login vừa tạo
        SET @SqlUser = N'CREATE USER ' + QUOTENAME(@Email) + N' FOR LOGIN ' + QUOTENAME(@Email);  
        EXEC sp_executesql @SqlUser;  
  
        -- 4. Gán quyền cơ bản cho User (Đọc/Ghi dữ liệu)
        SET @SqlRole = N'ALTER ROLE [db_datareader] ADD MEMBER ' + QUOTENAME(@Email) + N'; ' +  
                       N'ALTER ROLE [db_datawriter] ADD MEMBER ' + QUOTENAME(@Email) + N';';  
        EXEC sp_executesql @SqlRole;  
  
        -- 5. INSERT vào bảng NHAN_VIEN (Đã bỏ cột MAT_KHAU)
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
            -- KHÔNG CÓ MAT_KHAU Ở ĐÂY
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
            0 -- Mặc định chưa xác thực OTP
        );
  
        -- Trả về thông tin để Node.js biết là đã tạo thành công
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
        -- 1. Khai báo các biến chuỗi động (Chỉ khai báo, không gán ngay)
        DECLARE @SqlDrop NVARCHAR(MAX);
        DECLARE @SqlLogin NVARCHAR(MAX);
        DECLARE @SqlUser NVARCHAR(MAX);
        DECLARE @SqlRoleRead NVARCHAR(MAX);
        DECLARE @SqlRoleWrite NVARCHAR(MAX);

        -- 2. Kiểm tra và xóa Login cũ nếu tồn tại
        IF EXISTS (SELECT * FROM sys.server_principals WHERE name = @Email)
        BEGIN
            SET @SqlDrop = N'DROP LOGIN ' + QUOTENAME(@Email);
            EXEC sp_executesql @SqlDrop;
        END

        -- 3. Xây dựng lệnh CREATE LOGIN (Tách riêng lệnh SET để tránh lỗi '+')
        SET @SqlLogin = N'CREATE LOGIN ' + QUOTENAME(@Email) + 
                        N' WITH PASSWORD = ''' + REPLACE(@Password, '''', '''''') + N''', ' +  
                        N' DEFAULT_DATABASE = [QuanTriNhanSu], CHECK_POLICY = ON;';  
        EXEC sp_executesql @SqlLogin;

        -- 4. Xây dựng lệnh CREATE USER
        SET @SqlUser = N'CREATE USER ' + QUOTENAME(@Email) + N' FOR LOGIN ' + QUOTENAME(@Email) + N';';  
        EXEC sp_executesql @SqlUser;

        -- 5. Xây dựng lệnh gán quyền
        SET @SqlRoleRead = N'ALTER ROLE [db_datareader] ADD MEMBER ' + QUOTENAME(@Email);
        SET @SqlRoleWrite = N'ALTER ROLE [db_datawriter] ADD MEMBER ' + QUOTENAME(@Email);
        
        EXEC sp_executesql @SqlRoleRead;
        EXEC sp_executesql @SqlRoleWrite;

        -- 6. CHÈN DỮ LIỆU: Đã lược bỏ các cột dư thừa vừa xóa
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
        -- Trả về Success cho Backend
        SELECT 1 AS Success, N'Kích hoạt tài khoản thành công' AS Message;
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

-- 2. Procedure lưu dữ liệu tạm
CREATE PROCEDURE [dbo].[sp_LuuDangKyTam]
    @MaNV NVARCHAR(10), @Email NVARCHAR(100), @PassEnc NVARCHAR(MAX),
    @HoTen NVARCHAR(200), @MaPhg INT, @Luong DECIMAL(18,2),
    @ChucVu NVARCHAR(100), @OtpCode NVARCHAR(6), @ExpiredAt DATETIME
AS
BEGIN
    -- Nếu email đã tồn tại trong hàng đợi, cập nhật lại thông tin mới nhất
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
    -- Kiểm tra mã khớp và chưa hết hạn
    IF EXISTS (
        SELECT 1 FROM NHAN_VIEN 
        WHERE EMAIL = @Email 
          AND VerificationCode = @OtpCode 
          AND CodeExpiredAt > GETDATE()
    )
    BEGIN
        -- Cập nhật trạng thái thành công
        UPDATE NHAN_VIEN 
        SET IsVerified = 1, 
            VerificationCode = NULL, 
            CodeExpiredAt = NULL 
        WHERE EMAIL = @Email;

        SELECT 1 AS Success, N'Xác thực thành công' AS Message;
    END
    ELSE
    BEGIN
        SELECT 0 AS Success, N'Mã OTP không đúng hoặc đã hết hạn' AS Message;
    END
END;
GO
USE [master]
GO
ALTER DATABASE [QuanTriNhanSu] SET  READ_WRITE 
GO
