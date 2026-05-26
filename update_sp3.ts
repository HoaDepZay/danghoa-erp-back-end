import { connectDB, appPool } from './config/db';

async function run() {
  await connectDB();
  await appPool.request().query(`
    ALTER PROCEDURE sp_approveLeave
        @MaDon INT,
        @NguoiDuyet VARCHAR(20),
        @CapDuyet INT, -- Giữ nguyên tham số để tránh lỗi API cũ
        @TrangThai NVARCHAR(50), -- N'Đã duyệt', N'Từ chối'
        @LyDoTuChoi NVARCHAR(500) = NULL
    AS
    BEGIN
        UPDATE DON_NGHI_PHEP
        SET TRANGTHAIDUYET = @TrangThai,
            LyDoTuChoi = @LyDoTuChoi,
            NGUOIDUYET = @NguoiDuyet
        WHERE MADON = @MaDon;
    END
  `);
  console.log("Done");
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
