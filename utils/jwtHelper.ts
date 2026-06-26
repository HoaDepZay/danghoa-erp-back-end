import jwt from "jsonwebtoken";

// Nên đưa SECRET_KEY vào biến môi trường (.env)
const SECRET_KEY = process.env.SECRET_KEY || "DoAn_BaoMat_RatCao";
const REFRESH_SECRET_KEY =
  process.env.REFRESH_SECRET_KEY || `${SECRET_KEY}_refresh`;
const ACCESS_TOKEN_EXPIRES_IN = (process.env.ACCESS_TOKEN_EXPIRES_IN ||
  "3h") as jwt.SignOptions["expiresIn"];
const REFRESH_TOKEN_EXPIRES_IN = (process.env.REFRESH_TOKEN_EXPIRES_IN ||
  "7d") as jwt.SignOptions["expiresIn"];

const createAccessPayload = (userData) => {
  return {
    userEmail: userData.EMAIL,
    userInfo: {
      MA_NV: userData.MA_NV || "",
      HO_TEN: userData.HO_TEN || "",
      EMAIL: userData.EMAIL || "",
      role: userData.role || "",
    },
  };
};

const signAccessToken = (payload) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};

// Hàm tạo Token (Sign)
const generateToken = (userData) => {
  // userData có thể là string (EMAIL) hoặc object với thông tin user
  if (typeof userData === "string") {
    userData = { EMAIL: userData };
  }

  const accessPayload = createAccessPayload(userData);
  return signAccessToken(accessPayload);
};

const generateRefreshToken = (accessPayload) => {
  return jwt.sign(
    {
      tokenType: "refresh",
      session: accessPayload,
    },
    REFRESH_SECRET_KEY,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN },
  );
};

const rotateTokens = (refreshToken, updatedSession = null) => {
  const decoded: any = jwt.verify(refreshToken, REFRESH_SECRET_KEY);

  if (decoded?.tokenType !== "refresh" || !decoded?.session?.userEmail) {
    throw new Error("Refresh token không hợp lệ");
  }

  const sessionToSign = updatedSession || decoded.session;

  const newAccessToken = signAccessToken(sessionToSign);
  const newRefreshToken = generateRefreshToken(sessionToSign);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

// Hàm xác thực Token (Verifysfrgsr) - dùng cho Middleware
const verifyToken = (token) => {
  return jwt.verify(token, SECRET_KEY);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET_KEY);
};

export {
  createAccessPayload,
  generateToken,
  generateRefreshToken,
  rotateTokens,
  verifyToken,
  verifyRefreshToken,
  SECRET_KEY, // Xuất ra nếu cần dùng ở middleware
  REFRESH_SECRET_KEY,
};
