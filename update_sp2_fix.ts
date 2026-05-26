import { connectDB, appPool } from './config/db';

async function run() {
  await connectDB();
  await appPool.request().query(`
    ALTER PROCEDURE sp_analytics_salary_cost
    AS
    BEGIN
        DECLARE @Thang INT = MONTH(GETDATE());
        DECLARE @Nam INT = YEAR(GETDATE());
        
        -- Tính chi phí lương cho tháng hiện tại dựa trên BANG_LUONG (nếu đã chốt lương) 
        -- hoặc lương cơ bản nếu chưa có
        SELECT 
            pb.MAPHG,
            pb.TENPB,
            COUNT(nv.MANV) AS SoNhanVien,
            ISNULL(SUM(CAST(ISNULL(bl.THUCLANH, nv.LUONG) AS FLOAT)), 0) AS TongLuong,
            ISNULL(AVG(CAST(ISNULL(bl.THUCLANH, nv.LUONG) AS FLOAT)), 0) AS LuongTrungBinh,
            ISNULL(MAX(CAST(ISNULL(bl.THUCLANH, nv.LUONG) AS FLOAT)), 0) AS LuongCaoNhat,
            ISNULL(MIN(CAST(ISNULL(bl.THUCLANH, nv.LUONG) AS FLOAT)), 0) AS LuongThapNhat
        FROM PHONG_BAN pb
        LEFT JOIN NHAN_VIEN nv ON pb.MAPHG = nv.MAPHG
        LEFT JOIN BANG_LUONG bl ON nv.MANV = bl.MANV AND bl.THANG = @Thang AND bl.NAM = @Nam
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
