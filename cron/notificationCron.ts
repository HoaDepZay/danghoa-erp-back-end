import cron from "node-cron";
import { appPool } from "../config/db";
import { createNotification } from "../controllers/notificationController";
import { emitNotification } from "../server";

export const initCronJobs = () => {
  // Chạy lúc 08:00 mỗi ngày
  cron.schedule("0 8 * * *", async () => {
    try {
      console.log("Cron: Checking nearing expirations (<= 2 days)...");
      
      // 1. Projects expiring in <= 2 days
      const projects = await appPool.request().query(`
        SELECT p.MADA, p.TENDA, p.NGAYKETTHUC, pc.MANV
        FROM DU_AN p
        JOIN PHAN_CONG_DU_AN pc ON p.MADA = pc.MADA
        WHERE p.TRANGTHAI != N'Hoàn thành'
          AND p.NGAYKETTHUC IS NOT NULL
          AND DATEDIFF(day, GETDATE(), p.NGAYKETTHUC) BETWEEN 0 AND 2
      `);
      
      for (const row of projects.recordset) {
        // Tránh spam nhiều thông báo cùng 1 ngày
        const check = await appPool.request()
          .input("MaNV", row.MANV)
          .input("Link", `/projects/${row.MADA}`)
          .query(`
            SELECT 1 FROM THONG_BAO 
            WHERE MaNV = @MaNV 
              AND Loai = 'project_deadline' 
              AND Link = @Link
              AND CAST(NgayTao as DATE) = CAST(GETDATE() as DATE)
          `);
          
        if (check.recordset.length === 0) {
          const daysLeft = Math.ceil((new Date(row.NGAYKETTHUC).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          const notif = await createNotification(
            row.MANV,
            `Dự án "${row.TENDA}" sắp đến hạn`,
            `Dự án của bạn sẽ hết hạn trong ${daysLeft} ngày nữa. Vui lòng kiểm tra tiến độ!`,
            "project_deadline",
            `/projects/${row.MADA}`
          );
          if (notif) emitNotification(row.MANV, notif);
        }
      }

      // 2. Tasks expiring in <= 2 days
      const tasks = await appPool.request().query(`
        SELECT MANVDA as MANHIEMVU, TENNHIEMVU, MADA, MANV, NGAYKETTHUC
        FROM NHIEM_VU
        WHERE TRANGTHAI != N'Hoàn thành'
          AND NGAYKETTHUC IS NOT NULL
          AND DATEDIFF(day, GETDATE(), NGAYKETTHUC) BETWEEN 0 AND 2
      `);
      
      for (const row of tasks.recordset) {
        if (!row.MANV) continue;
        const check = await appPool.request()
          .input("MaNV", row.MANV)
          .input("Link", `/projects/${row.MADA}`)
          .query(`
            SELECT 1 FROM THONG_BAO 
            WHERE MaNV = @MaNV 
              AND Loai = 'task_deadline' 
              AND Link = @Link
              AND CAST(NgayTao as DATE) = CAST(GETDATE() as DATE)
          `);
          
        if (check.recordset.length === 0) {
          const daysLeft = Math.ceil((new Date(row.NGAYKETTHUC).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          const notif = await createNotification(
            row.MANV,
            `Nhiệm vụ "${row.TENNHIEMVU}" sắp đến hạn`,
            `Nhiệm vụ của bạn trong dự án sẽ hết hạn trong ${daysLeft} ngày nữa.`,
            "task_deadline",
            `/projects/${row.MADA}`
          );
          if (notif) emitNotification(row.MANV, notif);
        }
      }
    } catch (e) {
      console.error("Cron error:", e);
    }
  });
};
