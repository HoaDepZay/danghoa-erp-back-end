import jwt from "jsonwebtoken";
import "dotenv/config";

const SECRET_KEY = process.env.SECRET_KEY;

/**
 * Middleware xác thực Token JWT
 * Kiểm tra token hợp lệ và thiết lập req.user
 *
 * Sử dụng: router.use(withUserConnection)
 */
const withUserConnection = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Chưa đăng nhập!" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, SECRET_KEY!);

    // Kiểm tra tokenFormat - có thể token cũ không có userEmail
    if (!decoded.userEmail) {
      console.error(
        "❌ Token không chứa userEmail! Có thể token cũ hoặc sai format",
      );
      console.error("   Hãy đăng nhập lại để tạo token mới");
      throw new Error("Token format sai - hãy đăng nhập lại");
    }

    req.user = decoded; // Lưu info user để dùng
    next();
  } catch (err) {
    console.error("❌ Auth Error:", err.message);
    return res.status(403).json({
      error: "Token không hợp lệ hoặc đã hết hạn. " + err.message,
    });
  }
};

export { withUserConnection };
export default withUserConnection;
