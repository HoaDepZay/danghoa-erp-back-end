import { connectDB, appPool } from './config/db';

async function run() {
  await connectDB();
  
  // sp_getContracts
  await appPool.request().query(`
    ALTER PROCEDURE sp_getContracts
        @MaNV VARCHAR(20) = NULL
    AS
    BEGIN
        SELECT hd.SoHopDong AS MAHD, hd.MaNV AS MANV, hd.LoaiHopDong AS LOAIHOPDONG, 
               hd.NgayKy AS TUNGAY, hd.NgayHetHan AS DENNGAY, 
               nv.HOTEN as TenNhanVien, nv.MAPHG,
               DATEDIFF(day, GETDATE(), hd.NgayHetHan) AS SoNgayConLai
        FROM HOP_DONG_LAO_DONG hd
        JOIN NHAN_VIEN nv ON hd.MaNV = nv.MANV
        WHERE (@MaNV IS NULL OR hd.MaNV = @MaNV)
        ORDER BY hd.NgayKy DESC;
    END
  `);

  // sp_createContract
  await appPool.request().query(`
    ALTER PROCEDURE sp_createContract
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
        IF @LoaiHopDong != N'Thử việc'
        BEGIN
            UPDATE HOP_DONG_LAO_DONG
            SET TrangThai = N'Hết hiệu lực'
            WHERE MaNV = @MaNV AND ISNULL(TrangThai, N'Hiệu lực') = N'Hiệu lực';
        END

        INSERT INTO HOP_DONG_LAO_DONG (MaNV, LoaiHopDong, NgayKy, NgayHetHan, MucLuongCoBan, TrangThai)
        VALUES (@MaNV, @LoaiHopDong, ISNULL(@TuNgay, GETDATE()), @DenNgay, @LuongCoBan, @TrangThai);

        UPDATE NHAN_VIEN SET LUONG = @LuongCoBan WHERE MANV = @MaNV;
    END
  `);

  console.log("Done");
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
