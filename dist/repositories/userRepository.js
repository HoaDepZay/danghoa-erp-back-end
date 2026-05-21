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
            .input("Email", db_1.sql.NVarChar(100), email)
            .input("OtpCode", db_1.sql.NVarChar(6), otpCode).query(`
        UPDATE [dbo].[DANG_KY_CHO]
        SET RegistrationStatus = '${REGISTRATION_STATUS.OTP_VERIFIED}',
            OtpVerifiedAt = GETDATE(),
            OtpCode = NULL,
            ExpiredAt = NULL
        WHERE Email = @Email
          AND OtpCode = @OtpCode
          AND ExpiredAt > GETDATE()
          AND RegistrationStatus = '${REGISTRATION_STATUS.PENDING_OTP}';

        SELECT @@ROWCOUNT AS AffectedRows;
      `);
        return (result.recordset?.[0]?.AffectedRows || 0) > 0;
    },
    // 3. Đổi mật khẩu contained database user
    updateDatabaseUserPassword: async (email, newPassword) => {
        const safeIdentifier = `[${String(email).replace(/]/g, "]]")}]`;
        const safeEmailLiteral = String(email).replace(/'/g, "''");
        const safePassword = String(newPassword).replace(/'/g, "''");
        try {
            await db_1.appPool.request().query(`
        IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'${safeEmailLiteral}')
        BEGIN
          ALTER USER ${safeIdentifier} WITH PASSWORD = '${safePassword}';
        END
      `);
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
            .input("Email", db_1.sql.NVarChar(100), email)
            .input("OtpCode", db_1.sql.NVarChar(6), otpCode)
            .input("ExpiredAt", db_1.sql.DateTime, expiredAt).query(`
        DECLARE @ExpiryCol NVARCHAR(128) = NULL;

        IF COL_LENGTH('dbo.NHAN_VIEN', 'CodeExpiredAt') IS NOT NULL
          SET @ExpiryCol = 'CodeExpiredAt';
        ELSE IF COL_LENGTH('dbo.NHAN_VIEN', 'CodeExpireAt') IS NOT NULL
          SET @ExpiryCol = 'CodeExpireAt';

        IF COL_LENGTH('dbo.NHAN_VIEN', 'VerificationCode') IS NULL OR @ExpiryCol IS NULL
        BEGIN
          THROW 50001, N'Thieu cot VerificationCode/CodeExpiredAt (hoac CodeExpireAt) trong bang NHAN_VIEN', 1;
        END

        DECLARE @sql NVARCHAR(MAX) = N'
          UPDATE NHAN_VIEN
          SET VerificationCode = @OtpCode, ' + QUOTENAME(@ExpiryCol) + N' = @ExpiredAt
          WHERE EMAIL = @Email;

          SELECT @@ROWCOUNT AS AffectedRows;
        ';

        EXEC sp_executesql
          @sql,
          N'@OtpCode NVARCHAR(6), @ExpiredAt DATETIME, @Email NVARCHAR(100)',
          @OtpCode = @OtpCode,
          @ExpiredAt = @ExpiredAt,
          @Email = @Email;
      `);
        return (result.recordset?.[0]?.AffectedRows || 0) > 0;
    },
    verifyPasswordResetOtp: async (email, otpCode) => {
        const result = await db_1.appPool
            .request()
            .input("Email", db_1.sql.NVarChar(100), email)
            .input("OtpCode", db_1.sql.NVarChar(6), otpCode).query(`
        DECLARE @ExpiryCol NVARCHAR(128) = NULL;

        IF COL_LENGTH('dbo.NHAN_VIEN', 'CodeExpiredAt') IS NOT NULL
          SET @ExpiryCol = 'CodeExpiredAt';
        ELSE IF COL_LENGTH('dbo.NHAN_VIEN', 'CodeExpireAt') IS NOT NULL
          SET @ExpiryCol = 'CodeExpireAt';

        IF COL_LENGTH('dbo.NHAN_VIEN', 'VerificationCode') IS NULL OR @ExpiryCol IS NULL
        BEGIN
          THROW 50001, N'Thieu cot VerificationCode/CodeExpiredAt (hoac CodeExpireAt) trong bang NHAN_VIEN', 1;
        END

        DECLARE @sql NVARCHAR(MAX) = N'
          SELECT TOP 1 MANV, EMAIL
          FROM NHAN_VIEN
          WHERE EMAIL = @Email
            AND VerificationCode = @OtpCode
            AND ' + QUOTENAME(@ExpiryCol) + N' > GETDATE()
        ';

        EXEC sp_executesql
          @sql,
          N'@OtpCode NVARCHAR(6), @Email NVARCHAR(100)',
          @OtpCode = @OtpCode,
          @Email = @Email;
      `);
        return result.recordset[0] || null;
    },
    clearPasswordResetOtp: async (email) => {
        await db_1.appPool.request().input("Email", db_1.sql.NVarChar(100), email).query(`
      DECLARE @ExpiryCol NVARCHAR(128) = NULL;

      IF COL_LENGTH('dbo.NHAN_VIEN', 'CodeExpiredAt') IS NOT NULL
        SET @ExpiryCol = 'CodeExpiredAt';
      ELSE IF COL_LENGTH('dbo.NHAN_VIEN', 'CodeExpireAt') IS NOT NULL
        SET @ExpiryCol = 'CodeExpireAt';

      IF COL_LENGTH('dbo.NHAN_VIEN', 'VerificationCode') IS NULL OR @ExpiryCol IS NULL
      BEGIN
        THROW 50001, N'Thieu cot VerificationCode/CodeExpiredAt (hoac CodeExpireAt) trong bang NHAN_VIEN', 1;
      END

      DECLARE @sql NVARCHAR(MAX) = N'
        UPDATE NHAN_VIEN
        SET VerificationCode = NULL,
            ' + QUOTENAME(@ExpiryCol) + N' = NULL
        WHERE EMAIL = @Email
      ';

      EXEC sp_executesql
        @sql,
        N'@Email NVARCHAR(100)',
        @Email = @Email;
    `);
    },
    // 5. Kiểm tra OTP còn hiệu lực trong bảng DANG_KY_CHO
    verifyPendingOtp: async (email, otpCode) => {
        const result = await db_1.appPool
            .request()
            .input("Email", db_1.sql.NVarChar(100), email)
            .input("OtpCode", db_1.sql.NVarChar(6), otpCode)
            .query(`SELECT TOP 1 MaNV, Email, PasswordMaHoa, HoTen, MaPhg, Luong, ChucVu, OtpCode, ExpiredAt
         FROM DANG_KY_CHO
         WHERE Email = @Email
           AND OtpCode = @OtpCode
           AND ExpiredAt > GETDATE()
           AND RegistrationStatus = '${REGISTRATION_STATUS.PENDING_OTP}'`);
        return result.recordset[0] || null;
    },
    getPendingRegistrationStatusByEmail: async (email) => {
        await db_1.appPool.request().input("Email", db_1.sql.NVarChar(100), email).query(`
        UPDATE DANG_KY_CHO
        SET RegistrationStatus = '${REGISTRATION_STATUS.EXPIRED}'
        WHERE Email = @Email
          AND RegistrationStatus = '${REGISTRATION_STATUS.PENDING_OTP}'
          AND ExpiredAt IS NOT NULL
          AND ExpiredAt <= GETDATE();
      `);
        const result = await db_1.appPool
            .request()
            .input("Email", db_1.sql.NVarChar(100), email).query(`
        SELECT TOP 1 Email, RegistrationStatus, ExpiredAt, RejectReason
        FROM DANG_KY_CHO
        WHERE Email = @Email
      `);
        return result.recordset[0] || null;
    },
    getPendingApprovalList: async () => {
        const result = await db_1.appPool.request().query(`
      SELECT Email, MaNV, HoTen, MaPhg, Luong, ChucVu, CreatedAt, OtpVerifiedAt, RegistrationStatus
      FROM DANG_KY_CHO
      WHERE RegistrationStatus = '${REGISTRATION_STATUS.OTP_VERIFIED}'
      ORDER BY OtpVerifiedAt DESC, CreatedAt DESC
    `);
        return result.recordset;
    },
    getPendingApprovalByEmail: async (email) => {
        const result = await db_1.appPool
            .request()
            .input("Email", db_1.sql.NVarChar(100), email).query(`
        SELECT TOP 1 Email, MaNV, PasswordMaHoa, HoTen, MaPhg, Luong, ChucVu, RegistrationStatus
        FROM DANG_KY_CHO
        WHERE Email = @Email
      `);
        return result.recordset[0] || null;
    },
    approvePendingRegistration: async (payload) => {
        const transaction = db_1.appPool.transaction();
        await transaction.begin();
        try {
            const safeEmailIdentifier = `[${String(payload.email).replace(/]/g, "]]")}]`;
            const safeEmailLiteral = String(payload.email).replace(/'/g, "''");
            const safePassword = String(payload.password).replace(/'/g, "''");
            const stage = await new db_1.sql.Request(transaction).input("Email", db_1.sql.NVarChar(100), payload.email).query(`
          SELECT TOP 1 Email, MaNV, HoTen, MaPhg, Luong, ChucVu, RegistrationStatus
          FROM DANG_KY_CHO WITH (UPDLOCK, ROWLOCK)
          WHERE Email = @Email
        `);
            const staged = stage.recordset[0];
            if (!staged) {
                await transaction.rollback();
                return { Success: 0, Message: "Không tìm thấy hồ sơ chờ duyệt" };
            }
            if (staged.RegistrationStatus !== REGISTRATION_STATUS.OTP_VERIFIED) {
                await transaction.rollback();
                return {
                    Success: 0,
                    Message: `Không thể duyệt hồ sơ ở trạng thái ${staged.RegistrationStatus}`,
                };
            }
            const effectiveMaNV = payload.manv || staged.MaNV;
            const effectiveHoTen = payload.hoten || staged.HoTen;
            const effectiveMaPhg = payload.maphg === undefined ? staged.MaPhg : payload.maphg;
            const effectiveLuong = payload.luong === undefined ? staged.Luong : payload.luong;
            const effectiveChucVu = payload.chucvu || staged.ChucVu || "Nhân viên";
            if (!effectiveMaNV || !effectiveHoTen) {
                await transaction.rollback();
                return {
                    Success: 0,
                    Message: "Thiếu MANV hoặc Họ tên để duyệt nhân viên",
                };
            }
            await new db_1.sql.Request(transaction).query(`
        IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'${safeEmailLiteral}')
        BEGIN
          CREATE USER ${safeEmailIdentifier} WITH PASSWORD = '${safePassword}';
        END
      `);
            await new db_1.sql.Request(transaction).query(`
        IF NOT EXISTS (
          SELECT 1
          FROM sys.database_role_members drm
          JOIN sys.database_principals rolep ON rolep.principal_id = drm.role_principal_id
          JOIN sys.database_principals memberp ON memberp.principal_id = drm.member_principal_id
          WHERE rolep.name = N'db_datareader' AND memberp.name = N'${safeEmailLiteral}'
        )
        BEGIN
          ALTER ROLE [db_datareader] ADD MEMBER ${safeEmailIdentifier};
        END

        IF NOT EXISTS (
          SELECT 1
          FROM sys.database_role_members drm
          JOIN sys.database_principals rolep ON rolep.principal_id = drm.role_principal_id
          JOIN sys.database_principals memberp ON memberp.principal_id = drm.member_principal_id
          WHERE rolep.name = N'db_datawriter' AND memberp.name = N'${safeEmailLiteral}'
        )
        BEGIN
          ALTER ROLE [db_datawriter] ADD MEMBER ${safeEmailIdentifier};
        END
      `);
            const existed = await new db_1.sql.Request(transaction)
                .input("Email", db_1.sql.NVarChar(100), payload.email)
                .query(`SELECT TOP 1 1 AS ExistsFlag FROM [dbo].[NHAN_VIEN] WHERE EMAIL = @Email`);
            if (existed.recordset.length === 0) {
                await new db_1.sql.Request(transaction)
                    .input("MaNV", db_1.sql.NVarChar(10), effectiveMaNV)
                    .input("Email", db_1.sql.NVarChar(100), payload.email)
                    .input("HoTen", db_1.sql.NVarChar(200), effectiveHoTen)
                    .input("MaPhg", db_1.sql.Int, effectiveMaPhg)
                    .input("Luong", db_1.sql.Decimal(18, 2), effectiveLuong)
                    .input("ChucVu", db_1.sql.NVarChar(100), effectiveChucVu).query(`
            INSERT INTO [dbo].[NHAN_VIEN] (MANV, EMAIL, HOTEN, MAPHG, LUONG, CHUCVU, IsVerified)
            VALUES (@MaNV, @Email, @HoTen, @MaPhg, @Luong, @ChucVu, 1)
          `);
            }
            else {
                await new db_1.sql.Request(transaction)
                    .input("Email", db_1.sql.NVarChar(100), payload.email)
                    .input("HoTen", db_1.sql.NVarChar(200), effectiveHoTen)
                    .input("MaPhg", db_1.sql.Int, effectiveMaPhg)
                    .input("Luong", db_1.sql.Decimal(18, 2), effectiveLuong)
                    .input("ChucVu", db_1.sql.NVarChar(100), effectiveChucVu).query(`
            UPDATE [dbo].[NHAN_VIEN]
            SET HOTEN = @HoTen,
                MAPHG = @MaPhg,
                LUONG = @Luong,
                CHUCVU = @ChucVu,
                IsVerified = 1
            WHERE EMAIL = @Email
          `);
            }
            await new db_1.sql.Request(transaction).input("Email", db_1.sql.NVarChar(100), payload.email).query(`
          DELETE FROM DANG_KY_CHO
          WHERE Email = @Email
        `);
            await transaction.commit();
            return {
                Success: 1,
                Message: "Duyệt nhân viên thành công",
                Data: { manv: effectiveMaNV, email: payload.email },
            };
        }
        catch (error) {
            await transaction.rollback().catch(() => undefined);
            throw error;
        }
    },
    rejectPendingRegistration: async (email, reason, rejectedBy) => {
        const result = await db_1.appPool
            .request()
            .input("Email", db_1.sql.NVarChar(100), email)
            .input("RejectReason", db_1.sql.NVarChar(db_1.sql.MAX), reason || null)
            .input("RejectedBy", db_1.sql.NVarChar(100), rejectedBy || null).query(`
        UPDATE DANG_KY_CHO
        SET RegistrationStatus = '${REGISTRATION_STATUS.REJECTED}',
            RejectReason = @RejectReason,
            RejectedAt = GETDATE(),
            ApprovedBy = @RejectedBy,
            ApprovedAt = NULL
        WHERE Email = @Email
          AND RegistrationStatus IN ('${REGISTRATION_STATUS.PENDING_OTP}', '${REGISTRATION_STATUS.OTP_VERIFIED}');

        SELECT @@ROWCOUNT AS AffectedRows;
      `);
        return (result.recordset?.[0]?.AffectedRows || 0) > 0;
    },
    // 6. Lấy thông tin nhân viên (không lấy mật khẩu)
    getUserByEmail: async (email) => {
        const result = await db_1.appPool
            .request()
            .input("Email", db_1.sql.NVarChar, email)
            .query("SELECT MANV, HOTEN, EMAIL, CHUCVU  FROM NHAN_VIEN WHERE EMAIL = @Email");
        return result; // Trả về nguyên result để Service dùng recordset.length
    },
};
exports.default = userRepository;
