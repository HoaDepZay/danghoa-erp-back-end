import { appPool, connectDB, sql } from "./config/db";

// Lấy tham số từ dòng lệnh: npx ts-node seed_attendance.ts [month] [year] [manv]
const args = process.argv.slice(2);
const targetMonth = args[0] ? parseInt(args[0]) : new Date().getMonth() + 1;
const targetYear = args[1] ? parseInt(args[1]) : new Date().getFullYear();
const targetManv = args[2] || null; // Nếu null sẽ seed cho toàn bộ nhân viên

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month, 0).getDate();
};

const run = async () => {
  try {
    await connectDB();
    console.log(`\n🌱 BẮT ĐẦU MOCK DỮ LIỆU CHẤM CÔNG CHO THÁNG ${targetMonth}/${targetYear} 🌱`);

    // 1. Lấy danh sách nhân viên cần seed
    let employees: string[] = [];
    if (targetManv) {
      // Kiểm tra nhân viên tồn tại
      const checkEmp = await appPool.request()
        .input("MaNV", sql.VarChar(20), targetManv)
        .query("SELECT MANV FROM NHAN_VIEN WHERE MANV = @MaNV");
      if (checkEmp.recordset.length === 0) {
        console.error(`❌ Nhân viên ${targetManv} không tồn tại trong hệ thống!`);
        process.exit(1);
      }
      employees.push(targetManv);
    } else {
      // Lấy toàn bộ nhân viên
      const allEmps = await appPool.request().query("SELECT MANV FROM NHAN_VIEN");
      employees = allEmps.recordset.map((e: any) => e.MANV);
    }

    if (employees.length === 0) {
      console.log("⚠️ Không có nhân viên nào trong hệ thống để seed dữ liệu.");
      process.exit(0);
    }

    console.log(`👥 Số lượng nhân sự sẽ được seed dữ liệu: ${employees.length}`);
    const totalDays = getDaysInMonth(targetMonth, targetYear);
    console.log(`📅 Tổng số ngày trong tháng cần quét: ${totalDays} ngày`);

    let seedCount = 0;

    for (const manv of employees) {
      console.log(`\n⚙️ Đang sinh dữ liệu cho nhân viên: ${manv}...`);

      // Xóa sạch dữ liệu chấm công cũ của tháng/năm này để tránh trùng lặp
      await appPool.request()
        .input("MaNV", sql.VarChar(20), manv)
        .input("Thang", sql.Int, targetMonth)
        .input("Nam", sql.Int, targetYear)
        .query("DELETE FROM BAN_CHAM_CONG WHERE MANV = @MaNV AND MONTH(NGAY) = @Thang AND YEAR(NGAY) = @Nam");

      for (let day = 1; day <= totalDays; day++) {
        const currentDate = new Date(targetYear, targetMonth - 1, day);
        const dayOfWeek = currentDate.getDay();

        // Bỏ qua ngày Chủ Nhật (0) để giống thực tế
        if (dayOfWeek === 0) continue;

        // Tạo kịch bản chấm công ngẫu nhiên
        const rand = Math.random();
        let hourVao: number;
        let minuteVao: number;
        let hourRa: number;
        let minuteRa: number;
        let trangThai = 'Đã Check-in';
        let endTrangThai = 'Hoàn thành';

        if (rand < 0.60) {
          // 1. Đi làm đúng giờ chuẩn (60% cơ hội)
          hourVao = 8;
          minuteVao = Math.floor(Math.random() * 25); // 08:00 - 08:24
          hourRa = 18;
          minuteRa = Math.floor(Math.random() * 30); // 18:00 - 18:29
        } else if (rand < 0.75) {
          // 2. Đi trễ và làm bù đủ giờ (15% cơ hội)
          const trgMinute = 5 + Math.floor(Math.random() * 15); // trễ 5-20 phút
          hourVao = 8;
          minuteVao = 30 + trgMinute; // 08:35 - 08:50
          hourRa = 18;
          minuteRa = 45 + Math.floor(Math.random() * 30); // 18:45 - 19:14 (bù dư giờ)
        } else if (rand < 0.85) {
          // 3. Đi trễ và không bù đủ giờ -> Bị phạt (10% cơ hội)
          const trgMinute = 10 + Math.floor(Math.random() * 15); // trễ 10-25 phút
          hourVao = 8;
          minuteVao = 30 + trgMinute; // 08:40 - 08:55
          hourRa = 18;
          minuteRa = 5 + Math.floor(Math.random() * 10); // 18:05 - 18:14 (thiếu giờ)
        } else if (rand < 0.92) {
          // 4. Tăng ca (7% cơ hội)
          hourVao = 8;
          minuteVao = Math.floor(Math.random() * 20); // 08:00 - 08:19
          hourRa = 20;
          minuteRa = 30 + Math.floor(Math.random() * 30); // 20:30 - 20:59
          endTrangThai = 'Tăng ca';
        } else {
          // 5. Làm nửa ngày ca sáng (8% cơ hội)
          hourVao = 8;
          minuteVao = Math.floor(Math.random() * 25); // 08:00 - 08:24
          hourRa = 12;
          minuteRa = 5 + Math.floor(Math.random() * 20); // 12:05 - 12:24
        }

        // Tạo các đối tượng Date cho Ngày, Giờ Vào, Giờ Ra
        const dateObj = new Date(targetYear, targetMonth - 1, day);
        const gioVaoDate = new Date(1970, 0, 1, hourVao, minuteVao, 0);
        const gioRaDate = new Date(1970, 0, 1, hourRa, minuteRa, 0);

        // --- MÔ PHỎNG LUỒNG CHECK-IN / CHECK-OUT THỰC TẾ ---
        // 1. Thực hiện INSERT (Check-in)
        await appPool.request()
          .input("MaNV", sql.VarChar(20), manv)
          .input("Ngay", sql.Date, dateObj)
          .input("GioVao", sql.Time, gioVaoDate)
          .input("TrangThai", sql.NVarChar(50), trangThai)
          .query("INSERT INTO BAN_CHAM_CONG (MANV, NGAY, GIOVAO, TRANGTHAI) VALUES (@MaNV, @Ngay, @GioVao, @TrangThai)");

        // 2. Thực hiện UPDATE (Check-out) để kích hoạt Trigger tính toán
        await appPool.request()
          .input("MaNV", sql.VarChar(20), manv)
          .input("Ngay", sql.Date, dateObj)
          .input("GioRa", sql.Time, gioRaDate)
          .input("TrangThai", sql.NVarChar(50), endTrangThai)
          .query("UPDATE BAN_CHAM_CONG SET GIORA = @GioRa, TRANGTHAI = @TrangThai WHERE MANV = @MaNV AND NGAY = @Ngay");

        seedCount++;
      }
    }

    console.log(`\n✅ HOÀN THÀNH SEED DỮ LIỆU!`);
    console.log(`🎉 Đã tạo thành công ${seedCount} ngày công chấm công giả lập cho ${employees.length} nhân viên.`);
    console.log(`💡 Bây giờ bạn có thể mở tab Bảng lương để xem kết quả tính lương của tháng ${targetMonth}/${targetYear}!`);
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Lỗi trong quá trình Seed dữ liệu:", err.message);
    process.exit(1);
  }
};

run();
