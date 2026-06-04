const sql = require('mssql');

const config = {
  user: 'sa',
  password: '31052006Hoa*',
  server: '100.69.220.17',
  database: 'QuanTriNhanSu',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function executeArchitectureUpdate() {
  try {
    await sql.connect(config);
    console.log('Connected to SQL Server. Applying Thick-Database Architecture...');

    // 1. Tạo Function tính lương
    console.log('1. Creating fn_TinhThucLanh...');
    await sql.query(`
      CREATE OR ALTER FUNCTION fn_TinhThucLanh(
          @LuongCoBan DECIMAL(18,2),
          @PhuCap DECIMAL(18,2),
          @Thuong DECIMAL(18,2),
          @KhauTruBHXH DECIMAL(18,2)
      )
      RETURNS DECIMAL(18,2)
      AS
      BEGIN
          RETURN ISNULL(@LuongCoBan, 0) + ISNULL(@PhuCap, 0) + ISNULL(@Thuong, 0) - ISNULL(@KhauTruBHXH, 0);
      END
    `);

    // 2. Tạo Trigger cho Chấm Công
    console.log('2. Creating trg_SauChamCong...');
    await sql.query(`
      CREATE OR ALTER TRIGGER trg_SauChamCong
      ON BAN_CHAM_CONG
      AFTER UPDATE
      AS
      BEGIN
          SET NOCOUNT ON;
          
          -- Khi nhân viên CheckOut (Cập nhật GioRa), trigger sẽ tự tính TrangThai
          IF UPDATE(GioRa)
          BEGIN
              UPDATE t
              SET t.TrangThai = 
                  CASE 
                      WHEN DATEDIFF(MINUTE, i.GioVao, i.GioRa) >= 480 THEN N'Đủ giờ (>=8 tiếng)'
                      WHEN DATEDIFF(MINUTE, i.GioVao, i.GioRa) >= 240 THEN N'Nửa ngày (>=4 tiếng)'
                      ELSE N'Thiếu giờ'
                  END
              FROM BAN_CHAM_CONG t
              INNER JOIN inserted i ON t.MaCC = i.MaCC
              WHERE i.GioRa IS NOT NULL;
          END
      END
    `);

    // 3. Sửa sp_ThucThiTinhLuong để gọi Function
    console.log('3. Updating sp_ThucThiTinhLuong to use Function...');
    await sql.query(`
      CREATE OR ALTER PROCEDURE sp_ThucThiTinhLuong
          @THANG INT,
          @NAM INT
      AS
      BEGIN
          SET NOCOUNT ON;
          
          -- Xóa dữ liệu cũ nếu chạy lại
          DELETE FROM BANG_LUONG WHERE THANG = @THANG AND NAM = @NAM;

          -- Lấy danh sách nhân viên và tính lương, GỌI HÀM fn_TinhThucLanh
          INSERT INTO BANG_LUONG (MANV, THANG, NAM, LuongCoBan, PhuCap, Thuong, KhauTruBHXH, ThucLanh)
          SELECT 
              NV.MANV, 
              @THANG, 
              @NAM, 
              ISNULL(NV.LUONG, 0),
              ISNULL(CD.PhuCapChucVu, 0),
              0 AS THUONG, -- Cần logic phức tạp hơn lấy từ đánh giá
              ISNULL(NV.LUONG, 0) * 0.105 AS BHXH, -- Ví dụ đóng BHXH 10.5%
              dbo.fn_TinhThucLanh(
                  ISNULL(NV.LUONG, 0), 
                  ISNULL(CD.PhuCapChucVu, 0), 
                  0, 
                  ISNULL(NV.LUONG, 0) * 0.105
              ) AS THUCLANH
          FROM NHAN_VIEN NV
          LEFT JOIN CHUCDANH CD ON NV.MaChucDanh = CD.MaChucDanh
          WHERE NV.TrangThaiLamViec = N'Chính thức';
          
          SELECT 1 AS Success, N'Tính lương thành công bằng Function' AS Message;
      END
    `);

    // 4. Kiểm tra sp_CheckOut để làm nhẹ code (Giao việc tính TrangThai cho Trigger)
    console.log('4. Simplifying sp_CheckOut (Logic moved to Trigger)...');
    await sql.query(`
      CREATE OR ALTER PROCEDURE sp_CheckOut
          @MaNV VARCHAR(20)
      AS
      BEGIN
          SET NOCOUNT ON;
          DECLARE @Result INT = 0;
          DECLARE @ErrorDetail NVARCHAR(500) = '';
          DECLARE @Today DATE = CAST(GETDATE() AS DATE);
          
          IF NOT EXISTS (SELECT 1 FROM BAN_CHAM_CONG WHERE MANV = @MaNV AND NGAY = @Today)
          BEGIN
              SET @Result = 0;
              SET @ErrorDetail = N'Bạn chưa check-in hôm nay!';
          END
          ELSE IF EXISTS (SELECT 1 FROM BAN_CHAM_CONG WHERE MANV = @MaNV AND NGAY = @Today AND GIORA IS NOT NULL)
          BEGIN
              SET @Result = 0;
              SET @ErrorDetail = N'Bạn đã check-out ngày hôm nay rồi!';
          END
          ELSE
          BEGIN
              -- Chỉ cập nhật GioRa, phần TrangThai sẽ do Trigger trg_SauChamCong tự lo
              UPDATE BAN_CHAM_CONG 
              SET GIORA = CAST(GETDATE() AS TIME)
              WHERE MANV = @MaNV AND NGAY = @Today;
              
              SET @Result = 1;
              SET @ErrorDetail = N'Check-out thành công. Trigger đã ghi nhận giờ làm.';
          END
          SELECT @Result AS Result, @ErrorDetail AS ErrorDetail;
      END
    `);

    console.log('All DB architecture patterns applied successfully!');

  } catch (err) {
    console.error('Failed:', err);
  } finally {
    sql.close();
  }
}

executeArchitectureUpdate();
