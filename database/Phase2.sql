-- ========================================================
-- PHASE 2: CORE HR - THONG TIN PHAP LY & HOP DONG
-- ========================================================

-- 1. Them cot phap ly vao NHAN_VIEN
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[NHAN_VIEN]') AND name = 'MaSoThue')
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [MaSoThue] [varchar](20) NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[NHAN_VIEN]') AND name = 'SoTaiKhoan')
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [SoTaiKhoan] [varchar](30) NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[NHAN_VIEN]') AND name = 'NganHang')
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [NganHang] [nvarchar](100) NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[NHAN_VIEN]') AND name = 'SoNguoiPhuThuoc')
    ALTER TABLE [dbo].[NHAN_VIEN] ADD [SoNguoiPhuThuoc] [int] DEFAULT 0 NULL;
GO

-- 2. Mo rong bang HOP_DONG (them TrangThai, NgayKy, GhiChu)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOP_DONG]') AND name = 'TrangThai')
    ALTER TABLE [dbo].[HOP_DONG] ADD [TrangThai] [nvarchar](50) DEFAULT N'Hiệu lực' NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOP_DONG]') AND name = 'NgayKy')
    ALTER TABLE [dbo].[HOP_DONG] ADD [NgayKy] [date] NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[HOP_DONG]') AND name = 'GhiChu')
    ALTER TABLE [dbo].[HOP_DONG] ADD [GhiChu] [nvarchar](500) NULL;
GO

-- 3. Stored Procedure: Lay danh sach hop dong theo NV
CREATE OR ALTER PROCEDURE sp_getContracts
    @MaNV VARCHAR(20) = NULL
AS
BEGIN
    SELECT hd.*, nv.HOTEN as TenNhanVien, nv.MAPHG,
           DATEDIFF(day, GETDATE(), hd.DENNGAY) AS SoNgayConLai
    FROM HOP_DONG hd
    JOIN NHAN_VIEN nv ON hd.MANV = nv.MANV
    WHERE (@MaNV IS NULL OR hd.MANV = @MaNV)
    ORDER BY hd.TUNGAY DESC;
END
GO

-- 4. Stored Procedure: Lay danh sach hop dong sap het han (< 30 ngay)
CREATE OR ALTER PROCEDURE sp_getExpiringContracts
    @SoNgay INT = 30
AS
BEGIN
    SELECT hd.MAHD, hd.MANV, hd.LOAIHOPDONG, hd.TUNGAY, hd.DENNGAY,
           nv.HOTEN as TenNhanVien, nv.EMAIL, nv.MAPHG, pb.TENPB,
           DATEDIFF(day, GETDATE(), hd.DENNGAY) AS SoNgayConLai
    FROM HOP_DONG hd
    JOIN NHAN_VIEN nv ON hd.MANV = nv.MANV
    LEFT JOIN PHONG_BAN pb ON nv.MAPHG = pb.MAPHG
    WHERE hd.DENNGAY IS NOT NULL
      AND ISNULL(hd.TrangThai, N'Hiệu lực') = N'Hiệu lực'
      AND DATEDIFF(day, GETDATE(), hd.DENNGAY) BETWEEN 0 AND @SoNgay
    ORDER BY SoNgayConLai ASC;
END
GO

-- 5. Stored Procedure: Tao moi hop dong
CREATE OR ALTER PROCEDURE sp_createContract
    @MaNV       VARCHAR(20),
    @LoaiHopDong NVARCHAR(100),
    @TuNgay     DATE,
    @DenNgay    DATE = NULL,
    @LuongCoBan DECIMAL(18,2),
    @NgayKy     DATE = NULL,
    @GhiChu     NVARCHAR(500) = NULL,
    @TrangThai  NVARCHAR(50) = N'Hiệu lực'
AS
BEGIN
    -- Chuyen hop dong cu sang "Het han" neu la loai chinh thuc/gia han moi
    IF @LoaiHopDong != N'Thử việc'
    BEGIN
        UPDATE HOP_DONG
        SET TrangThai = N'Hết hiệu lực'
        WHERE MANV = @MaNV AND ISNULL(TrangThai, N'Hiệu lực') = N'Hiệu lực';
    END

    INSERT INTO HOP_DONG (MANV, LOAIHOPDONG, TUNGAY, DENNGAY, LUONGCOBAN, NgayKy, GhiChu, TrangThai)
    VALUES (@MaNV, @LoaiHopDong, @TuNgay, @DenNgay, @LuongCoBan, ISNULL(@NgayKy, GETDATE()), @GhiChu, @TrangThai);

    -- Dong thoi cap nhat luong chinh trong NHAN_VIEN
    UPDATE NHAN_VIEN SET LUONG = @LuongCoBan WHERE MANV = @MaNV;
END
GO

-- 6. Stored Procedure: Cap nhat thong tin phap ly NV
CREATE OR ALTER PROCEDURE sp_updateEmployeeLegal
    @MaNV            VARCHAR(20),
    @MaSoThue        VARCHAR(20) = NULL,
    @SoTaiKhoan      VARCHAR(30) = NULL,
    @NganHang        NVARCHAR(100) = NULL,
    @SoNguoiPhuThuoc INT = NULL
AS
BEGIN
    UPDATE NHAN_VIEN
    SET MaSoThue        = ISNULL(@MaSoThue, MaSoThue),
        SoTaiKhoan      = ISNULL(@SoTaiKhoan, SoTaiKhoan),
        NganHang        = ISNULL(@NganHang, NganHang),
        SoNguoiPhuThuoc = ISNULL(@SoNguoiPhuThuoc, SoNguoiPhuThuoc)
    WHERE MANV = @MaNV;
END
GO

-- 7. View: Nhan vien sap ket thuc thu viec (canh bao cho HR)
CREATE OR ALTER VIEW VW_NHAN_VIEN_SAP_KET_THUC_THU_VIEC
AS
    SELECT hd.MAHD, hd.MANV, nv.HOTEN, nv.EMAIL, nv.MAPHG, pb.TENPB,
           hd.TUNGAY as NgayBatDauThuViec, hd.DENNGAY as NgayKetThucThuViec,
           DATEDIFF(day, GETDATE(), hd.DENNGAY) AS SoNgayConLai
    FROM HOP_DONG hd
    JOIN NHAN_VIEN nv ON hd.MANV = nv.MANV
    LEFT JOIN PHONG_BAN pb ON nv.MAPHG = pb.MAPHG
    WHERE hd.LOAIHOPDONG = N'Thử việc'
      AND ISNULL(hd.TrangThai, N'Hiệu lực') = N'Hiệu lực'
      AND hd.DENNGAY IS NOT NULL
      AND DATEDIFF(day, GETDATE(), hd.DENNGAY) BETWEEN 0 AND 30;
GO
