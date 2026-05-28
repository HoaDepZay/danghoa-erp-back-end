"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const REGISTRATION_STATUS = {
    PENDING_OTP: "PENDING_OTP",
    OTP_VERIFIED: "OTP_VERIFIED",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    EXPIRED: "EXPIRED",
};
const getMasterDbConfig = () => ({
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
    handleDatabaseUser: async (email, password, action) => {
        const normalizedAction = String(action || "").toUpperCase();
        if (normalizedAction !== "CREATE" && normalizedAction !== "DROP") {
            throw new Error("Action không hợp lệ. Chỉ hỗ trợ CREATE hoặc DROP");
        }
        await db_1.appPool
            .request()
            .input("Email", db_1.sql.NVarChar(100), email)
            .input("Password", db_1.sql.NVarChar(255), password)
            .input("Action", db_1.sql.VarChar(10), normalizedAction)
            .execute("sp_handleDatabaseUser");
    },
    // 2. Lưu thông tin đăng ký tạm + OTP vào DANG_KY_CHO
    savePendingRegistration: async (data) => {
        await db_1.appPool
            .request()
            .input("MaNV", db_1.sql.NVarChar(10), data.manv)
            .input("Email", db_1.sql.NVarChar(100), data.email)
            .input("PassEnc", db_1.sql.NVarChar(db_1.sql.MAX), data.encryptedPass)
            .input("HoTen", db_1.sql.NVarChar(200), data.hoten)
            .input("MaPhg", db_1.sql.Int, data.maphg)
            .input("Luong", db_1.sql.Decimal(18, 2), data.luong ?? 0)
            .input("ChucVu", db_1.sql.NVarChar(100), data.chucvu || "Nhân viên")
            .input("OtpCode", db_1.sql.NVarChar(6), data.otpCode)
            .input("ExpiredAt", db_1.sql.DateTime, data.expiredAt)
            .execute("sp_savePendingRegistration");
        return {
            Success: 1,
            Message: "Đã lưu thông tin tạm thời và gửi OTP",
        };
    },
    markOtpVerified: async (email, otpCode) => {
        const result = await db_1.appPool
            .request()
            .input("EMAIL", db_1.sql.NVarChar(100), email)
            .input("OTPCODE", db_1.sql.NVarChar(6), otpCode)
            .input("STATUS_VERIFIED", db_1.sql.VarChar(20), REGISTRATION_STATUS.OTP_VERIFIED)
            .input("STATUS_PENDING", db_1.sql.VarChar(20), REGISTRATION_STATUS.PENDING_OTP)
            .execute("sp_markOtpVerified");
        return (result.recordset?.[0]?.AffectedRows || 0) > 0;
    },
    // 3. Đổi mật khẩu contained database user
    updateDatabaseUserPassword: async (email, newPassword) => {
        const safeIdentifier = `[${String(email).replace(/]/g, "]]")}]`;
        const safeEmailLiteral = String(email).replace(/'/g, "''");
        const safePassword = String(newPassword).replace(/'/g, "''");
        try {
            await db_1.appPool
                .request()
                .input("EMAIL", db_1.sql.NVarChar(100), email)
                .input("PASSWORD", db_1.sql.NVarChar(255), newPassword)
                .execute("sp_updateDatabaseUserPassword");
            return;
        }
        catch (error) {
            const errMessage = String(error?.message || "");
            const mustUseLoginChange = errMessage.includes("The parameter PASSWORD cannot be provided for users that cannot authenticate in a database") || errMessage.includes("cannot authenticate in a database");
            if (!mustUseLoginChange) {
                throw error;
            }
        }
        const masterPool = new db_1.sql.ConnectionPool(getMasterDbConfig());
        try {
            await masterPool.connect();
            await masterPool.request().query(`
        IF EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'${safeEmailLiteral}')
        BEGIN
          ALTER LOGIN ${safeIdentifier} WITH PASSWORD = '${safePassword}';
        END
      `);
        }
        catch (error) {
            const errMessage = String(error?.message || "");
            if (errMessage.includes("does not meet policy requirements") ||
                errMessage.includes("not complex enough") ||
                errMessage.includes("Password validation failed")) {
                throw new Error("Mật khẩu mới không đạt chính sách SQL Server. Hãy dùng tối thiểu 8 ký tự và kết hợp chữ hoa, chữ thường, số, ký tự đặc biệt.");
            }
            throw new Error("Không thể đổi mật khẩu SQL Login trên master. Hãy kiểm tra quyền ALTER ANY LOGIN hoặc SECURITYADMIN. Chi tiết: " +
                error.message);
        }
        finally {
            await masterPool.close().catch(() => undefined);
        }
    },
    savePasswordResetOtp: async (email, otpCode, expiredAt) => {
        const result = await db_1.appPool
            .request()
            .input("EMAIL", db_1.sql.NVarChar(100), email)
            .input("OTPCODE", db_1.sql.NVarChar(6), otpCode)
            .input("EXPIREDAT", db_1.sql.DateTime, expiredAt)
            .execute("sp_savePasswordResetOtp");
        return (result.recordset?.[0]?.AffectedRows || 0) > 0;
    },
    verifyPasswordResetOtp: async (email, otpCode) => {
        const result = await db_1.appPool
            .request()
            .input("EMAIL", db_1.sql.NVarChar(100), email)
            .input("OTPCODE", db_1.sql.NVarChar(6), otpCode)
            .execute("sp_verifyPasswordResetOtp");
        return result.recordset[0] || null;
    },
    clearPasswordResetOtp: async (email) => {
        await db_1.appPool
            .request()
            .input("EMAIL", db_1.sql.NVarChar(100), email)
            .execute("sp_clearPasswordResetOtp");
    },
    // 5. Kiểm tra OTP còn hiệu lực trong bảng DANG_KY_CHO
    verifyPendingOtp: async (email, otpCode) => {
        const result = await db_1.appPool
            .request()
            .input("EMAIL", db_1.sql.NVarChar(100), email)
            .input("OTPCODE", db_1.sql.NVarChar(6), otpCode)
            .input("STATUS_PENDING", db_1.sql.VarChar(20), REGISTRATION_STATUS.PENDING_OTP)
            .execute("sp_verifyPendingOtp");
        return result.recordset[0] || null;
    },
    getPendingRegistrationStatusByEmail: async (email) => {
        const result = await db_1.appPool
            .request()
            .input("EMAIL", db_1.sql.NVarChar(100), email)
            .input("STATUS_PENDING", db_1.sql.VarChar(20), REGISTRATION_STATUS.PENDING_OTP)
            .input("STATUS_EXPIRED", db_1.sql.VarChar(20), REGISTRATION_STATUS.EXPIRED)
            .execute("sp_getPendingRegistrationStatusByEmail");
        return result.recordset[0] || null;
    },
    getPendingApprovalList: async () => {
        const result = await db_1.appPool
            .request()
            .input("STATUS_VERIFIED", db_1.sql.VarChar(20), REGISTRATION_STATUS.OTP_VERIFIED)
            .execute("sp_getPendingApprovalList");
        return result.recordset;
    },
    getPendingApprovalByEmail: async (email) => {
        const result = await db_1.appPool
            .request()
            .input("EMAIL", db_1.sql.NVarChar(100), email)
            .execute("sp_getPendingApprovalByEmail");
        return result.recordset[0] || null;
    },
    approvePendingRegistration: async (payload) => {
        try {
            const result = await db_1.appPool
                .request()
                .input("EMAIL", db_1.sql.NVarChar(100), payload.email)
                .input("PASSWORD", db_1.sql.NVarChar(255), payload.password)
                .input("MANV", db_1.sql.VarChar(10), payload.manv ?? null)
                .input("HOTEN", db_1.sql.NVarChar(200), payload.hoten ?? null)
                .input("MAPHG", db_1.sql.Int, payload.maphg ?? null)
                .input("LUONG", db_1.sql.Decimal(18, 2), payload.luong ?? null)
                .input("CHUCVU", db_1.sql.NVarChar(100), payload.chucvu ?? null)
                .input("STATUS_VERIFIED", db_1.sql.VarChar(20), REGISTRATION_STATUS.OTP_VERIFIED)
                .execute("sp_approvePendingRegistration");
            const row = result.recordset[0];
            if (!row) {
                return { Success: 0, Message: "Duyệt nhân viên thất bại" };
            }
            return {
                Success: row.Success,
                Message: row.Message,
                Data: { manv: row.MaNV, email: row.Email }
            };
        }
        catch (error) {
            throw error;
        }
    },
    rejectPendingRegistration: async (email, reason, rejectedBy) => {
        const result = await db_1.appPool
            .request()
            .input("EMAIL", db_1.sql.NVarChar(100), email)
            .input("REJECTREASON", db_1.sql.NVarChar(db_1.sql.MAX), reason ?? null)
            .input("REJECTEDBY", db_1.sql.NVarChar(100), rejectedBy ?? null)
            .input("STATUS_PENDING", db_1.sql.VarChar(20), REGISTRATION_STATUS.PENDING_OTP)
            .input("STATUS_VERIFIED", db_1.sql.VarChar(20), REGISTRATION_STATUS.OTP_VERIFIED)
            .input("STATUS_REJECTED", db_1.sql.VarChar(20), REGISTRATION_STATUS.REJECTED)
            .execute("sp_rejectPendingRegistration");
        return (result.recordset?.[0]?.AffectedRows || 0) > 0;
    },
    // 6. Lấy thông tin nhân viên (không lấy mật khẩu)
    getUserByEmail: async (email) => {
        const result = await db_1.appPool
            .request()
            .input("EMAIL", db_1.sql.NVarChar(100), email)
            .execute("sp_getUserByEmail");
        return result;
    },
};
exports.default = userRepository;
