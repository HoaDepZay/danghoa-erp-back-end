import cron from "node-cron";
import contractRepository from "../repositories/contractRepository";
import { appPool } from "../config/db";

export const initContractCron = () => {
  // Chạy vào lúc 00:00 mỗi ngày
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ [CRON] Đang chạy cronjob kiểm tra hợp đồng hết hạn...");
    try {
      // Tìm các hợp đồng Đang thực hiện nhưng đã quá hạn (DEN_NGAY < TODAY)
      const result = await appPool.request().query(`
        SELECT MA_HD, MA_NV, TRANG_THAI
        FROM HOP_DONG_LAO_DONG
        WHERE TRANG_THAI = 'DANG THUC HIEN'
          AND DEN_NGAY IS NOT NULL
          AND CAST(DEN_NGAY AS DATE) < CAST(GETDATE() AS DATE)
      `);

      const expiredContracts = result.recordset;

      if (expiredContracts.length > 0) {
        console.log(`⚠️ Phát hiện ${expiredContracts.length} hợp đồng quá hạn. Bắt đầu chuyển trạng thái...`);

        for (const contract of expiredContracts) {
          await contractRepository.updateContractStatus(contract.MA_HD, "HET HAN");
          await contractRepository.logContractHistory(
            contract.MA_HD,
            "SYSTEM",
            "Trạng thái: DANG THUC HIEN -> HET HAN (Tự động chuyển do quá hạn)"
          );
          console.log(`✅ Đã chuyển hợp đồng ${contract.MA_HD} sang HET HAN.`);
        }
      } else {
        console.log("✅ Không có hợp đồng nào quá hạn cần xử lý hôm nay.");
      }
    } catch (error) {
      console.error("❌ Lỗi khi chạy cronjob hợp đồng:", error);
    }
  });

  console.log("✅ Contract Cronjob Initialized");
};
