import { normalizeRole, isAdminRole } from "../utils/authHelper";

/**
 * Middleware kiểm tra quyền Giám đốc hoặc Admin
 * Chỉ cho phép user có role = admin hoặc giamdoc
 */
const requireDirectorOrAdmin = (req, res, next) => {
  const userRole = req.user?.userInfo?.role;
  const normalizedRole = normalizeRole(userRole);

  if (normalizedRole !== "admin" && normalizedRole !== "giamdoc") {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập tài nguyên này. Chỉ Giám đốc hoặc Admin mới có thể.",
    });
  }

  next();
};

/**
 * Middleware kiểm tra quyền Trưởng phòng
 * Cho phép: admin, giamdoc, truongphong
 */
const requireDepartmentHead = (req, res, next) => {
  const userRole = req.user?.userInfo?.role;
  const normalizedRole = normalizeRole(userRole);

  if (normalizedRole !== "admin" && normalizedRole !== "giamdoc" && normalizedRole !== "truongphong") {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập tài nguyên này. Chỉ Trưởng phòng trở lên mới có thể.",
    });
  }

  next();
};

/**
 * Middleware kiểm tra quyền Admin
 * Chỉ cho phép user có role = admin
 */
const requireAdmin = (req, res, next) => {
  const userRole = req.user?.userInfo?.role;
  const normalizedRole = normalizeRole(userRole);

  if (normalizedRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập tài nguyên này. Chỉ Admin mới có thể quản lý tài khoản.",
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
    const tokenMaNV = req.user?.userInfo?.MA_NV || req.user?.userInfo?.manv;
    const bodyMaNV = req.body?.MA_NV || req.body?.maNV;

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
        message: "Mã nhân viên (MA_NV) là bắt buộc trong request body",
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

  if (
    normalizedRole !== "admin" &&
    normalizedRole !== "quanly" &&
    normalizedRole !== "giamdoc"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Bạn không có quyền truy cập tài nguyên này. Chỉ quản lý hoặc admin mới có thể.",
    });
  }

  next();
};

/**
 * Middleware kiểm tra quyền Trưởng phòng hoặc Giám đốc
 * Chấp nhận role: admin, giamdoc, truongphong
 */
const requireProjectCreator = (req, res, next) => {
  const userRole = req.user?.userInfo?.role;
  const normalizedRole = normalizeRole(userRole);

  if (
    normalizedRole !== "admin" &&
    normalizedRole !== "giamdoc" &&
    normalizedRole !== "truongphong" &&
    normalizedRole !== "phophong" &&
    normalizedRole !== "phoduan"
  ) {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền tạo dự án. Chỉ Giám đốc, Trưởng/Phó phòng hoặc Phó dự án mới có thể thực hiện.",
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
    const tokenMaNV = req.user?.userInfo?.MA_NV || req.user?.userInfo?.manv;
    const paramMaNV = req.params?.MA_NV || req.params?.maNV || req.params?.id;

    if (!paramMaNV) {
      return res.status(400).json({
        success: false,
        message: "Mã nhân viên (MA_NV) là bắt buộc trên đường dẫn API",
      });
    }

    if (tokenMaNV !== paramMaNV) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ được phép xem dữ liệu của chính mình",
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
    const tokenMaNV = req.user?.userInfo?.MA_NV || req.user?.userInfo?.manv;
    const paramMaNV = req.params?.MA_NV || req.params?.maNV || req.params?.id;

    if (!paramMaNV) {
      return res.status(400).json({
        success: false,
        message: "Mã nhân viên (MA_NV) là bắt buộc trên đường dẫn API",
      });
    }

    if (
      normalizedRole === "admin" ||
      normalizedRole === "quanly" ||
      normalizedRole === "giamdoc"
    ) {
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

/**
 * Middleware kiểm tra quyền truy cập theo MaNV trên params
 * Cho phép:
 * - Admin/Giám đốc: xem dữ liệu của mọi nhân viên
 * - Nhân viên thường: chỉ xem dữ liệu của chính mình
 */
const checkMaNVParamOwnershipOrDirectorAdmin = (req, res, next) => {
  try {
    const userRole = req.user?.userInfo?.role;
    const normalizedRole = normalizeRole(userRole);
    const tokenMaNV = req.user?.userInfo?.MA_NV || req.user?.userInfo?.manv;
    const paramMaNV = req.params?.MA_NV || req.params?.maNV || req.params?.id;

    if (!paramMaNV) {
      return res.status(400).json({
        success: false,
        message: "Mã nhân viên (MA_NV) là bắt buộc trên đường dẫn API",
      });
    }

    if (normalizedRole === "admin" || normalizedRole === "giamdoc") {
      return next();
    }

    if (tokenMaNV !== paramMaNV) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ được phép xem dữ liệu của chính mình",
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
  requireDirectorOrAdmin,
  requireDepartmentHead,
  checkAdminOrPass,
  checkMaNVOwnership,
  requireManagerOrAdmin,
  requireProjectCreator,
  checkMaNVParamOwnership,
  checkMaNVParamOwnershipOrManagerAdmin,
  checkMaNVParamOwnershipOrDirectorAdmin,
};
