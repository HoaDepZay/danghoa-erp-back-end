import { connectDB, appPool } from './config/db';

async function run() {
  await connectDB();
  
  await appPool.request().query(`
    ALTER PROCEDURE sp_getContracts
        @MaNV VARCHAR(20) = NULL
    AS
    BEGIN
        SELECT hd.SoHopDong AS MAHD, hd.MaNV AS MANV, hd.LoaiHopDong AS LOAIHOPDONG, 
               hd.NgayKy AS TUNGAY, hd.NgayHetHan AS DENNGAY, 
               nv.HOTEN as TenNhanVien, pb.TENPB,
               DATEDIFF(day, GETDATE(), hd.NgayHetHan) AS SoNgayConLai
        FROM HOP_DONG_LAO_DONG hd
        JOIN NHAN_VIEN nv ON hd.MaNV = nv.MANV
        LEFT JOIN PHONG_BAN pb ON nv.MAPHG = pb.MAPHG
        WHERE (@MaNV IS NULL OR hd.MaNV = @MaNV)
        ORDER BY hd.NgayKy DESC;
    END
  `);

  console.log("Done");
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
