import cron from "node-cron";
import { appPool } from "../config/db";
import { emitNotification } from "../server";

export const initCronJobs = () => {
  // Chạy lúc 08:00 mỗi ngày
  cron.schedule("0 8 * * *", async () => {
    try {
      console.log("Cron: Checking nearing expirations (<= 2 days)...");
      
      // 1. Projects expiring in <= 2 days
      const projects = await appPool.request().query(`
        SELECT p.MA_DA AS MADA, p.TEN_DA AS TENDA, p.NGAY_KET_THUC AS NGAYKETTHUC, pc.MA_NV AS MANV
        FROM DU_AN p
        JOIN PHANCONG_DU_AN pc ON p.MA_DA = pc.MA_DA
        WHERE p.TRANG_THAI != N'Hoàn thành'
          AND p.NGAY_KET_THUC IS NOT NULL
          AND DATEDIFF(day, GETDATE(), p.NGAY_KET_THUC) BETWEEN 0 AND 2
      `);
      
      for (const row of projects.recordset) {
        // Tránh spam nhiều thông báo cùng 1 ngày
        const check = await appPool.request()
          .input("MaNV", row.MANV)
          .input("Link", `/projects/${row.MADA}`)
          .query(`
            SELECT 1 FROM THONG_BAO 
            WHERE MA_NV = @MaNV 
              AND LOAI = 'project_deadline' 
              AND LINK = @Link
              AND CAST(NGAY_TAO as DATE) = CAST(GETDATE() as DATE)
          `);
          
        if (check.recordset.length === 0) {
          const daysLeft = Math.ceil((new Date(row.NGAYKETTHUC).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          const tieuDe = `Dự án "${row.TENDA}" sắp đến hạn`;
          const noiDung = `Dự án của bạn sẽ hết hạn trong ${daysLeft} ngày nữa. Vui lòng kiểm tra tiến độ!`;
          const link = `/projects/${row.MADA}`;
          
          const insertRes = await appPool.request()
            .input("MaNV", row.MANV)
            .input("TieuDe", tieuDe)
            .input("NoiDung", noiDung)
            .input("Loai", "project_deadline")
            .input("Link", link)
            .query(`
              INSERT INTO THONG_BAO (MA_NV, TIEU_DE, NOI_DUNG, LOAI, LINK)
              OUTPUT 
                INSERTED.MA_TB AS MaTB, 
                INSERTED.MA_NV AS MaNV, 
                INSERTED.TIEU_DE AS TieuDe, 
                INSERTED.NOI_DUNG AS NoiDung, 
                INSERTED.LOAI AS Loai, 
                INSERTED.DA_DOC AS DaDoc, 
                INSERTED.NGAY_TAO AS NgayTao, 
                INSERTED.LINK AS Link
              VALUES (@MaNV, @TieuDe, @NoiDung, @Loai, @Link)
            `);
          const notif = insertRes.recordset[0];
          if (notif) emitNotification(row.MANV, notif);
        }
      }

      // 2. Tasks expiring in <= 2 days
      const tasks = await appPool.request().query(`
        SELECT MA_NV_DA AS MANHIEMVU, TEN_NHIEM_VU AS TENNHIEMVU, MA_DA AS MADA, MA_NV AS MANV, NGAY_KET_THUC AS NGAYKETTHUC
        FROM NHIEM_VU_DU_AN
        WHERE TRANG_THAI != N'Hoàn thành'
          AND NGAY_KET_THUC IS NOT NULL
          AND DATEDIFF(day, GETDATE(), NGAY_KET_THUC) BETWEEN 0 AND 2
      `);
      
      for (const row of tasks.recordset) {
        if (!row.MANV) continue;
        const check = await appPool.request()
          .input("MaNV", row.MANV)
          .input("Link", `/projects/${row.MADA}`)
          .query(`
            SELECT 1 FROM THONG_BAO 
            WHERE MA_NV = @MaNV 
              AND LOAI = 'task_deadline' 
              AND LINK = @Link
              AND CAST(NGAY_TAO as DATE) = CAST(GETDATE() as DATE)
          `);
          
        if (check.recordset.length === 0) {
          const daysLeft = Math.ceil((new Date(row.NGAYKETTHUC).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
          const tieuDe = `Nhiệm vụ "${row.TENNHIEMVU}" sắp đến hạn`;
          const noiDung = `Nhiệm vụ của bạn trong dự án sẽ hết hạn trong ${daysLeft} ngày nữa.`;
          const link = `/projects/${row.MADA}`;
          
          const insertRes = await appPool.request()
            .input("MaNV", row.MANV)
            .input("TieuDe", tieuDe)
            .input("NoiDung", noiDung)
            .input("Loai", "task_deadline")
            .input("Link", link)
            .query(`
              INSERT INTO THONG_BAO (MA_NV, TIEU_DE, NOI_DUNG, LOAI, LINK)
              OUTPUT 
                INSERTED.MA_TB AS MaTB, 
                INSERTED.MA_NV AS MaNV, 
                INSERTED.TIEU_DE AS TieuDe, 
                INSERTED.NOI_DUNG AS NoiDung, 
                INSERTED.LOAI AS Loai, 
                INSERTED.DA_DOC AS DaDoc, 
                INSERTED.NGAY_TAO AS NgayTao, 
                INSERTED.LINK AS Link
              VALUES (@MaNV, @TieuDe, @NoiDung, @Loai, @Link)
            `);
          const notif = insertRes.recordset[0];
          if (notif) emitNotification(row.MANV, notif);
        }
      }
    } catch (e) {
      console.error("Cron error:", e);
    }
  });
};
