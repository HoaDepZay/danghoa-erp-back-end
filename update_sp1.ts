import { connectDB, appPool } from './config/db';

async function run() {
  await connectDB();
  await appPool.request().query(`
    ALTER PROCEDURE sp_getExpiringContracts
        @SoNgay INT = 30
    AS
    BEGIN
        SELECT hd.SoHopDong AS MAHD, hd.MaNV, hd.LoaiHopDong AS LOAIHOPDONG, 
               hd.NgayKy AS TUNGAY, hd.NgayHetHan AS DENNGAY,
               nv.HOTEN as TenNhanVien, nv.EMAIL, nv.MAPHG, pb.TENPB,
               DATEDIFF(day, GETDATE(), hd.NgayHetHan) AS SoNgayConLai
        FROM HOP_DONG_LAO_DONG hd
        JOIN NHAN_VIEN nv ON hd.MaNV = nv.MANV
        LEFT JOIN PHONG_BAN pb ON nv.MAPHG = pb.MAPHG
        WHERE hd.NgayHetHan IS NOT NULL
          AND ISNULL(hd.TrangThai, N'Hiệu lực') = N'Hiệu lực'
          AND DATEDIFF(day, GETDATE(), hd.NgayHetHan) BETWEEN 0 AND @SoNgay
        ORDER BY SoNgayConLai ASC;
    END
  `);
  console.log("Done");
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
