-- ================================================================
-- PHASE 3: HR ANALYTICS - VIEWS & STORED PROCEDURES
-- ================================================================

-- 1. View: Bien dong nhan su theo thang (Turnover Rate)
CREATE OR ALTER VIEW VW_BIEN_DONG_NHAN_SU
AS
    SELECT
        YEAR(NGAYTUYENDUNG)                         AS Nam,
        MONTH(NGAYTUYENDUNG)                        AS Thang,
        COUNT(MANV)                                 AS SoNHAN_VIENMoi,
        0                                           AS SoNHAN_VIENNghi   -- placeholder, co the mo rong
    FROM NHAN_VIEN
    WHERE NGAYTUYENDUNG IS NOT NULL
    GROUP BY YEAR(NGAYTUYENDUNG), MONTH(NGAYTUYENDUNG);
GO

-- 2. View: Chi phi luong theo phong ban
CREATE OR ALTER VIEW VW_CHI_PHI_LUONG_PHONG_BAN
AS
    SELECT
        pb.MAPHG,
        pb.TENPB,
        COUNT(nv.MANV)                              AS SoNHAN_VIEN,
        ISNULL(SUM(CAST(nv.LUONG AS FLOAT)), 0)    AS TongLuong,
        ISNULL(AVG(CAST(nv.LUONG AS FLOAT)), 0)    AS LuongTrungBinh,
        ISNULL(MAX(CAST(nv.LUONG AS FLOAT)), 0)    AS LuongCaoNhat,
        ISNULL(MIN(CAST(nv.LUONG AS FLOAT)), 0)    AS LuongThapNhat
    FROM PHONG_BAN pb
    LEFT JOIN NHAN_VIEN nv ON nv.MAPHG = pb.MAPHG
    GROUP BY pb.MAPHG, pb.TENPB;
GO

-- 3. View: Ty le cham cong tong hop
CREATE OR ALTER VIEW VW_CHAM_CONG_TONG_HOP
AS
    SELECT
        YEAR(b.NGAY)                                AS Nam,
        MONTH(b.NGAY)                               AS Thang,
        COUNT(DISTINCT b.MANV)                      AS SoNHAN_VIENDiLam,
        COUNT(CASE WHEN b.DITRE = 1 THEN 1 END)    AS SoLuotDiTre,
        COUNT(b.MACC)                               AS TongLuotChamCong,
        CAST(AVG(CASE WHEN b.DITRE = 0 THEN 100.0 ELSE 0 END) AS DECIMAL(5,2)) AS TyLeDungGio
    FROM BAN_CHAM_CONG b
    GROUP BY YEAR(b.NGAY), MONTH(b.NGAY);
GO

-- 4. SP: Lay bieu do bien dong nhan su 12 thang gan nhat
CREATE OR ALTER PROCEDURE sp_analytics_turnover
AS
BEGIN
    WITH Months AS (
        SELECT TOP 12
            YEAR(DATEADD(MONTH, -ROW_NUMBER() OVER (ORDER BY object_id) + 1, GETDATE())) AS Nam,
            MONTH(DATEADD(MONTH, -ROW_NUMBER() OVER (ORDER BY object_id) + 1, GETDATE())) AS Thang
        FROM sys.objects
    )
    SELECT
        m.Nam, m.Thang,
        ISNULL(v.SoNHAN_VIENMoi, 0)  AS NHAN_VIENMoi,
        ISNULL(v.SoNHAN_VIENNghi, 0) AS NHAN_VIENNghi
    FROM Months m
    LEFT JOIN VW_BIEN_DONG_NHAN_SU v ON v.Nam = m.Nam AND v.Thang = m.Thang
    ORDER BY m.Nam ASC, m.Thang ASC;
END
GO

-- 5. SP: Lay chi phi luong theo phong ban
CREATE OR ALTER PROCEDURE sp_analytics_salary_cost
AS
BEGIN
    SELECT * FROM VW_CHI_PHI_LUONG_PHONG_BAN
    WHERE SoNHAN_VIEN > 0
    ORDER BY TongLuong DESC;
END
GO

-- 6. SP: Lay thong ke cham cong 6 thang gan nhat
CREATE OR ALTER PROCEDURE sp_analytics_attendance
AS
BEGIN
    SELECT TOP 6 * FROM VW_CHAM_CONG_TONG_HOP
    ORDER BY Nam DESC, Thang DESC;
END
GO

-- 7. SP: Tong hop analytics cho dashboard
CREATE OR ALTER PROCEDURE sp_analytics_summary
AS
BEGIN
    -- Tong so nhan vien chinh thuc vs thu viec
    SELECT
        COUNT(CASE WHEN ISNULL(TRANGTHAILAMVIEC,'') = N'Chính thức' THEN 1 END) AS ChinhThuc,
        COUNT(CASE WHEN ISNULL(TRANGTHAILAMVIEC,'') = N'Thử việc' THEN 1 END)   AS ThuViec,
        COUNT(CASE WHEN ISNULL(TRANGTHAILAMVIEC,'') NOT IN (N'Chính thức',N'Thử việc') THEN 1 END) AS Khac,
        COUNT(MANV) AS TongSo,
        CAST(AVG(CAST(ISNULL(LUONG,0) AS FLOAT)) AS DECIMAL(18,0)) AS LuongTrungBinh
    FROM NHAN_VIEN;

    -- Phan bo theo chuc vu
    SELECT CHUCVU, COUNT(MANV) AS SoLuong
    FROM NHAN_VIEN
    GROUP BY CHUCVU
    ORDER BY SoLuong DESC;

    -- Top 5 phong ban nhieu nhan vien nhat
    SELECT TOP 5 TENPB, SoNHAN_VIEN, TongLuong
    FROM VW_CHI_PHI_LUONG_PHONG_BAN
    ORDER BY SoNHAN_VIEN DESC;
END
GO
