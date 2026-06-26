-- 1. Tạo bảng Danh mục quyền chi tiết
USE [QuanTriNhanSu];
GO

IF OBJECT_ID('dbo.DANH_MUC_QUYEN', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[DANH_MUC_QUYEN] (
        [MaQuyen] VARCHAR(50) PRIMARY KEY,
        [TenQuyen] NVARCHAR(100) NOT NULL,
        [MoTa] NVARCHAR(255) NULL
    );
END
GO

-- 2. Tạo bảng liên kết Nhân viên - Quyền (Phân quyền chi tiết cho từng người)
IF OBJECT_ID('dbo.NHANVIEN_QUYEN', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[NHANVIEN_QUYEN] (
        [MaNV] VARCHAR(20) NOT NULL,
        [MaQuyen] VARCHAR(50) NOT NULL,
        [NgayCap] DATETIME DEFAULT GETDATE(),
        PRIMARY KEY ([MaNV], [MaQuyen]),
        CONSTRAINT [FK_NVQ_NHANVIEN] FOREIGN KEY ([MaNV]) REFERENCES [dbo].[NHAN_VIEN]([MA_NV]) ON DELETE CASCADE,
        CONSTRAINT [FK_NVQ_QUYEN] FOREIGN KEY ([MaQuyen]) REFERENCES [dbo].[DANH_MUC_QUYEN]([MaQuyen]) ON DELETE CASCADE
    );
END
GO

-- 3. Chèn dữ liệu mẫu cho các quyền theo đối tượng yêu cầu
-- Dự án, Phòng ban, Tin nhắn, Nhân viên
IF NOT EXISTS (SELECT 1 FROM [dbo].[DANH_MUC_QUYEN])
BEGIN
    INSERT INTO [dbo].[DANH_MUC_QUYEN] ([MaQuyen], [TenQuyen], [MoTa]) VALUES
    -- Dự án
    ('PROJECT_VIEW', N'Xem dự án', N'Quyền xem danh sách và thông tin chi tiết dự án'),
    ('PROJECT_CREATE', N'Tạo dự án mới', N'Quyền khởi tạo dự án mới trong hệ thống'),
    ('PROJECT_EDIT', N'Sửa dự án', N'Quyền chỉnh sửa thông tin dự án'),
    ('PROJECT_DELETE', N'Xóa dự án', N'Quyền xóa dự án khỏi hệ thống'),
    
    -- Phòng ban
    ('DEPT_VIEW', N'Xem phòng ban', N'Quyền xem danh sách phòng ban'),
    ('DEPT_CREATE', N'Tạo phòng ban mới', N'Quyền khởi tạo phòng ban mới'),
    ('DEPT_EDIT', N'Sửa phòng ban', N'Quyền chỉnh sửa thông tin phòng ban'),
    ('DEPT_DELETE', N'Xóa phòng ban', N'Quyền xóa phòng ban'),
    
    -- Tin nhắn
    ('CHAT_VIEW', N'Xem tin nhắn chat', N'Quyền tham gia và đọc các tin nhắn phòng chat'),
    ('CHAT_SEND', N'Gửi tin nhắn', N'Quyền gửi tin nhắn realtime vào phòng chat'),
    ('CHAT_GROUP_CREATE', N'Tạo group chat mới', N'Quyền tạo nhóm chat tùy chỉnh'),
    ('CHAT_GROUP_MANAGE', N'Quản trị group chat', N'Quyền thêm/xóa thành viên khỏi nhóm chat'),
    
    -- Nhân viên
    ('EMP_VIEW', N'Xem nhân sự', N'Quyền xem hồ sơ nhân sự hệ thống'),
    ('EMP_CREATE', N'Thêm nhân sự mới', N'Quyền tạo hồ sơ nhân viên mới'),
    ('EMP_EDIT', N'Sửa nhân sự', N'Quyền cập nhật thông tin nhân viên'),
    ('EMP_DELETE', N'Xóa nhân sự', N'Quyền xóa tài khoản/hồ sơ nhân sự');
END
GO

-- 4. Cấp quyền mặc định cho tài khoản Developer hiện tại (NVGD0869 / admin / dev) để test
-- Cấp một số quyền và chừa lại một số quyền để trigger báo lỗi "không có quyền"
IF EXISTS (SELECT 1 FROM [dbo].[NHAN_VIEN] WHERE [MA_NV] = 'NVGD0869')
BEGIN
    -- Xóa các quyền cũ nếu có để tránh trùng lặp
    DELETE FROM [dbo].[NHANVIEN_QUYEN] WHERE [MaNV] = 'NVGD0869';

    -- Cấp các quyền View và Send chat
    INSERT INTO [dbo].[NHANVIEN_QUYEN] ([MaNV], [MaQuyen]) VALUES
    ('NVGD0869', 'PROJECT_VIEW'),
    ('NVGD0869', 'DEPT_VIEW'),
    ('NVGD0869', 'CHAT_VIEW'),
    ('NVGD0869', 'CHAT_SEND'),
    ('NVGD0869', 'EMP_VIEW');
END
GO
