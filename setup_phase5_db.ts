import { connectDB, appPool } from "./config/db";

async function run() {
  await connectDB();
  
  try {
    // 1. Drop HOP_DONG table
    console.log("Dropping HOP_DONG...");
    await appPool.request().query(`
      IF OBJECT_ID('dbo.HOP_DONG', 'U') IS NOT NULL 
      BEGIN
        DROP TABLE HOP_DONG;
      END
    `);
    
    // 2. Drop MACHUCDANH from NHAN_VIEN
    console.log("Dropping MACHUCDANH from NHAN_VIEN...");
    try {
      await appPool.request().query(`
        IF EXISTS(SELECT 1 FROM sys.columns WHERE Name = N'MACHUCDANH' AND Object_ID = Object_ID(N'NHAN_VIEN'))
        BEGIN
          DECLARE @ConstraintName nvarchar(200)
          SELECT @ConstraintName = Name FROM sys.default_constraints WHERE parent_object_id = object_id(N'NHAN_VIEN') AND parent_column_id = columnproperty(object_id(N'NHAN_VIEN'), N'MACHUCDANH', 'ColumnId')
          IF @ConstraintName IS NOT NULL
            EXEC('ALTER TABLE NHAN_VIEN DROP CONSTRAINT ' + @ConstraintName)
          
          SELECT @ConstraintName = name FROM sys.foreign_keys WHERE parent_object_id = object_id(N'NHAN_VIEN') AND parent_column_id = columnproperty(object_id(N'NHAN_VIEN'), N'MACHUCDANH', 'ColumnId')
          IF @ConstraintName IS NOT NULL
            EXEC('ALTER TABLE NHAN_VIEN DROP CONSTRAINT ' + @ConstraintName)

          ALTER TABLE NHAN_VIEN DROP COLUMN MACHUCDANH
        END
      `);
    } catch (e) {
      console.log("Error dropping MACHUCDANH:", e.message);
    }

    // 3. Create THONG_BAO table
    console.log("Creating THONG_BAO...");
    await appPool.request().query(`
      IF OBJECT_ID('dbo.THONG_BAO', 'U') IS NULL 
      BEGIN
        CREATE TABLE THONG_BAO (
          MaTB INT IDENTITY(1,1) PRIMARY KEY,
          MaNV VARCHAR(20) FOREIGN KEY REFERENCES NHAN_VIEN(MANV),
          TieuDe NVARCHAR(255) NOT NULL,
          NoiDung NVARCHAR(MAX) NOT NULL,
          Loai NVARCHAR(50),
          DaDoc BIT DEFAULT 0,
          NgayTao DATETIME DEFAULT GETDATE(),
          Link NVARCHAR(255)
        );
      END
    `);

    // 4. Update LOAI_NGHI_PHEP & DON_NGHI_PHEP
    console.log("Updating LOAI_NGHI_PHEP & DON_NGHI_PHEP...");
    await appPool.request().query(`
      -- Seed LOAI_NGHI_PHEP
      IF NOT EXISTS (SELECT 1 FROM LOAI_NGHI_PHEP WHERE MALOAINGHI = 1)
        INSERT INTO LOAI_NGHI_PHEP (MALOAINGHI, TENLOAINGHI) VALUES (1, N'Nghỉ ốm/Bệnh');
      IF NOT EXISTS (SELECT 1 FROM LOAI_NGHI_PHEP WHERE MALOAINGHI = 2)
        INSERT INTO LOAI_NGHI_PHEP (MALOAINGHI, TENLOAINGHI) VALUES (2, N'Nhà có tang');
      IF NOT EXISTS (SELECT 1 FROM LOAI_NGHI_PHEP WHERE MALOAINGHI = 3)
        INSERT INTO LOAI_NGHI_PHEP (MALOAINGHI, TENLOAINGHI) VALUES (3, N'Nhà có tiệc cưới');
      IF NOT EXISTS (SELECT 1 FROM LOAI_NGHI_PHEP WHERE MALOAINGHI = 4)
        INSERT INTO LOAI_NGHI_PHEP (MALOAINGHI, TENLOAINGHI) VALUES (4, N'Nghỉ phép năm');
      IF NOT EXISTS (SELECT 1 FROM LOAI_NGHI_PHEP WHERE MALOAINGHI = 5)
        INSERT INTO LOAI_NGHI_PHEP (MALOAINGHI, TENLOAINGHI) VALUES (5, N'Khác');
    `);
    
    await appPool.request().query(`
      -- Add MALOAINGHI to DON_NGHI_PHEP if not exists
      IF COL_LENGTH('DON_NGHI_PHEP', 'MALOAINGHI') IS NULL
      BEGIN
        ALTER TABLE DON_NGHI_PHEP ADD MALOAINGHI INT;
        ALTER TABLE DON_NGHI_PHEP ADD CONSTRAINT FK_DONNGHIPHEP_LOAI FOREIGN KEY (MALOAINGHI) REFERENCES LOAI_NGHI_PHEP(MALOAINGHI);
      END
    `);
    
    await appPool.request().query(`
      UPDATE DON_NGHI_PHEP SET MALOAINGHI = (SELECT TOP 1 MALOAINGHI FROM LOAI_NGHI_PHEP WHERE TENLOAINGHI = N'Khác') WHERE MALOAINGHI IS NULL;
    `);

    // 5. Seed Employee PHUCAP, PHIBHXH, SoNguoiPhuThuoc and ensure HOP_DONG_LAO_DONG
    console.log("Seeding Employee data...");
    await appPool.request().query(`
      UPDATE NHAN_VIEN 
      SET 
        PHUCAP = (ABS(CHECKSUM(NEWID())) % 20 + 5) * 100000, -- 500k to 2.5m
        PHIBHXH = (LUONG * 10.5 / 100),
        SoNguoiPhuThuoc = (ABS(CHECKSUM(NEWID())) % 4) -- 0 to 3
      WHERE ISVERIFIED = 1;

      -- Ensure exactly 1 contract per verified employee in HOP_DONG_LAO_DONG
      INSERT INTO HOP_DONG_LAO_DONG (SoHopDong, MaNV, LoaiHopDong, NgayKy, NgayHetHan, MucLuongCoBan, TrangThai)
      SELECT 
        'HD-' + MANV + '-' + FORMAT(GETDATE(), 'yyyyMMdd'),
        MANV,
        N'Không xác định thời hạn',
        GETDATE(),
        NULL,
        LUONG,
        N'Hiệu lực'
      FROM NHAN_VIEN
      WHERE ISVERIFIED = 1 AND MANV NOT IN (SELECT MaNV FROM HOP_DONG_LAO_DONG);
    `);
    
    // Procedure to fetch notifications
    console.log("Creating Notification Stored Procs...");
    await appPool.request().query(`
      CREATE OR ALTER PROCEDURE sp_getNotifications
        @MaNV VARCHAR(20)
      AS
      BEGIN
        SELECT TOP 50 * FROM THONG_BAO 
        WHERE MaNV = @MaNV 
        ORDER BY NgayTao DESC;
      END
    `);

    await appPool.request().query(`
      CREATE OR ALTER PROCEDURE sp_markNotificationRead
        @MaTB INT,
        @MaNV VARCHAR(20)
      AS
      BEGIN
        UPDATE THONG_BAO 
        SET DaDoc = 1 
        WHERE MaTB = @MaTB AND MaNV = @MaNV;
        
        SELECT * FROM THONG_BAO WHERE MaTB = @MaTB;
      END
    `);

    await appPool.request().query(`
      CREATE OR ALTER PROCEDURE sp_createNotification
        @MaNV VARCHAR(20),
        @TieuDe NVARCHAR(255),
        @NoiDung NVARCHAR(MAX),
        @Loai NVARCHAR(50),
        @Link NVARCHAR(255) = NULL
      AS
      BEGIN
        INSERT INTO THONG_BAO (MaNV, TieuDe, NoiDung, Loai, Link)
        OUTPUT INSERTED.*
        VALUES (@MaNV, @TieuDe, @NoiDung, @Loai, @Link);
      END
    `);

    console.log("Database Phase 5 Setup Complete!");
  } catch (err) {
    console.error("Setup Error:", err);
  }
  process.exit(0);
}

run();
