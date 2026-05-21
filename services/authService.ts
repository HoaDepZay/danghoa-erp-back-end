// HÀM LOGIN XỬ LÝ API
import crypto from "crypto";
import sql from "mssql"; // Cần mssql để thử kết nối lúc Login
import { appPool } from "../config/db";
import userRepository from "../repositories/userRepository";
import { sendForgotPasswordOTPMail, sendOTPMail } from "../utils/mailHelper";
import {
  createAccessPayload,
  generateRefreshToken,
  generateToken,
  rotateTokens,
  verifyRefreshToken,
} from "../utils/jwtHelper";
import { decrypt, encrypt } from "../utils/encryptionHelper";

const REGISTRATION_STATUS = {
  PENDING_OTP: "PENDING_OTP",
  OTP_VERIFIED: "OTP_VERIFIED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
};

const generateEmployeeId = () => {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomChars = "";
  for (let i = 0; i < 4; i++) {
    randomChars += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return `NV${randomChars}`;
};

const buildAzureSqlAuthUser = (loginName: string) => {
  const server = process.env.DB_SERVER || "";
  const azureServerShortName = server.split(".")[0];

  // Azure SQL ODBC format: email@gmail.com + server => email@gmail.com@server
  // Simply concatenate with @server (no brackets needed)
  if (azureServerShortName) {
    return `${loginName}@${azureServerShortName}`;
  }

  return loginName;
};

const normalizeGenderToTinyInt = (value: any) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    if (value === 0 || value === 1) return value;
    throw new Error("Giới tính không hợp lệ. Chỉ chấp nhận 0 hoặc 1");
  }

  const normalized = String(value).trim().toLowerCase();

  if (normalized === "1" || normalized === "nam" || normalized === "male") {
    return 1;
  }

  if (
    normalized === "0" ||
    normalized === "nu" ||
    normalized === "nữ" ||
    normalized === "female"
  ) {
    return 0;
  }

  throw new Error("Giới tính không hợp lệ. Dùng Nam/Nữ hoặc 1/0");
};

const stripInvisibleChars = (value: string) =>
  String(value || "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-");

const RESET_OTP_EXPIRE_MINUTES = 10;

const validateSqlPasswordPolicy = (password: string, email: string) => {
  const normalizedPassword = String(password || "");
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const localPart = normalizedEmail.split("@")[0] || "";

  if (normalizedPassword.length < 8) {
    throw new Error("Mật khẩu mới phải có ít nhất 8 ký tự!");
  }

  const hasLowercase = /[a-z]/.test(normalizedPassword);
  const hasUppercase = /[A-Z]/.test(normalizedPassword);
  const hasDigit = /[0-9]/.test(normalizedPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(normalizedPassword);
  const categoryCount = [
    hasLowercase,
    hasUppercase,
    hasDigit,
    hasSpecial,
  ].filter(Boolean).length;

  if (categoryCount < 3) {
    throw new Error(
      "Mật khẩu mới chưa đủ mạnh. Hãy dùng ít nhất 3 nhóm ký tự: chữ hoa, chữ thường, số và ký tự đặc biệt.",
    );
  }

  if (localPart && normalizedPassword.toLowerCase().includes(localPart)) {
    throw new Error("Mật khẩu mới không được chứa email đăng nhập.");
  }
};

const authService = {
  register: async (userData) => {
    // Kiểm tra xem Email đã tồn tại chính thức chưa
    const existing = await userRepository.getUserByEmail(userData.email);
    if (existing.recordset.length > 0) {
      throw new Error("Email này đã được đăng ký trong hệ thống!");
    }

    const manv = generateEmployeeId();
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiredAt = new Date(Date.now() + 10 * 60 * 1000);

    const encryptedPass = encrypt(userData.password);

    // Register chỉ lưu đăng ký tạm + OTP ở DB nghiệp vụ
    const stageResult = await userRepository.savePendingRegistration({
      ...userData,
      manv,
      encryptedPass,
      otpCode,
      expiredAt,
    });

    if (stageResult && stageResult.Success === 0) {
      throw new Error(stageResult.Message || "Không thể lưu đăng ký tạm.");
    }

    sendOTPMail(userData.email, otpCode).catch((err) =>
      console.error("Lỗi gửi mail:", err),
    );

    return {
      success: true,
      message: "Vui lòng kiểm tra mã OTP trong email của bạn.",
    };
  },
  verifyOTP: async (email, otpCode) => {
    // Bước 1: Kiểm tra OTP ở app pool
    const pending = await userRepository.verifyPendingOtp(email, otpCode);
    if (!pending) {
      throw new Error("Mã OTP không đúng hoặc đã hết hạn");
    }

    // OTP hợp lệ: chỉ đánh dấu đã xác thực, chờ admin duyệt.
    const marked = await userRepository.markOtpVerified(email, otpCode);
    if (!marked) {
      throw new Error("Không thể cập nhật trạng thái OTP. Vui lòng thử lại.");
    }

    return {
      success: true,
      message: "Xác thực OTP thành công. Vui lòng chờ admin phê duyệt.",
    };
  },
  login: async (email, password) => {
    // DEBUG: Log chi tiết
    console.log("=== LOGIN DEBUG ===");
    console.log("Time:", new Date().toISOString());
    console.log("Email received:", { type: typeof email, value: email });
    console.log("Password received:", { type: typeof password, value: "***" });

    // Kiểm tra xem email và password có phải string không
    if (typeof email !== "string" || typeof password !== "string") {
      console.error("❌ LỖILỖI: Email hoặc Password không phải string!");
      console.error("   Email:", email);
      console.error("   Password:", password);
      throw new Error(
        "Dữ liệu không hợp lệ - Email/Password phải là chuỗi text",
      );
    }

    // Chuẩn hóa input để giảm lỗi nhập liệu từ mobile keyboard/autofill
    const trimmedEmail = stripInvisibleChars(email).trim().toLowerCase();
    const trimmedPassword = stripInvisibleChars(password).trim();

    console.log("After trim:", { email: trimmedEmail, password: "***" });

    // 1. THỬ KẾT NỐI TRỰC TIẾP VÀO SQL SERVER ĐỂ XÁC THỰC MẬT KHẨU
    const sqlAuthUser = buildAzureSqlAuthUser(trimmedEmail);
    const rawPassword = String(password || "");
    const passwordCandidates = Array.from(
      new Set([
        trimmedPassword,
        stripInvisibleChars(rawPassword),
        stripInvisibleChars(rawPassword).trim(),
        rawPassword.normalize("NFKC"),
        rawPassword.normalize("NFKC").trim(),
      ]),
    ).filter(Boolean);

    let effectivePassword = trimmedPassword;

    console.log("📤 Attempting SQL Server connection with:");
    console.log({
      user: sqlAuthUser,
      password: "***",
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      passwordCandidateCount: passwordCandidates.length,
    });

    // Login cho khách hàng
    try {
      let authPassed = false;

      for (const candidatePassword of passwordCandidates) {
        const loginConfig = {
          user: sqlAuthUser,
          password: candidatePassword,
          server: process.env.DB_SERVER,
          database: process.env.DB_NAME,
          options: {
            encrypt: true,
            trustServerCertificate: true,
            connectionTimeout: 30000,
            requestTimeout: 30000,
          },
        };

        try {
          const tempConn = new sql.ConnectionPool(loginConfig);
          await tempConn.connect();
          await tempConn.close();
          effectivePassword = candidatePassword;
          authPassed = true;
          break;
        } catch (_candidateError) {
          // thử candidate tiếp theo
        }
      }

      if (!authPassed) {
        throw new Error("SQL_AUTH_FAILED");
      }

      console.log("✅ SQL Server authentication successful!");
    } catch (err) {
      console.error("❌ SQL Server login failed:", err.message);

      const pending =
        await userRepository.getPendingRegistrationStatusByEmail(trimmedEmail);
      if (pending?.RegistrationStatus === REGISTRATION_STATUS.OTP_VERIFIED) {
        throw new Error("Tài khoản của bạn chưa được admin chấp nhận.");
      }
      if (pending?.RegistrationStatus === REGISTRATION_STATUS.PENDING_OTP) {
        throw new Error("Vui lòng xác thực OTP trước khi đăng nhập.");
      }
      if (pending?.RegistrationStatus === REGISTRATION_STATUS.REJECTED) {
        throw new Error(
          pending?.RejectReason
            ? `Tài khoản đã bị từ chối: ${pending.RejectReason}`
            : "Tài khoản đã bị từ chối.",
        );
      }
      if (pending?.RegistrationStatus === REGISTRATION_STATUS.EXPIRED) {
        throw new Error("Mã OTP đã hết hạn. Vui lòng đăng ký lại.");
      }

      throw new Error(
        "Mật khẩu không chính xác! Nếu đang dùng điện thoại, hãy tắt tự động viết hoa/sửa chính tả và thử nhập lại.",
      );
    }

    // 2. Lấy profile nhân viên sau khi SQL Login thành công (không dùng để chặn đăng nhập)
    const userResult = await userRepository.getUserByEmail(trimmedEmail);
    const user = userResult.recordset[0];

    if (!user) {
      const pending =
        await userRepository.getPendingRegistrationStatusByEmail(trimmedEmail);
      if (pending?.RegistrationStatus === REGISTRATION_STATUS.OTP_VERIFIED) {
        throw new Error("Tài khoản của bạn chưa được admin chấp nhận.");
      }
      throw new Error("Tài khoản chưa có hồ sơ nhân viên trong hệ thống.");
    }

    // 3. TẠO JWT ACCESS/REFRESH TOKEN
    const tokenPayload = {
      manv: user?.MANV || "",
      hoten: user?.HOTEN || "",
      email: user?.EMAIL || trimmedEmail,
      role: user?.CHUCVU || "",
    };

    const token = generateToken(
      tokenPayload,
      effectivePassword, // Pass mật khẩu plaintext để mã hóa vào token
    );
    const refreshToken = generateRefreshToken(
      createAccessPayload(tokenPayload, effectivePassword),
    );

    console.log("✅ Login successful for user:", trimmedEmail);
    console.log("=== END LOGIN DEBUG ===\n");

    return {
      success: true,
      message: "Đăng nhập thành công!",
      token,
      accessToken: token,
      refreshToken,
      user: {
        manv: tokenPayload.manv,
        hoten: tokenPayload.hoten,
        email: tokenPayload.email,
        role: tokenPayload.role,
      },
    };
  },

  refreshSession: async (refreshToken) => {
    if (!refreshToken) {
      throw new Error("Thiếu refresh token");
    }

    const decoded: any = verifyRefreshToken(refreshToken);
    if (decoded?.tokenType !== "refresh") {
      throw new Error("Token gửi lên không phải refresh token");
    }

    const rotated = rotateTokens(refreshToken);

    return {
      success: true,
      message: "Làm mới phiên đăng nhập thành công",
      token: rotated.accessToken,
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      user: {
        manv: decoded?.session?.userInfo?.manv || "",
        hoten: decoded?.session?.userInfo?.hoten || "",
        email: decoded?.session?.userInfo?.email || "",
        role: decoded?.session?.userInfo?.role || "",
      },
    };
  },

  getPendingApprovals: async () => {
    const data = await userRepository.getPendingApprovalList();
    return {
      success: true,
      message: "Lấy danh sách hồ sơ chờ duyệt thành công",
      data,
    };
  },

  acceptPendingRegistration: async (payload) => {
    const { email, approvedBy } = payload || {};
    if (!email) {
      throw new Error("Thiếu email hồ sơ cần duyệt");
    }

    const staged = await userRepository.getPendingApprovalByEmail(email);
    if (!staged) {
      throw new Error("Không tìm thấy hồ sơ chờ duyệt");
    }

    if (staged.RegistrationStatus !== REGISTRATION_STATUS.OTP_VERIFIED) {
      throw new Error(
        `Hồ sơ không ở trạng thái OTP_VERIFIED (hiện tại: ${staged.RegistrationStatus})`,
      );
    }

    // API duyệt chỉ cần email + thông tin nhân sự; MANV/HOTEN được tự suy ra từ hồ sơ chờ.
    const normalizedStagedName = String(staged.HoTen || "").trim();
    const fallbackName = String(email).split("@")[0] || "Nhan vien moi";
    const effectiveHoTen =
      String(payload?.hoten || "").trim() ||
      normalizedStagedName ||
      fallbackName;
    const effectiveManv =
      String(payload?.manv || "").trim() ||
      String(staged.MaNV || "").trim() ||
      generateEmployeeId();

    const originalPassword = decrypt(staged.PasswordMaHoa);
    const result = await userRepository.approvePendingRegistration({
      email,
      password: originalPassword,
      manv: effectiveManv,
      hoten: effectiveHoTen,
      maphg: payload.maphg,
      luong: payload.luong,
      chucvu: payload.chucvu,
      approvedBy,
    });

    if (!result || result.Success === 0) {
      throw new Error(result?.Message || "Duyệt hồ sơ thất bại");
    }

    return {
      success: true,
      message: result.Message,
      data: result.Data,
    };
  },

  rejectPendingRegistration: async (email, reason, rejectedBy) => {
    if (!email) {
      throw new Error("Thiếu email hồ sơ cần từ chối");
    }

    const ok = await userRepository.rejectPendingRegistration(
      email,
      reason,
      rejectedBy,
    );

    if (!ok) {
      throw new Error("Không thể từ chối hồ sơ ở trạng thái hiện tại");
    }

    return {
      success: true,
      message: "Đã từ chối hồ sơ đăng ký",
    };
  },

  forgotPassword: async (email) => {
    const normalizedEmail = String(email || "").trim();
    if (!normalizedEmail) {
      throw new Error("Vui lòng nhập email!");
    }

    const userResult = await userRepository.getUserByEmail(normalizedEmail);
    const user = userResult.recordset[0];

    // Không làm lộ email tồn tại hay không.
    if (!user) {
      return {
        success: true,
        message: "Nếu email tồn tại, hệ thống đã gửi mã OTP đặt lại mật khẩu.",
      };
    }

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiredAt = new Date(
      Date.now() + RESET_OTP_EXPIRE_MINUTES * 60 * 1000,
    );

    const saved = await userRepository.savePasswordResetOtp(
      normalizedEmail,
      otpCode,
      expiredAt,
    );

    if (!saved) {
      throw new Error("Không thể tạo OTP đặt lại mật khẩu. Vui lòng thử lại.");
    }

    sendForgotPasswordOTPMail(normalizedEmail, otpCode).catch((err) =>
      console.error("Lỗi gửi OTP quên mật khẩu:", err),
    );

    return {
      success: true,
      message: "Nếu email tồn tại, hệ thống đã gửi mã OTP đặt lại mật khẩu.",
    };
  },

  resetForgotPassword: async (email, otpCode, newPassword) => {
    const normalizedEmail = String(email || "").trim();
    const normalizedOtp = String(otpCode || "").trim();

    if (!normalizedEmail || !normalizedOtp || !newPassword) {
      throw new Error("Vui lòng nhập đầy đủ email, mã OTP và mật khẩu mới!");
    }

    if (newPassword.length < 8) {
      throw new Error("Mật khẩu mới phải có ít nhất 8 ký tự!");
    }

    validateSqlPasswordPolicy(newPassword, normalizedEmail);

    const userResult = await userRepository.getUserByEmail(normalizedEmail);
    const user = userResult.recordset[0];
    if (!user) {
      throw new Error("Email không tồn tại trong hệ thống!");
    }

    const validOtp = await userRepository.verifyPasswordResetOtp(
      normalizedEmail,
      normalizedOtp,
    );

    if (!validOtp) {
      throw new Error("Mã OTP không đúng hoặc đã hết hạn!");
    }

    await userRepository.updateDatabaseUserPassword(
      normalizedEmail,
      newPassword,
    );

    await userRepository.clearPasswordResetOtp(normalizedEmail);

    return {
      success: true,
      message: "Đặt lại mật khẩu thành công!",
    };
  },

  // 8. Đổi mật khẩu
  changePassword: async (email, oldPassword, newPassword) => {
    console.log("🔄 Changing password for:", email);

    if (!oldPassword || !newPassword) {
      throw new Error("Vui lòng nhập đầy đủ mật khẩu cũ và mới!");
    }

    if (newPassword.length < 8) {
      throw new Error("Mật khẩu mới phải có ít nhất 8 ký tự!");
    }

    validateSqlPasswordPolicy(newPassword, email);

    if (oldPassword === newPassword) {
      throw new Error("Mật khẩu mới phải khác mật khẩu cũ!");
    }

    // 1. Lấy user info
    const userResult = await userRepository.getUserByEmail(email);
    const user = userResult.recordset[0];

    if (!user) {
      throw new Error("Email không tồn tại trong hệ thống!");
    }

    // 2. Xác thực mật khẩu cũ bằng cách thử kết nối SQL Server
    const sqlAuthUser = buildAzureSqlAuthUser(email);
    const verifyConfig = {
      user: sqlAuthUser,
      password: oldPassword,
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      options: {
        encrypt: true,
        trustServerCertificate: true,
        connectionTimeout: 30000,
        requestTimeout: 30000,
      },
    };

    try {
      const tempConn = new sql.ConnectionPool(verifyConfig);
      await tempConn.connect();
      await tempConn.close();
    } catch (err) {
      console.error("❌ Old password verification failed:", err.message);
      throw new Error("Mật khẩu cũ không chính xác!");
    }

    // 3. Đổi mật khẩu của contained database user
    await userRepository.updateDatabaseUserPassword(email, newPassword);

    console.log("✅ Password changed successfully for:", email);

    return {
      success: true,
      message: "Đổi mật khẩu thành công!",
    };
  },

  // 9. Cập nhật profile cá nhân
  updateProfile: async (email, data) => {
    console.log("📝 Updating profile for:", email);

    if (!data || Object.keys(data).length === 0) {
      throw new Error("Không có dữ liệu để cập nhật!");
    }

    // 1. Lấy user info
    const userResult = await userRepository.getUserByEmail(email);
    const user = userResult.recordset[0];

    // 2. Chuẩn bị dữ liệu cập nhật
    const updateData = {
      hoten: data.hoten,
      ngaysinh: data.ngaysinh,
      gioitinh: data.gioitinh,
      diachinhan: data.diachinhan || data.diachi, // Support both naming conventions
      sdt: data.sdt,
    };

    // Lọc các trường undefined
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    // Nếu chưa có hồ sơ trong NHAN_VIEN: tự cấp MANV và tạo mới nhân viên.
    if (!user) {
      if (!data.hoten || String(data.hoten).trim() === "") {
        throw new Error("Thiếu họ tên để tạo hồ sơ nhân viên mới!");
      }

      let manv = "";
      for (let i = 0; i < 10; i++) {
        const candidate = generateEmployeeId();
        const existed = await appPool
          .request()
          .input("MaNV", sql.NVarChar(10), candidate)
          .query(
            "SELECT TOP 1 1 AS ExistsFlag FROM NHAN_VIEN WHERE MANV = @MaNV",
          );

        if (existed.recordset.length === 0) {
          manv = candidate;
          break;
        }
      }

      if (!manv) {
        throw new Error("Không thể tạo mã nhân viên mới, vui lòng thử lại!");
      }

      const request = appPool.request();
      const gioiTinhValue = normalizeGenderToTinyInt(data.gioitinh);

      await request
        .input("MaNV", sql.NVarChar(10), manv)
        .input("HoTen", sql.NVarChar(200), data.hoten)
        .input("Email", sql.NVarChar(100), email)
        .input("ChucVu", sql.NVarChar(100), data.chucvu || "Nhân viên")
        .input("Luong", sql.Decimal(18, 2), data.luong ?? 0)
        .input("MaPhg", sql.Int, data.maphg ?? null)
        .input("NgaySinh", sql.Date, data.ngaysinh || null)
        .input("GioiTinh", sql.TinyInt, gioiTinhValue)
        .input("DiaChiNhan", sql.NVarChar(255), data.diachinhan || null)
        .input("SDT", sql.NVarChar(15), data.sdt || null).query(`
          INSERT INTO NHAN_VIEN
            (MANV, HOTEN, EMAIL, CHUCVU, LUONG, MAPHG, NgaySinh, GioiTinh, DiaChi, SDT, NgayTuyenDung, IsVerified)
          VALUES
            (@MaNV, @HoTen, @Email, @ChucVu, @Luong, @MaPhg, @NgaySinh, @GioiTinh, @DiaChiNhan, @SDT, GETDATE(), 1)
        `);

      console.log("✅ Created profile for manual SQL user:", email, "=>", manv);
      return {
        success: true,
        message: "Tạo hồ sơ nhân viên mới thành công!",
        manv,
      };
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("Không có dữ liệu hợp lệ để cập nhật!");
    }

    // 3. Cập nhật vào DB
    try {
      const request = appPool.request();
      let updateFields = [];

      for (let key in updateData) {
        if (updateData[key] !== undefined) {
          if (key === "hoten") updateFields.push("HOTEN = @HoTen");
          if (key === "ngaysinh") updateFields.push("NgaySinh = @NgaySinh");
          if (key === "gioitinh") updateFields.push("GioiTinh = @GioiTinh");
          if (key === "diachinhan") updateFields.push("DiaChi = @DiaChiNhan");
          if (key === "sdt") updateFields.push("SDT = @SDT");

          if (key === "hoten") {
            request.input("HoTen", sql.NVarChar, updateData[key]);
          }

          if (key === "ngaysinh") {
            request.input("NgaySinh", sql.Date, updateData[key]);
          }

          if (key === "gioitinh") {
            const gioiTinhValue = normalizeGenderToTinyInt(updateData[key]);
            request.input("GioiTinh", sql.TinyInt, gioiTinhValue);
          }

          if (key === "diachinhan") {
            request.input("DiaChiNhan", sql.NVarChar, updateData[key]);
          }

          if (key === "sdt") {
            request.input("SDT", sql.NVarChar, updateData[key]);
          }
        }
      }

      request.input("Email", sql.NVarChar, email);
      const query = `UPDATE NHAN_VIEN SET ${updateFields.join(", ")} WHERE EMAIL = @Email`;

      await request.query(query);
    } catch (err) {
      throw new Error("Lỗi cập nhật profile: " + err.message);
    }

    console.log("✅ Profile updated successfully for:", email);

    return {
      success: true,
      message: "Cập nhật profile thành công!",
    };
  },
};
export default authService;
