import { appPool, connectDB } from "./config/db";
import sql from "mssql";

async function run() {
  await connectDB();
  const maDa = 23; // SEO Web A

  try {
    const transaction = new sql.Transaction(appPool);
    await transaction.begin();

    // Xóa dữ liệu cũ nếu có
    await appPool.request().input("MADA", sql.Int, maDa).query(`
      DELETE FROM NHIEM_VU_GIAI_DOAN WHERE MA_GD IN (SELECT MA_GD FROM GIAI_DOAN WHERE MA_DA = @MADA);
      DELETE FROM PHAN_CONG_GIAI_DOAN WHERE MA_GD IN (SELECT MA_GD FROM GIAI_DOAN WHERE MA_DA = @MADA);
      DELETE FROM GIAI_DOAN WHERE MA_DA = @MADA;
    `);

    // Phase 1: Nghiên cứu từ khóa & Đối thủ
    const reqPhase1 = new sql.Request(transaction);
    reqPhase1.input("MADA", sql.Int, maDa);
    reqPhase1.input("TENGD", sql.NVarChar(255), "Nghiên cứu từ khóa & Đối thủ");
    reqPhase1.input("NGAYBATDAU", sql.Date, new Date('2026-06-25'));
    reqPhase1.input("NGAYKETTHUC", sql.Date, new Date('2026-06-30'));
    reqPhase1.input("TRANGTHAI", sql.NVarChar(50), 'Hoàn thành');
    
    const p1Res = await reqPhase1.query(`
      INSERT INTO GIAI_DOAN (MA_DA, TEN_GD, NGAY_BAT_DAU, NGAY_KET_THUC, TRANG_THAI)
      OUTPUT INSERTED.MA_GD
      VALUES (@MADA, @TENGD, @NGAYBATDAU, @NGAYKETTHUC, @TRANGTHAI);
    `);
    const p1Id = p1Res.recordset[0].MA_GD;

    // Task 1
    const reqT1 = new sql.Request(transaction);
    reqT1.input("MAGD1", sql.Int, p1Id);
    reqT1.input("TENNHIEMVU1", sql.NVarChar(255), "Phân tích từ khóa ngành");
    reqT1.input("TRANGTHAI1", sql.NVarChar(50), "Hoàn thành");
    reqT1.input("NGAYKETTHUC1", sql.Date, new Date('2026-06-28'));
    await reqT1.query(`INSERT INTO NHIEM_VU_GIAI_DOAN (MA_GD, TENNHIEMVU, TRANGTHAI, NGAYKETTHUC) VALUES (@MAGD1, @TENNHIEMVU1, @TRANGTHAI1, @NGAYKETTHUC1)`);

    // Task 2
    const reqT2 = new sql.Request(transaction);
    reqT2.input("MAGD2", sql.Int, p1Id);
    reqT2.input("TENNHIEMVU2", sql.NVarChar(255), "Phân tích website đối thủ");
    reqT2.input("TRANGTHAI2", sql.NVarChar(50), "Hoàn thành");
    reqT2.input("NGAYKETTHUC2", sql.Date, new Date('2026-06-30'));
    await reqT2.query(`INSERT INTO NHIEM_VU_GIAI_DOAN (MA_GD, TENNHIEMVU, TRANGTHAI, NGAYKETTHUC) VALUES (@MAGD2, @TENNHIEMVU2, @TRANGTHAI2, @NGAYKETTHUC2)`);


    // Phase 2: Tối ưu On-page
    const reqPhase2 = new sql.Request(transaction);
    reqPhase2.input("MADA2", sql.Int, maDa);
    reqPhase2.input("TENGD2", sql.NVarChar(255), "Tối ưu On-page");
    reqPhase2.input("NGAYBATDAU2", sql.Date, new Date('2026-07-01'));
    reqPhase2.input("NGAYKETTHUC2", sql.Date, new Date('2026-07-10'));
    reqPhase2.input("TRANGTHAI2", sql.NVarChar(50), 'Đang thực hiện');
    
    const p2Res = await reqPhase2.query(`
      INSERT INTO GIAI_DOAN (MA_DA, TEN_GD, NGAY_BAT_DAU, NGAY_KET_THUC, TRANG_THAI)
      OUTPUT INSERTED.MA_GD
      VALUES (@MADA2, @TENGD2, @NGAYBATDAU2, @NGAYKETTHUC2, @TRANGTHAI2);
    `);
    const p2Id = p2Res.recordset[0].MA_GD;

    // Task 3
    const reqT3 = new sql.Request(transaction);
    reqT3.input("MAGD3", sql.Int, p2Id);
    reqT3.input("TENNHIEMVU3", sql.NVarChar(255), "Tối ưu thẻ Meta Title & Description");
    reqT3.input("TRANGTHAI3", sql.NVarChar(50), "Đang làm");
    reqT3.input("NGAYKETTHUC3", sql.Date, new Date('2026-07-05'));
    await reqT3.query(`INSERT INTO NHIEM_VU_GIAI_DOAN (MA_GD, TENNHIEMVU, TRANGTHAI, NGAYKETTHUC) VALUES (@MAGD3, @TENNHIEMVU3, @TRANGTHAI3, @NGAYKETTHUC3)`);

    // Task 4 (Quá hạn - Overdue: Today is July 1st, end date is June 30)
    const reqT4 = new sql.Request(transaction);
    reqT4.input("MAGD4", sql.Int, p2Id);
    reqT4.input("TENNHIEMVU4", sql.NVarChar(255), "Tối ưu cấu trúc H1-H6");
    reqT4.input("TRANGTHAI4", sql.NVarChar(50), "Mới"); 
    reqT4.input("NGAYKETTHUC4", sql.Date, new Date('2026-06-30'));
    await reqT4.query(`INSERT INTO NHIEM_VU_GIAI_DOAN (MA_GD, TENNHIEMVU, TRANGTHAI, NGAYKETTHUC) VALUES (@MAGD4, @TENNHIEMVU4, @TRANGTHAI4, @NGAYKETTHUC4)`);

    // Task 5
    const reqT5 = new sql.Request(transaction);
    reqT5.input("MAGD5", sql.Int, p2Id);
    reqT5.input("TENNHIEMVU5", sql.NVarChar(255), "Tối ưu tốc độ tải trang");
    reqT5.input("TRANGTHAI5", sql.NVarChar(50), "Mới");
    reqT5.input("NGAYKETTHUC5", sql.Date, new Date('2026-07-09'));
    await reqT5.query(`INSERT INTO NHIEM_VU_GIAI_DOAN (MA_GD, TENNHIEMVU, TRANGTHAI, NGAYKETTHUC) VALUES (@MAGD5, @TENNHIEMVU5, @TRANGTHAI5, @NGAYKETTHUC5)`);

    // Phase 3: Xây dựng Backlink (Off-page)
    const reqPhase3 = new sql.Request(transaction);
    reqPhase3.input("MADA3", sql.Int, maDa);
    reqPhase3.input("TENGD3", sql.NVarChar(255), "Xây dựng Backlink (Off-page)");
    reqPhase3.input("NGAYBATDAU3", sql.Date, new Date('2026-07-11'));
    reqPhase3.input("NGAYKETTHUC3", sql.Date, new Date('2026-07-20'));
    reqPhase3.input("TRANGTHAI3", sql.NVarChar(50), 'Chưa bắt đầu');
    
    const p3Res = await reqPhase3.query(`
      INSERT INTO GIAI_DOAN (MA_DA, TEN_GD, NGAY_BAT_DAU, NGAY_KET_THUC, TRANG_THAI)
      OUTPUT INSERTED.MA_GD
      VALUES (@MADA3, @TENGD3, @NGAYBATDAU3, @NGAYKETTHUC3, @TRANGTHAI3);
    `);
    const p3Id = p3Res.recordset[0].MA_GD;

    // Task 6
    const reqT6 = new sql.Request(transaction);
    reqT6.input("MAGD6", sql.Int, p3Id);
    reqT6.input("TENNHIEMVU6", sql.NVarChar(255), "Mua Guest Post báo điện tử");
    reqT6.input("TRANGTHAI6", sql.NVarChar(50), "Mới");
    reqT6.input("NGAYKETTHUC6", sql.Date, new Date('2026-07-15'));
    await reqT6.query(`INSERT INTO NHIEM_VU_GIAI_DOAN (MA_GD, TENNHIEMVU, TRANGTHAI, NGAYKETTHUC) VALUES (@MAGD6, @TENNHIEMVU6, @TRANGTHAI6, @NGAYKETTHUC6)`);

    await transaction.commit();
    console.log("Seeding successful!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}
run();
