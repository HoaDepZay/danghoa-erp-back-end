-- 1. Sử dụng Database chính
USE [QuanTriNhanSu];
GO

-- 2. Dọn dẹp các Roles cũ nếu tồn tại
IF DATABASE_PRINCIPAL_ID('Role_ProjectManager') IS NOT NULL
    DROP ROLE [Role_ProjectManager];
GO
IF DATABASE_PRINCIPAL_ID('Role_HRManager') IS NOT NULL
    DROP ROLE [Role_HRManager];
GO
IF DATABASE_PRINCIPAL_ID('Role_Staff') IS NOT NULL
    DROP ROLE [Role_Staff];
GO

-- 3. Tạo các Roles mới
CREATE ROLE [Role_ProjectManager];
CREATE ROLE [Role_HRManager];
CREATE ROLE [Role_Staff];
GO

-- 4. Phân quyền chi tiết cho Role_ProjectManager (Quản lý dự án)
GRANT SELECT, INSERT, UPDATE, DELETE ON [dbo].[DU_AN] TO [Role_ProjectManager];
GRANT SELECT, INSERT, UPDATE, DELETE ON [dbo].[PHANCONG_DU_AN] TO [Role_ProjectManager];
GO

-- 5. Phân quyền chi tiết cho Role_HRManager (Quản lý phòng ban & nhân sự)
GRANT SELECT, INSERT, UPDATE, DELETE ON [dbo].[NHAN_VIEN] TO [Role_HRManager];
GRANT SELECT, INSERT, UPDATE, DELETE ON [dbo].[PHONG_BAN] TO [Role_HRManager];
GO

-- 6. Phân quyền chi tiết cho Role_Staff (Nhân viên thường)
-- Chỉ được phép đọc thông tin cơ bản, không được phép chỉnh sửa dự án hoặc phòng ban
GRANT SELECT ON [dbo].[NHAN_VIEN] TO [Role_Staff];
GRANT SELECT ON [dbo].[PHONG_BAN] TO [Role_Staff];
GRANT SELECT ON [dbo].[DU_AN] TO [Role_Staff];
GRANT SELECT, INSERT ON [dbo].[TIN_NHAN] TO [Role_Staff];

-- Thiết lập Deny trực tiếp để SQL Server chặn và trả lỗi Permission Denied (Mã lỗi 229)
DENY INSERT, UPDATE, DELETE ON [dbo].[DU_AN] TO [Role_Staff];
DENY INSERT, UPDATE, DELETE ON [dbo].[PHONG_BAN] TO [Role_Staff];
DENY INSERT, UPDATE, DELETE ON [dbo].[NHAN_VIEN] TO [Role_Staff];
GO

-- 7. Gán tài khoản Developer hiện tại vào Role_Staff để kiểm thử
-- Tài khoản developer: servernodejs26@gmail.com (NVGD0869)
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'servernodejs26@gmail.com')
BEGIN
    -- Thêm tài khoản email login vào Role_Staff
    ALTER ROLE [Role_Staff] ADD MEMBER [servernodejs26@gmail.com];
END
GO
