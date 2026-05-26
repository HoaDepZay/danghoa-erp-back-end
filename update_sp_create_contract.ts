import { connectDB, appPool } from './config/db';

async function run() {
  await connectDB();
  
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
        DECLARE @SoHopDong VARCHAR(50);
        -- Generate SoHopDong format HD-{MANV}-{Random 3 digits}
        SET @SoHopDong = 'HD-' + @MaNV + '-' + CAST(CAST(RAND() * 900 + 100 AS INT) AS VARCHAR);

        IF @LoaiHopDong != N'Thử việc'
        BEGIN
            UPDATE HOP_DONG_LAO_DONG
            SET TrangThai = N'Hết hiệu lực'
            WHERE MaNV = @MaNV AND ISNULL(TrangThai, N'Hiệu lực') = N'Hiệu lực';
        END

        INSERT INTO HOP_DONG_LAO_DONG (SoHopDong, MaNV, LoaiHopDong, NgayKy, NgayHetHan, MucLuongCoBan, TrangThai)
        VALUES (@SoHopDong, @MaNV, @LoaiHopDong, ISNULL(@TuNgay, GETDATE()), @DenNgay, @LuongCoBan, @TrangThai);

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
