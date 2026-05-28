"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jwtHelper_1 = require("../utils/jwtHelper");
const chatRepository_1 = __importDefault(require("../repositories/chatRepository"));
const chatService_1 = __importDefault(require("../services/chatService"));
const ROOM_CHANNEL_PREFIX = "chat_room_";
const toRoomChannel = (maPhong) => `${ROOM_CHANNEL_PREFIX}${String(maPhong)}`;
const extractAccessToken = (socket) => {
    const fromAuth = socket.handshake.auth?.token;
    if (typeof fromAuth === "string" && fromAuth.trim()) {
        return fromAuth.trim();
    }
    const authHeader = socket.handshake.headers?.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        return authHeader.slice(7).trim();
    }
    return null;
};
const setupChatSocket = (io) => {
    io.use((socket, next) => {
        try {
            const token = extractAccessToken(socket);
            if (!token) {
                return next(new Error("Thiếu access token"));
            }
            const decoded = (0, jwtHelper_1.verifyToken)(token);
            const manv = String(decoded?.userInfo?.manv || "").trim();
            if (!manv) {
                return next(new Error("Token không chứa mã nhân viên hợp lệ"));
            }
            socket.user = {
                manv,
                email: decoded?.userInfo?.email,
                role: decoded?.userInfo?.role,
            };
            return next();
        }
        catch (error) {
            return next(new Error(`Xác thực socket thất bại: ${error.message}`));
        }
    });
    io.on("connection", (socket) => {
        const requesterMaNv = socket.user?.manv || "";
        socket.on("chat:join_room", async (payload, ack) => {
            try {
                const maPhong = Number(payload?.maPhong);
                if (!maPhong) {
                    throw new Error("Mã phòng không hợp lệ");
                }
                const isMember = await chatRepository_1.default.isRoomMember(maPhong, requesterMaNv);
                if (!isMember) {
                    throw new Error("Bạn không phải thành viên của phòng chat");
                }
                const channel = toRoomChannel(maPhong);
                await socket.join(channel);
                if (typeof ack === "function") {
                    ack({ success: true, maPhong, channel });
                }
            }
            catch (error) {
                if (typeof ack === "function") {
                    ack({ success: false, message: error.message });
                }
            }
        });
        socket.on("chat:leave_room", async (payload, ack) => {
            try {
                const maPhong = Number(payload?.maPhong);
                if (!maPhong) {
                    throw new Error("Mã phòng không hợp lệ");
                }
                await socket.leave(toRoomChannel(maPhong));
                if (typeof ack === "function") {
                    ack({ success: true, maPhong });
                }
            }
            catch (error) {
                if (typeof ack === "function") {
                    ack({ success: false, message: error.message });
                }
            }
        });
        socket.on("chat:send_message", async (payload, ack) => {
            try {
                const maPhong = Number(payload?.maPhong);
                const noiDung = String(payload?.noiDung || "");
                const fileUrl = payload?.fileUrl || null;
                const fileType = payload?.fileType || null;
                const result = await chatService_1.default.sendMessageToRoom(maPhong, requesterMaNv, noiDung, fileUrl, fileType);
                const message = result?.data;
                if (!message) {
                    throw new Error("Không thể gửi tin nhắn");
                }
                const outgoing = {
                    ...message,
                    maPhong,
                    maNvGui: requesterMaNv,
                };
                io.to(toRoomChannel(maPhong)).emit("chat:new_message", outgoing);
                // Notify other room members
                try {
                    const { appPool } = require("../config/db");
                    const { createNotification } = require("../controllers/notificationController");
                    const { emitNotification } = require("../server");
                    const members = await appPool.request().input("MaPhong", maPhong).query(`
            SELECT MaNV FROM THANH_VIEN_PHONG WHERE MaPhong = @MaPhong AND MaNV != '${requesterMaNv}'
          `);
                    for (const member of members.recordset) {
                        const notif = await createNotification(member.MaNV, "Tin nhắn mới", `Bạn có tin nhắn mới từ ${requesterMaNv}`, "chat_message", "/messages");
                        if (notif)
                            emitNotification(member.MaNV, notif);
                    }
                }
                catch (e) {
                    console.error("Failed to push chat notification:", e);
                }
                if (typeof ack === "function") {
                    ack({ success: true, data: outgoing });
                }
            }
            catch (error) {
                if (typeof ack === "function") {
                    ack({ success: false, message: error.message });
                }
            }
        });
    });
};
exports.default = setupChatSocket;
