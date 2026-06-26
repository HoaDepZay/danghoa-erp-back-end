/**
 * DANGHOA-ERP — Backup Cron Job
 * Lịch chạy:
 *   - Full Backup : Chủ nhật 02:00        (0 2 * * 0)
 *   - Diff Backup : Thứ 2 → Thứ 7, 02:00  (0 2 * * 1-6)
 *   - Log  Backup : Mỗi 4 tiếng           (0 6,10,14,18,22 * * *)
 *   - Cleanup     : Chủ nhật 03:00        (0 3 * * 0)
 */
import cron from "node-cron";
import { appPool } from "../config/db";

// Thư mục backup trên Linux SQL Server (mssql có quyền ghi sẵn)
const BACKUP_BASE = process.env.BACKUP_DIR || "/var/opt/mssql/data";

type BackupType = "FULL" | "DIFF" | "LOG";

interface BackupResult {
  Success: number;
  Message: string;
  FileName?: string;
  FilePath?: string;
  SizeMB?: number;
  DurationSeconds?: number;
}

async function runBackup(type: BackupType): Promise<void> {
  const spMap: Record<BackupType, { sp: string; dir: string }> = {
    FULL: { sp: "sp_BackupFull", dir: `${BACKUP_BASE}\\Full` },
    DIFF: { sp: "sp_BackupDiff", dir: `${BACKUP_BASE}\\Diff` },
    LOG:  { sp: "sp_BackupLog",  dir: `${BACKUP_BASE}\\Log`  },
  };

  const { sp, dir } = spMap[type];
  const startTime = new Date();

  console.log(`\n[BACKUP] ⏳ Bắt đầu ${type} backup lúc ${startTime.toLocaleString("vi-VN")}...`);

  try {
    const result = await appPool
      .request()
      .input("BackupDir", dir)
      .execute(sp);

    const row = result.recordset?.[0] as BackupResult | undefined;

    if (row?.Success === 1) {
      console.log(`[BACKUP] ✅ ${type} backup thành công!`);
      console.log(`         File: ${row.FileName}`);
      console.log(`         Size: ${row.SizeMB} MB`);
      console.log(`         Thời gian: ${row.DurationSeconds}s`);
    } else {
      console.error(`[BACKUP] ❌ ${type} backup thất bại: ${row?.Message ?? "Không có kết quả"}`);
    }
  } catch (err: any) {
    console.error(`[BACKUP] ❌ ${type} backup lỗi exception: ${err?.message}`);
    // Retry sau 5 phút
    console.log(`[BACKUP] 🔄 Thử lại ${type} backup sau 5 phút...`);
    setTimeout(async () => {
      try {
        const spMap2 = spMap[type];
        await appPool.request().input("BackupDir", spMap2.dir).execute(spMap2.sp);
        console.log(`[BACKUP] ✅ ${type} backup retry thành công!`);
      } catch (retryErr: any) {
        console.error(`[BACKUP] ❌ ${type} backup retry thất bại: ${retryErr?.message}`);
      }
    }, 5 * 60 * 1000);
  }
}

async function runCleanup(): Promise<void> {
  console.log("\n[BACKUP] 🧹 Đang dọn dẹp backup cũ...");
  try {
    const result = await appPool
      .request()
      .input("BackupDir",    BACKUP_BASE)
      .input("FullKeepDays", 28)
      .input("DiffKeepDays", 7)
      .input("LogKeepDays",  2)
      .execute("sp_CleanOldBackups");

    console.log("[BACKUP] ✅ Dọn dẹp hoàn tất:", result.recordset?.[0]?.Message);
  } catch (err: any) {
    console.error("[BACKUP] ❌ Lỗi dọn dẹp backup:", err?.message);
  }
}

export const initBackupCron = (): void => {
  // ── Full Backup: Chủ nhật 02:00 ────────────────────────────
  cron.schedule(
    "0 2 * * 0",
    () => runBackup("FULL"),
    { timezone: "Asia/Ho_Chi_Minh" },
  );
  console.log("[BACKUP] 📅 Full backup cron: Chủ nhật 02:00");

  // ── Differential Backup: Thứ 2 → Thứ 7, 02:00 ─────────────
  cron.schedule(
    "0 2 * * 1-6",
    () => runBackup("DIFF"),
    { timezone: "Asia/Ho_Chi_Minh" },
  );
  console.log("[BACKUP] 📅 Differential backup cron: T2–T7 02:00");

  // ── Log Backup: 06:00, 10:00, 14:00, 18:00, 22:00 ──────────
  cron.schedule(
    "0 6,10,14,18,22 * * *",
    () => runBackup("LOG"),
    { timezone: "Asia/Ho_Chi_Minh" },
  );
  console.log("[BACKUP] 📅 Log backup cron: 06:00 / 10:00 / 14:00 / 18:00 / 22:00");

  // ── Cleanup: Chủ nhật 03:00 (sau Full backup 1 tiếng) ───────
  cron.schedule(
    "0 3 * * 0",
    () => runCleanup(),
    { timezone: "Asia/Ho_Chi_Minh" },
  );
  console.log("[BACKUP] 📅 Cleanup cron: Chủ nhật 03:00");

  console.log("[BACKUP] ✅ Backup cron jobs đã khởi động!\n");
};

/**
 * Trigger backup thủ công từ code (dùng trong API hoặc test)
 * @param type "FULL" | "DIFF" | "LOG"
 */
export const triggerManualBackup = (type: BackupType): Promise<void> =>
  runBackup(type);
