import { appPool, sql } from "../config/db";

const REGISTRATION_STATUS = {
  PENDING_OTP: "PENDING_OTP",
  OTP_VERIFIED: "OTP_VERIFIED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
};

const getMasterDbConfig = (): sql.config => ({
  user: process.env.DB_MASTER_USER || process.env.DB_USER,
  password: process.env.DB_MASTER_PASS || process.env.DB_PASS,
  server: process.env.DB_SERVER || "",
  port: parseInt(process.env.DB_PORT || "1433"),
  database: process.env.DB_MASTER || "master",
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 30000,
  },
  pool: {
    max: 3,
    min: 0,
    idleTimeoutMillis: 30000,
  },
});
//jk

const userRepository = {  // 2. Lưu thông tin đăng ký tạm + OTP vào DANG_KY_CHO
  savePendingRegistration: async (data) => {
    await appPool
      .request()
      .input("MaNV", sql.NVarChar(10), data.MA_NV)
      .input("Email", sql.NVarChar(100), data.EMAIL)
      .input("PassEnc", sql.NVarChar(sql.MAX), data.encryptedPass)
      .input("HoTen", sql.NVarChar(200), data.HO_TEN)
      .input("MaPhg", sql.Int, data.MA_PHG)
      .input("Luong", sql.Decimal(18, 2), data.LUONG ?? 0)
      .input("ChucVu", sql.NVarChar(100), data.CHUC_VU || "Nhân viên")
      .input("OtpCode", sql.NVarChar(6), data.otpCode)
      .input("ExpiredAt", sql.DateTime, data.expiredAt)
      .execute("sp_savePendingRegistration");

    return {
      Success: 1,
      Message: "Đã lưu thông tin tạm thời và gửi OTP",
    };
  },

  markOtpVerified: async (EMAIL, otpCode) => {
    const result = await appPool
      .request()
      .input("EMAIL", sql.NVarChar(100), EMAIL)
      .input("OTPCODE", sql.NVarChar(6), otpCode)
      .input(
        "STATUS_VERIFIED",
        sql.VarChar(20),
        REGISTRATION_STATUS.OTP_VERIFIED,
      )
      .input("STATUS_PENDING", sql.VarChar(20), REGISTRATION_STATUS.PENDING_OTP)
      .execute("sp_markOtpVerified");

    return (result.recordset?.[0]?.AffectedRows || 0) > 0;
  },

  // Cập nhật mật khẩu trong CSDL
  updateDatabaseUserPassword: async (EMAIL, newPasswordHash) => {
    try {
      // 1. Cập nhật mật khẩu trong bảng TAI_KHOANG
      await appPool
        .request()
        .input("EMAIL", sql.NVarChar(100), EMAIL)
        .input("PASSWORD", sql.NVarChar(255), newPasswordHash)
        .query(
          "UPDATE TAI_KHOANG SET PASSWORD_HASH = @PASSWORD WHERE EMAIL = @EMAIL",
        );
    } catch (error: any) {
      throw new Error(
        "Lỗi khi cập nhật mật khẩu CSDL: " + (error.message || error),
      );
    }
  },

  getUserPasswordHash: async (EMAIL) => {
    const result = await appPool
      .request()
      .input("EMAIL", sql.NVarChar(100), EMAIL)
      .query("SELECT PASSWORD_HASH FROM TAI_KHOANG WHERE EMAIL = @EMAIL");
    return result.recordset[0]?.PASSWORD_HASH || null;
  },

  savePasswordResetOtp: async (EMAIL, otpCode, expiredAt) => {
    const result = await appPool
      .request()
      .input("EMAIL", sql.NVarChar(100), EMAIL)
      .input("OTPCODE", sql.NVarChar(6), otpCode)
      .input("EXPIREDAT", sql.DateTime, expiredAt)
      .execute("sp_savePasswordResetOtp");

    return (result.recordset?.[0]?.AffectedRows || 0) > 0;
  },

  verifyPasswordResetOtp: async (EMAIL, otpCode) => {
    const result = await appPool
      .request()
      .input("EMAIL", sql.NVarChar(100), EMAIL)
      .input("OTPCODE", sql.NVarChar(6), otpCode)
      .execute("sp_verifyPasswordResetOtp");

    return result.recordset[0] || null;
  },

  clearPasswordResetOtp: async (EMAIL) => {
    await appPool
      .request()
      .input("EMAIL", sql.NVarChar(100), EMAIL)
      .execute("sp_clearPasswordResetOtp");
  },

  // 5. Kiểm tra OTP còn hiệu lực trong bảng DANG_KY_CHO
  verifyPendingOtp: async (EMAIL, otpCode) => {
    const result = await appPool
      .request()
      .input("EMAIL", sql.NVarChar(100), EMAIL)
      .input("OTPCODE", sql.NVarChar(6), otpCode)
      .input("STATUS_PENDING", sql.VarChar(20), REGISTRATION_STATUS.PENDING_OTP)
      .execute("sp_verifyPendingOtp");

    return result.recordset[0] || null;
  },

  getPendingRegistrationStatusByEmail: async (EMAIL) => {
    const result = await appPool
      .request()
      .input("EMAIL", sql.NVarChar(100), EMAIL)
      .input("STATUS_PENDING", sql.VarChar(20), REGISTRATION_STATUS.PENDING_OTP)
      .input("STATUS_EXPIRED", sql.VarChar(20), REGISTRATION_STATUS.EXPIRED)
      .execute("sp_getPendingRegistrationStatusByEmail");

    return result.recordset[0] || null;
  },

  getPendingApprovalList: async () => {
    const result = await appPool
      .request()
      .execute("sp_getPendingApprovalList");

    return result.recordset;
  },

  getPendingApprovalByEmail: async (EMAIL) => {
    const result = await appPool
      .request()
      .input("EMAIL", sql.NVarChar(100), EMAIL)
      .execute("sp_getPendingApprovalByEmail");

    return result.recordset[0] || null;
  },

  approvePendingRegistration: async (payload) => {
    try {
      const result = await appPool
        .request()
        .input("EMAIL", sql.NVarChar(100), payload.EMAIL)
        .input("PASSWORD", sql.NVarChar(255), payload.password)
        .input("MANV", sql.VarChar(20), payload.MA_NV ?? null)
        .input("HOTEN", sql.NVarChar(200), payload.HO_TEN ?? null)
        .input("MAPHG", sql.Int, payload.MA_PHG ?? null)
        .input("LUONG", sql.Decimal(18, 2), payload.LUONG ?? null)
        .input("CHUCVU", sql.NVarChar(100), payload.CHUC_VU ?? null)
        .input(
          "STATUS_VERIFIED",
          sql.VarChar(20),
          REGISTRATION_STATUS.OTP_VERIFIED,
        )
        .execute("sp_approvePendingRegistration");

      const row = result.recordset[0];
      if (!row) {
        return { Success: 0, Message: "Duyệt nhân viên thất bại" };
      }
      return {
        Success: row.Success,
        Message: row.Message,
        Data: { MA_NV: row.MaNV, EMAIL: row.Email },
      };
    } catch (error) {
      throw error;
    }
  },

  rejectPendingRegistration: async (EMAIL, reason, rejectedBy) => {
    const result = await appPool
      .request()
      .input("EMAIL", sql.NVarChar(100), EMAIL)
      .input("REJECTREASON", sql.NVarChar(sql.MAX), reason ?? null)
      .input("REJECTEDBY", sql.NVarChar(100), rejectedBy ?? null)
      .input("STATUS_PENDING", sql.VarChar(20), REGISTRATION_STATUS.PENDING_OTP)
      .input(
        "STATUS_VERIFIED",
        sql.VarChar(20),
        REGISTRATION_STATUS.OTP_VERIFIED,
      )
      .input("STATUS_REJECTED", sql.VarChar(20), REGISTRATION_STATUS.REJECTED)
      .execute("sp_rejectPendingRegistration");

    return (result.recordset?.[0]?.AffectedRows || 0) > 0;
  },

  // 6. Lấy thông tin nhân viên (không lấy mật khẩu)
  getUserByEmail: async (EMAIL) => {
    const result = await appPool
      .request()
      .input("EMAIL", sql.NVarChar(100), EMAIL)
      .execute("sp_getUserByEmail");

    return result;
  },
};

export default userRepository;
