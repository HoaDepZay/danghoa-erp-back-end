import { normalizeRole, isAdminRole } from "../utils/authHelper";

/**
 * Middleware kiểm tra quyền Admin
 * Chỉ cho phép user có role = admin
 *
 * Sử dụng: router.use(withUserConnection, requireAdmin)
 */
const requireAdmin = (req, res, next) => {
  const userRole = req.user?.userInfo?.role;
  const userEmail = req.user?.userEmail;

  console.log(`🔒 Admin check for user: ${userEmail}, role: ${userRole}`);

  // Chỉ cho phép đúng CHUCVU = admin
  if (!isAdminRole(userRole)) {
    return res.status(403).json({
      success: false,
      message:
        "Bạn không có quyền truy cập tài nguyên này. Chỉ admin mới có thể.",
    });
  }

  next();
};

/**
 * Middleware kiểm tra quyền Admin hoặc Normal User
 * Set flag req.isAdmin để biết user có phải admin hay không
 *
 * Sử dụng: router.use(withUserConnection, checkAdminOrPass)
 */
const checkAdminOrPass = (req, res, next) => {
  const userRole = req.user?.userInfo?.role;
  req.isAdmin = isAdminRole(userRole);

  next();
};

/**
 * Middleware kiểm tra MaNV trong request body có trùng với token hay không
 * Quy tắc:
 * - Admin: có quyền check in/out cho bất kỳ nhân viên nào
 * - Nhân viên bình thường: chỉ được check in/out cho chính mình
 *
 * Sử dụng: router.use(withUserConnection, checkMaNVOwnership)
 */
const checkMaNVOwnership = (req, res, next) => {
  try {
    const userRole = req.user?.userInfo?.role;
    const tokenMaNV = req.user?.userInfo?.manv;
    const bodyMaNV = req.body?.maNV;

    const isAdmin = isAdminRole(userRole);

    console.log(
      `🔐 MaNV Ownership Check - Token MaNV: ${tokenMaNV}, Request MaNV: ${bodyMaNV}, isAdmin: ${isAdmin}`,
    );

    // Admin có quyền check in/out cho bất kỳ ai
    if (isAdmin) {
      return next();
    }

    // Nhân viên bình thường chỉ được check in/out cho chính mình
    if (!bodyMaNV) {
      return res.status(400).json({
        success: false,
        message: "Mã nhân viên (maNV) là bắt buộc trong request body",
      });
    }

    if (tokenMaNV !== bodyMaNV) {
      return res.status(403).json({
        success: false,
        message: `Bạn chỉ được phép check in/out cho chính mình. Mã NV của bạn: ${tokenMaNV}`,
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi kiểm tra quyền: " + error.message,
    });
  }
};

/**
 * Middleware kiểm tra quyền Quản lý hoặc Admin
 * Chấp nhận role: admin, quanly
 */
const requireManagerOrAdmin = (req, res, next) => {
  const userRole = req.user?.userInfo?.role;
  const normalizedRole = normalizeRole(userRole);

  if (normalizedRole !== "admin" && normalizedRole !== "quanly") {
    return res.status(403).json({
      success: false,
      message:
        "Bạn không có quyền truy cập tài nguyên này. Chỉ quản lý hoặc admin mới có thể.",
    });
  }

  next();
};

/**
 * Middleware kiểm tra MaNV trong params có trùng với token hay không
 * Chỉ cho phép user xem dữ liệu chấm công của chính mình
 */
const checkMaNVParamOwnership = (req, res, next) => {
  try {
    const tokenMaNV = req.user?.userInfo?.manv;
    const paramMaNV = req.params?.maNV;

    if (!paramMaNV) {
      return res.status(400).json({
        success: false,
        message: "Mã nhân viên (maNV) là bắt buộc trên đường dẫn API",
      });
    }

    if (tokenMaNV !== paramMaNV) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ được phép xem dữ liệu chấm công của chính mình",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi kiểm tra quyền: " + error.message,
    });
  }
};

/**
 * Middleware kiểm tra quyền truy cập theo MaNV trên params
 * Cho phép:
 * - Admin/Quản lý: xem dữ liệu của mọi nhân viên
 * - Nhân viên thường: chỉ xem dữ liệu của chính mình
 */
const checkMaNVParamOwnershipOrManagerAdmin = (req, res, next) => {
  try {
    const userRole = req.user?.userInfo?.role;
    const normalizedRole = normalizeRole(userRole);
    const tokenMaNV = req.user?.userInfo?.manv;
    const paramMaNV = req.params?.maNV;

    if (!paramMaNV) {
      return res.status(400).json({
        success: false,
        message: "Mã nhân viên (maNV) là bắt buộc trên đường dẫn API",
      });
    }

    if (normalizedRole === "admin" || normalizedRole === "quanly") {
      return next();
    }

    if (tokenMaNV !== paramMaNV) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ được phép xem dữ liệu chấm công của chính mình",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi kiểm tra quyền: " + error.message,
    });
  }
};

export {
  requireAdmin,
  checkAdminOrPass,
  checkMaNVOwnership,
  requireManagerOrAdmin,
  checkMaNVParamOwnership,
  checkMaNVParamOwnershipOrManagerAdmin,
};
