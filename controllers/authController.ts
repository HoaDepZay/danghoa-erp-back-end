// Điểm NHẬN - GỌI SERVICE XỬ LÝ  - TRẢ dữ liệu và kết quả
import authService from "../services/authService";

const register = async (req, res) => {
  try {
    const newUser = await authService.register(req.body);
    console.log(newUser);
    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công! Vui lòng kiểm tra EMAIL để lấy mã OTP.",
      data: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi đăng ký: " + error.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { EMAIL, otpCode } = req.body;
    const result = await authService.verifyOTP(EMAIL, otpCode);

    // Debug: Xem thực tế Service trả về cái gì
    console.log("Kết quả từ Service:", result);

    // Trả về trực tiếp đối tượng result (đã có success và message)
    return res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi tại Controller:", error.message);
    return res.status(400).json({
      success: false, // Ở đây dùng viết thường cho đồng bộ với Frontend
      message: error.message,
    });
  }
};
const login = async (req, res) => {
  try {
    const { EMAIL, password } = req.body;

    if (!EMAIL || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ Email và Mật khẩu!",
      });
    }

    const result = await authService.login(EMAIL, password);

    // Trả về Token và thông tin User cho Frontend lưu vào LocalStorage
    return res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Thiếu refresh token!",
      });
    }

    const result = await authService.refreshSession(refreshToken);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

const logout = async (_req, res) => {
  return res.status(200).json({
    success: true,
    message:
      "Đăng xuất thành công! Vui lòng xóa accessToken/refreshToken ở client.",
  });
};

const forgotPassword = async (req, res) => {
  try {
    const { EMAIL } = req.body;

    if (!EMAIL) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập EMAIL!",
      });
    }

    const result = await authService.forgotPassword(EMAIL);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const resetForgotPassword = async (req, res) => {
  try {
    const { EMAIL, otpCode, newPassword } = req.body;

    if (!EMAIL || !otpCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ EMAIL, mã OTP và mật khẩu mới!",
      });
    }

    const result = await authService.resetForgotPassword(
      EMAIL,
      otpCode,
      newPassword,
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    // Lấy EMAIL từ token để đảm bảo user chỉ có thể đổi mật khẩu của chính mình
    const EMAIL = req.user?.userEmail;

    if (!EMAIL || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới!",
      });
    }

    const result = await authService.changePassword(
      EMAIL,
      oldPassword,
      newPassword,
    );

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    // 🔐 Lấy EMAIL của user đang đăng nhập từ JWT token
    const currentUserEmail = req.user?.userEmail;
    if (!currentUserEmail) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập!",
      });
    }

    // 📋 Email cần cập nhật - có thể từ body hoặc chính user hiện tại
    const targetEmail = req.body.EMAIL || currentUserEmail;

    // 🔒 KIỂM TRA QUYỀN: User chỉ có thể cập nhật profile của chính mình
    if (currentUserEmail.toLowerCase() !== targetEmail.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật thông tin của người khác!",
      });
    }

    const result = await authService.updateProfile(targetEmail, req.body);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getPendingApprovals = async (req, res) => {
  try {
    const result = await authService.getPendingApprovals();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const acceptPendingRegistration = async (req, res) => {
  try {
    const result = await authService.acceptPendingRegistration(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error("acceptPendingRegistration Error:", error);
    return res.status(400).json({
      success: false,
      message: error?.message || "Unknown error",
      stack: error?.stack
    });
  }
};

const rejectPendingRegistration = async (req, res) => {
  try {
    const { EMAIL, reason, rejectedBy } = req.body;
    const result = await authService.rejectPendingRegistration(
      EMAIL,
      reason,
      rejectedBy,
    );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  register,
  verifyOtp,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetForgotPassword,
  changePassword,
  updateProfile,
  getPendingApprovals,
  acceptPendingRegistration,
  rejectPendingRegistration,
};
