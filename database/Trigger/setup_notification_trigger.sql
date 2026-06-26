-- 1. Đồng bộ cấu trúc bảng THONG_BAO (sử dụng SNAKE_CASE khớp hoàn toàn với thiết kế cơ sở dữ liệu hiện tại của bạn)
USE [QuanTriNhanSu];
GO

-- 2. Thiết lập Trigger trg_TinNhan_CreateNotification trên bảng TIN_NHAN
-- Khi có tin nhắn mới, trigger sẽ tự động chèn thông báo cho tất cả thành viên trong phòng ngoại trừ người gửi
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_TinNhan_CreateNotification')
    DROP TRIGGER [dbo].[trg_TinNhan_CreateNotification];
GO

CREATE TRIGGER [dbo].[trg_TinNhan_CreateNotification]
ON [dbo].[TIN_NHAN]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Thêm thông báo tự động cho các thành viên khác trong phòng chat
    -- Sử dụng các cột chuẩn đã kiểm tra: MA_NV, TIEU_DE, NOI_DUNG, LOAI, DA_DOC, NGAY_TAO
    INSERT INTO [dbo].[THONG_BAO] (MA_NV, TIEU_DE, NOI_DUNG, LOAI, DA_DOC, NGAY_TAO)
    SELECT 
        tv.MA_NV, 
        N'Tin nhắn mới',
        N'Bạn có tin nhắn mới từ phòng chat: ' + ISNULL(pc.TEN_PHONG, N'Chat riêng') + N'. Nội dung: ' + i.NOI_DUNG,
        N'TIN_NHAN',
        0 AS DA_DOC,
        GETDATE() AS NGAY_TAO
    FROM inserted i
    INNER JOIN [dbo].[THANH_VIEN_PHONG_CHAT] tv ON i.MA_PHONG = tv.MA_PHONG
    INNER JOIN [dbo].[PHONG_CHAT] pc ON i.MA_PHONG = pc.MA_PHONG
    WHERE tv.MA_NV <> i.MA_NV_GUI; -- Loại trừ người gửi tin nhắn
END;
GO

-- 3. Tạo/Cập nhật lại Stored Procedures để khớp chuẩn hóa cột MA_TB, MA_NV, TIEU_DE, NOI_DUNG, LOAI, DA_DOC, NGAY_TAO, LINK
CREATE OR ALTER PROCEDURE [dbo].[sp_getNotifications]
    @MaNV VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 50 
        MA_TB AS MaTB, 
        MA_NV AS MaNV, 
        TIEU_DE AS TieuDe, 
        NOI_DUNG AS NoiDung, 
        LOAI AS Loai, 
        DA_DOC AS DaDoc, 
        NGAY_TAO AS NgayTao, 
        LINK AS Link
    FROM [dbo].[THONG_BAO]
    WHERE MA_NV = @MaNV
    ORDER BY NGAY_TAO DESC;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[sp_markNotificationRead]
    @MaTB INT,
    @MaNV VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Cập nhật đồng bộ cả DA_DOC (SNAKE_CASE gốc) và cột DaDoc (lỗi tạo nhầm trước đó nếu có)
    UPDATE [dbo].[THONG_BAO]
    SET DA_DOC = 1
    WHERE MA_TB = @MaTB AND MA_NV = @MaNV;
    
    -- Trả về đúng tên cột định dạng CamelCase cho API sử dụng alias AS
    SELECT 
        MA_TB AS MaTB, 
        MA_NV AS MaNV, 
        TIEU_DE AS TieuDe, 
        NOI_DUNG AS NoiDung, 
        LOAI AS Loai, 
        DA_DOC AS DaDoc, 
        NGAY_TAO AS NgayTao, 
        LINK AS Link
    FROM [dbo].[THONG_BAO]
    WHERE MA_TB = @MaTB;
END;
GO
