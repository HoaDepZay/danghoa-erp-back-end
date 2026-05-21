"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withUserConnection = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_js_1 = __importDefault(require("crypto-js"));
require("dotenv/config");
const authHelper_1 = require("../utils/authHelper");
const SECRET_KEY = process.env.SECRET_KEY;
/**
 * Middleware xác thực Token JWT
 * Kiểm tra token hợp lệ và tạo connection string cho SQL Server
 *
 * Sử dụng: router.use(withUserConnection)
 */
const withUserConnection = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: "Chưa đăng nhập!" });
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        // DEBUG: Log toàn bộ decoded token để xem cấu trúc
        console.log("🔍 Decoded token structure:", JSON.stringify(decoded, null, 2));
        console.log("   - userEmail:", decoded.userEmail);
        console.log("   - userInfo:", decoded.userInfo);
        console.log("   - sqlPassEncrypted:", decoded.sqlPassEncrypted ? "✅ exists" : "❌ missing");
        // Kiểm tra tokenFormat - có thể token cũ không có userEmail
        if (!decoded.userEmail) {
            console.error("❌ Token không chứa userEmail! Có thể token cũ hoặc sai format");
            console.error("   Hãy đăng nhập lại để tạo token mới");
            throw new Error("Token format sai - hãy đăng nhập lại");
        }
        // Giải mã pass SQL từ token
        const decryptedBytes = crypto_js_1.default.AES.decrypt(decoded.sqlPassEncrypted, SECRET_KEY);
        const originalPassword = decryptedBytes.toString(crypto_js_1.default.enc.Utf8);
        const sqlAuthUser = (0, authHelper_1.buildAzureSqlAuthUser)(decoded.userEmail);
        // Tạo chuỗi kết nối động
        console.log("🔐 Creating connection string for user:", sqlAuthUser);
        const userConnStr = `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_NAME};UID=${sqlAuthUser};PWD=${originalPassword};Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=10;`;
        req.userConnectionString = userConnStr;
        req.user = decoded; // Lưu thêm info user để dùng nếu cần
        next();
    }
    catch (err) {
        console.error("❌ Auth Error:", err.message);
        return res.status(403).json({
            error: "Token không hợp lệ hoặc đã hết hạn. " + err.message,
        });
    }
};
exports.withUserConnection = withUserConnection;
exports.default = withUserConnection;
