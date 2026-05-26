import { connectDB, appPool } from './config/db';

async function run() {
  await connectDB();
  await appPool.request().query(`
    ALTER PROCEDURE sp_analytics_salary_cost
    AS
    BEGIN
        DECLARE @Thang INT = MONTH(GETDATE());
        DECLARE @Nam INT = YEAR(GETDATE());
        
        -- Tính chi phí lương cho tháng hiện tại
        SELECT 
            pb.MAPHG,
            pb.TENPB,
            COUNT(nv.MANV) AS SoNhanVien,
            ISNULL(SUM(dbo.fn_tinhLuongNhanVien(nv.MANV, @Thang, @Nam)), 0) AS TongLuong,
            ISNULL(AVG(dbo.fn_tinhLuongNhanVien(nv.MANV, @Thang, @Nam)), 0) AS LuongTrungBinh,
            ISNULL(MAX(dbo.fn_tinhLuongNhanVien(nv.MANV, @Thang, @Nam)), 0) AS LuongCaoNhat,
            ISNULL(MIN(dbo.fn_tinhLuongNhanVien(nv.MANV, @Thang, @Nam)), 0) AS LuongThapNhat
        FROM PHONG_BAN pb
        LEFT JOIN NHAN_VIEN nv ON pb.MAPHG = nv.MAPHG
        GROUP BY pb.MAPHG, pb.TENPB
        HAVING COUNT(nv.MANV) > 0
        ORDER BY TongLuong DESC;
    END
  `);
  console.log("Done");
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
