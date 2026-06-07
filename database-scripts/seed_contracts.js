const sql = require("mssql");
const { connectDB, appPool } = require("./config/db");

async function seedContracts() {
  try {
    await connectDB();
    
    // Tạo bảng HOP_DONG_LAO_DONG nếu chưa có
    await appPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[HOP_DONG_LAO_DONG]') AND type in (N'U'))
      BEGIN
        CREATE TABLE [dbo].[HOP_DONG_LAO_DONG](
            [SoHopDong] [varchar](50) NOT NULL,
            [MaNV] [varchar](20) NOT NULL,
            [LoaiHopDong] [nvarchar](100) NULL,
            [NgayKy] [date] NULL,
            [NgayHetHan] [date] NULL,
            [MucLuongCoBan] [int] NULL,
            [TrangThai] [nvarchar](50) NULL,
          CONSTRAINT [PK_HOP_DONG_LAO_DONG] PRIMARY KEY CLUSTERED ([SoHopDong] ASC)
        )
      END
    `);

    // Xóa dữ liệu cũ
    await appPool.request().query(`DELETE FROM HOP_DONG_LAO_DONG`);

    // Lấy danh sách nhân viên
    const empRes = await appPool.request().query(`SELECT MANV FROM NHAN_VIEN`);
    const employees = empRes.recordset;

    let count = 0;
    for (const emp of employees) {
      const soHD = "HD-" + emp.MANV + "-" + Math.floor(Math.random() * 1000);
      const loaiHD = Math.random() > 0.5 ? 'Không xác định thời hạn' : 'Có thời hạn 1 năm';
      const luongCB = 10000000 + Math.floor(Math.random() * 10) * 1000000;
      
      await appPool.request()
        .input('SoHopDong', sql.VarChar, soHD)
        .input('MaNV', sql.VarChar, emp.MANV)
        .input('LoaiHopDong', sql.NVarChar, loaiHD)
        .input('NgayKy', sql.Date, '2025-01-01')
        .input('NgayHetHan', sql.Date, loaiHD.includes('Không') ? '2099-12-31' : '2026-01-01')
        .input('MucLuong', sql.Int, luongCB)
        .input('TrangThai', sql.NVarChar, 'Hiệu lực')
        .query(`
          INSERT INTO HOP_DONG_LAO_DONG (SoHopDong, MaNV, LoaiHopDong, NgayKy, NgayHetHan, MucLuongCoBan, TrangThai)
          VALUES (@SoHopDong, @MaNV, @LoaiHopDong, @NgayKy, @NgayHetHan, @MucLuong, @TrangThai)
        `);
      count++;
    }

    console.log(`Đã tạo thành công ${count} hợp đồng!`);
    process.exit(0);
  } catch (error) {
    console.error("Lỗi:", error);
    process.exit(1);
  }
}

seedContracts();
