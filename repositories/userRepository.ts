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

const userRepository = {
  // 1. Tạo hoặc xóa contained database user ở DB nghiệp vụ
  handleDatabaseUser: async (EMAIL, password, action) => {
    const normalizedAction = String(action || "").toUpperCase();
    if (normalizedAction !== "CREATE" && normalizedAction !== "DROP") {
      throw new Error("Action không hợp lệ. Chỉ hỗ trợ CREATE hoặc DROP");
    }

    await appPool
      .request()
      .input("Email", sql.NVarChar(100), EMAIL)
      .input("Password", sql.NVarChar(255), password)
      .input("Action", sql.VarChar(10), normalizedAction)
      .execute("sp_handleDatabaseUser");
  },

  // 2. Lưu thông tin đăng ký tạm + OTP vào DANG_KY_CHO
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
      .input("STATUS_VERIFIED", sql.VarChar(20), REGISTRATION_STATUS.OTP_VERIFIED)
      .input("STATUS_PENDING", sql.VarChar(20), REGISTRATION_STATUS.PENDING_OTP)
      .execute("sp_markOtpVerified");

    return (result.recordset?.[0]?.AffectedRows || 0) > 0;
  },

  // 3. Đổi mật khẩu contained database user
  updateDatabaseUserPassword: async (EMAIL, newPassword) => {
    const safeIdentifier = `[${String(EMAIL).replace(/]/g, "]]")}]`;
    const safeEmailLiteral = String(EMAIL).replace(/'/g, "''");
    const safePassword = String(newPassword).replace(/'/g, "''");

    try {
      await appPool
        .request()
        .input("EMAIL", sql.NVarChar(100), EMAIL)
        .input("PASSWORD", sql.NVarChar(255), newPassword)
        .execute("sp_updateDatabaseUserPassword");
      return;
    } catch (error: any) {
      const errMessage = String(error?.message || "");
      const mustUseLoginChange =
        errMessage.includes(
          "The parameter PASSWORD cannot be provided for users that cannot authenticate in a database",
        ) || errMessage.includes("cannot authenticate in a database");

      if (!mustUseLoginChange) {
        throw error;
      }
    }

    const masterPool = new sql.ConnectionPool(getMasterDbConfig());

    try {
      await masterPool.connect();
      await masterPool.request().query(`
        IF EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'${safeEmailLiteral}')
        BEGIN
          ALTER LOGIN ${safeIdentifier} WITH PASSWORD = '${safePassword}';
        END
      `);
    } catch (error: any) {
      const errMessage = String(error?.message || "");
      if (
        errMessage.includes("does not meet policy requirements") ||
        errMessage.includes("not complex enough") ||
        errMessage.includes("Password validation failed")
      ) {
        throw new Error(
          "Mật khẩu mới không đạt chính sách SQL Server. Hãy dùng tối thiểu 8 ký tự và kết hợp chữ hoa, chữ thường, số, ký tự đặc biệt.",
        );
      }

      throw new Error(
        "Không thể đổi mật khẩu SQL Login trên master. Hãy kiểm tra quyền ALTER ANY LOGIN hoặc SECURITYADMIN. Chi tiết: " +
          error.message,
      );
    } finally {
      await masterPool.close().catch(() => undefined);
    }
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
      .input("STATUS_VERIFIED", sql.VarChar(20), REGISTRATION_STATUS.OTP_VERIFIED)
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
        .input("MANV", sql.VarChar(10), payload.MA_NV ?? null)
        .input("HOTEN", sql.NVarChar(200), payload.HO_TEN ?? null)
        .input("MAPHG", sql.Int, payload.MA_PHG ?? null)
        .input("LUONG", sql.Decimal(18, 2), payload.LUONG ?? null)
        .input("CHUCVU", sql.NVarChar(100), payload.CHUC_VU ?? null)
        .input("STATUS_VERIFIED", sql.VarChar(20), REGISTRATION_STATUS.OTP_VERIFIED)
        .execute("sp_approvePendingRegistration");

      const row = result.recordset[0];
      if (!row) {
        return { Success: 0, Message: "Duyệt nhân viên thất bại" };
      }
      return {
        Success: row.Success,
        Message: row.Message,
        Data: { MA_NV: row.MaNV, EMAIL: row.Email }
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
      .input("STATUS_VERIFIED", sql.VarChar(20), REGISTRATION_STATUS.OTP_VERIFIED)
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
