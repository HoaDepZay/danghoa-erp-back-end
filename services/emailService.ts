import nodemailer from "nodemailer";
import { appPool, sql } from "../config/db";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Helper: Lấy email của nhân viên theo MA_NV ──────────────────────────────
export const getEmployeeEmail = async (maNv: string): Promise<string | null> => {
  try {
    const res = await appPool.request()
      .input("MANV", sql.VarChar(20), maNv)
      .query(`
        SELECT tk.EMAIL, nv.HO_TEN
        FROM TAI_KHOANG tk
        JOIN NHAN_VIEN nv ON tk.MA_NV = nv.MA_NV
        WHERE tk.MA_NV = @MANV
      `);
    return res.recordset[0]?.EMAIL || null;
  } catch (e) {
    console.error("[emailService] Lỗi lấy email nhân viên:", e);
    return null;
  }
};

// ── Helper: Lấy tên nhân viên theo MA_NV ────────────────────────────────────
export const getEmployeeName = async (maNv: string): Promise<string> => {
  try {
    const res = await appPool.request()
      .input("MANV", sql.VarChar(20), maNv)
      .query(`SELECT HO_TEN FROM NHAN_VIEN WHERE MA_NV = @MANV`);
    return res.recordset[0]?.HO_TEN || maNv;
  } catch {
    return maNv;
  }
};

// ── Base HTML template ───────────────────────────────────────────────────────
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HUIT ERP Notification</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:28px 36px;border-radius:16px 16px 0 0;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <div style="width:40px;height:40px;background:#2563eb;border-radius:10px;display:inline-block;line-height:40px;text-align:center;">
                <span style="color:#fff;font-size:20px;">🏢</span>
              </div>
              <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:0.5px;vertical-align:middle;">HUIT ERP</span>
            </div>
            <p style="color:#94a3b8;font-size:13px;margin:6px 0 0;">Hệ thống Quản trị Nhân sự</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px 36px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            ${content}
            <!-- Footer -->
            <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0;">
                Email này được gửi tự động từ hệ thống HUIT ERP.<br>
                Vui lòng không trả lời email này.
              </p>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

// ── 1. Email thêm vào dự án ──────────────────────────────────────────────────
export const sendProjectAssignEmail = async (
  maNv: string,
  projectName: string,
  projectId: string | number,
  vaiTro: string
) => {
  try {
    const [email, hoTen] = await Promise.all([
      getEmployeeEmail(maNv),
      getEmployeeName(maNv),
    ]);
    if (!email) return;

    const content = `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:64px;height:64px;background:#dbeafe;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px;">📋</div>
        <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 6px;">Bạn được thêm vào dự án!</h2>
        <p style="color:#64748b;font-size:14px;margin:0;">Chào <strong>${hoTen}</strong>, bạn vừa được phân công vào một dự án mới.</p>
      </div>
      
      <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;border-left:4px solid #2563eb;margin-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;width:40%;">Tên dự án</td>
            <td style="padding:6px 0;color:#1e293b;font-weight:600;font-size:14px;">${projectName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;">Vai trò</td>
            <td style="padding:6px 0;">
              <span style="background:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">${vaiTro}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;">Mã dự án</td>
            <td style="padding:6px 0;color:#475569;font-size:13px;">#${projectId}</td>
          </tr>
        </table>
      </div>

      <p style="color:#475569;font-size:14px;line-height:1.6;">
        Hãy đăng nhập vào hệ thống <strong>HUIT ERP</strong> để xem chi tiết dự án, nhiệm vụ được giao và cộng tác với các thành viên khác.
      </p>

      <div style="text-align:center;margin-top:24px;">
        <a href="http://localhost:5173" style="background:#2563eb;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
          Xem dự án ngay →
        </a>
      </div>
    `;

    await transporter.sendMail({
      from: `"HUIT ERP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `📋 Bạn được thêm vào dự án: ${projectName}`,
      html: baseTemplate(content),
    });

    console.log(`✉️ [Email] Gửi thành công thêm dự án → ${email}`);
  } catch (e) {
    console.error("[emailService] Lỗi gửi email thêm dự án:", e);
  }
};

// ── 2. Email giao task ───────────────────────────────────────────────────────
export const sendTaskAssignEmail = async (
  maNv: string,
  taskName: string,
  projectName: string,
  projectId: string | number,
  deadline?: string,
  description?: string
) => {
  try {
    const [email, hoTen] = await Promise.all([
      getEmployeeEmail(maNv),
      getEmployeeName(maNv),
    ]);
    if (!email) return;

    const deadlineHtml = deadline
      ? `<tr>
           <td style="padding:6px 0;color:#64748b;font-size:13px;width:40%;">Hạn hoàn thành</td>
           <td style="padding:6px 0;color:#dc2626;font-weight:600;font-size:14px;">⏰ ${new Date(deadline).toLocaleDateString("vi-VN")}</td>
         </tr>`
      : "";

    const content = `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:64px;height:64px;background:#fef9c3;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px;">✅</div>
        <h2 style="color:#1e293b;font-size:20px;font-weight:700;margin:0 0 6px;">Bạn được giao nhiệm vụ mới!</h2>
        <p style="color:#64748b;font-size:14px;margin:0;">Chào <strong>${hoTen}</strong>, một nhiệm vụ mới vừa được giao cho bạn.</p>
      </div>

      <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;border-left:4px solid #f59e0b;margin-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;width:40%;">Nhiệm vụ</td>
            <td style="padding:6px 0;color:#1e293b;font-weight:700;font-size:15px;">${taskName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:13px;">Dự án</td>
            <td style="padding:6px 0;color:#1e293b;font-weight:600;font-size:14px;">${projectName}</td>
          </tr>
          ${deadlineHtml}
        </table>
      </div>

      ${description ? `
      <div style="background:#fffbeb;border-radius:10px;padding:14px 18px;margin-bottom:20px;border:1px solid #fde68a;">
        <p style="color:#92400e;font-size:12px;font-weight:700;margin:0 0 6px;">📝 MÔ TẢ NHIỆM VỤ</p>
        <p style="color:#78350f;font-size:13px;margin:0;line-height:1.6;">${description}</p>
      </div>` : ""}

      <p style="color:#475569;font-size:14px;line-height:1.6;">
        Vui lòng đăng nhập vào hệ thống để xem chi tiết nhiệm vụ và cập nhật tiến độ công việc.
      </p>

      <div style="text-align:center;margin-top:24px;">
        <a href="http://localhost:5173" style="background:#f59e0b;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
          Xem nhiệm vụ ngay →
        </a>
      </div>
    `;

    await transporter.sendMail({
      from: `"HUIT ERP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Nhiệm vụ mới: ${taskName} — Dự án ${projectName}`,
      html: baseTemplate(content),
    });

    console.log(`✉️ [Email] Gửi thành công giao task → ${email}`);
  } catch (e) {
    console.error("[emailService] Lỗi gửi email giao task:", e);
  }
};

// ── 3. Email duyệt đơn nghỉ phép ────────────────────────────────────────────
export const sendLeaveApprovedEmail = async (
  maNv: string,
  tuNgay: string,
  denNgay: string,
  loaiNghi: string,
  nguoiDuyet: string
) => {
  try {
    const [email, hoTen, tenNguoiDuyet] = await Promise.all([
      getEmployeeEmail(maNv),
      getEmployeeName(maNv),
      getEmployeeName(nguoiDuyet),
    ]);
    if (!email) return;

    const tuDate = new Date(tuNgay).toLocaleDateString("vi-VN");
    const denDate = new Date(denNgay).toLocaleDateString("vi-VN");
    const soNgay = Math.ceil(
      (new Date(denNgay).getTime() - new Date(tuNgay).getTime()) / 86400000
    ) + 1;

    const content = `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:64px;height:64px;background:#dcfce7;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px;">🎉</div>
        <h2 style="color:#166534;font-size:20px;font-weight:700;margin:0 0 6px;">Đơn nghỉ phép đã được duyệt!</h2>
        <p style="color:#64748b;font-size:14px;margin:0;">Chào <strong>${hoTen}</strong>, đơn xin nghỉ phép của bạn đã được phê duyệt.</p>
      </div>

      <div style="background:#f0fdf4;border-radius:12px;padding:20px 24px;border-left:4px solid #22c55e;margin-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:7px 0;color:#64748b;font-size:13px;width:40%;">Loại nghỉ phép</td>
            <td style="padding:7px 0;color:#1e293b;font-weight:600;font-size:14px;">${loaiNghi}</td>
          </tr>
          <tr>
            <td style="padding:7px 0;color:#64748b;font-size:13px;">Từ ngày</td>
            <td style="padding:7px 0;color:#1e293b;font-weight:600;font-size:14px;">${tuDate}</td>
          </tr>
          <tr>
            <td style="padding:7px 0;color:#64748b;font-size:13px;">Đến ngày</td>
            <td style="padding:7px 0;color:#1e293b;font-weight:600;font-size:14px;">${denDate}</td>
          </tr>
          <tr>
            <td style="padding:7px 0;color:#64748b;font-size:13px;">Số ngày nghỉ</td>
            <td style="padding:7px 0;">
              <span style="background:#dcfce7;color:#166534;padding:3px 12px;border-radius:20px;font-size:13px;font-weight:700;">${soNgay} ngày</span>
            </td>
          </tr>
          <tr>
            <td style="padding:7px 0;color:#64748b;font-size:13px;">Người duyệt</td>
            <td style="padding:7px 0;color:#475569;font-size:13px;">${tenNguoiDuyet}</td>
          </tr>
          <tr>
            <td style="padding:7px 0;color:#64748b;font-size:13px;">Trạng thái</td>
            <td style="padding:7px 0;">
              <span style="background:#22c55e;color:#fff;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;">✓ Đã duyệt</span>
            </td>
          </tr>
        </table>
      </div>

      <p style="color:#475569;font-size:14px;line-height:1.6;">
        Chúc bạn có kỳ nghỉ vui vẻ và lấy lại năng lượng! 😊<br>
        Nhớ bàn giao công việc trước khi nghỉ và cập nhật trên hệ thống nếu có thay đổi.
      </p>
    `;

    await transporter.sendMail({
      from: `"HUIT ERP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Đơn nghỉ phép đã được duyệt — ${tuDate} đến ${denDate}`,
      html: baseTemplate(content),
    });

    console.log(`✉️ [Email] Gửi thành công duyệt nghỉ phép → ${email}`);
  } catch (e) {
    console.error("[emailService] Lỗi gửi email nghỉ phép:", e);
  }
};
