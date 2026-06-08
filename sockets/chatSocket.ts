import { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/jwtHelper";
import chatRepository from "../repositories/chatRepository";
import chatService from "../services/chatService";

type AuthenticatedSocket = Socket & {
  user?: {
    MA_NV: string;
    EMAIL?: string;
    role?: string;
  };
};

const ROOM_CHANNEL_PREFIX = "chat_room_";

const toRoomChannel = (maPhong: number | string) =>
  `${ROOM_CHANNEL_PREFIX}${String(maPhong)}`;

const extractAccessToken = (socket: Socket): string | null => {
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

const setupChatSocket = (io: Server) => {
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = extractAccessToken(socket);
      if (!token) {
        return next(new Error("Thiếu access token"));
      }

      const decoded: any = verifyToken(token);
      const MA_NV = String(decoded?.userInfo?.MA_NV || "").trim();
      if (!MA_NV) {
        return next(new Error("Token không chứa mã nhân viên hợp lệ"));
      }

      socket.user = {
        MA_NV,
        EMAIL: decoded?.userInfo?.EMAIL,
        role: decoded?.userInfo?.role,
      };

      return next();
    } catch (error: any) {
      return next(new Error(`Xác thực socket thất bại: ${error.message}`));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const requesterMaNv = socket.user?.MA_NV || "";
    const requesterRole = socket.user?.role || "";
    const normalizeRole = (value: string) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/\s+/g, "").trim();
    const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";

    socket.on("chat:join_room", async (payload, ack) => {
      try {
        const maPhong = Number(payload?.maPhong);
        if (!maPhong) {
          throw new Error("Mã phòng không hợp lệ");
        }

        const isMember = await chatRepository.isRoomMember(
          maPhong,
          requesterMaNv,
        );
        if (!isAdmin && !isMember) {
          throw new Error("Bạn không phải thành viên của phòng chat");
        }

        const channel = toRoomChannel(maPhong);
        await socket.join(channel);

        if (typeof ack === "function") {
          ack({ success: true, maPhong, channel });
        }
      } catch (error: any) {
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
      } catch (error: any) {
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

        const result = await chatService.sendMessageToRoom(
          maPhong,
          requesterMaNv,
          noiDung,
          fileUrl,
          fileType,
          requesterRole
        );

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
            SELECT MA_NV AS MaNV FROM THANH_VIEN_PHONG_CHAT WHERE MA_PHONG = @MaPhong AND MA_NV != '${requesterMaNv}'
          `);
          
          for (const member of members.recordset) {
            const notif = await createNotification(
              member.MaNV,
              "Tin nhắn mới",
              `Bạn có tin nhắn mới từ ${requesterMaNv}`,
              "chat_message",
              "/messages"
            );
            if (notif) emitNotification(member.MaNV, notif);
          }
        } catch (e) {
          console.error("Failed to push chat notification:", e);
        }

        if (typeof ack === "function") {
          ack({ success: true, data: outgoing });
        }
      } catch (error: any) {
        if (typeof ack === "function") {
          ack({ success: false, message: error.message });
        }
      }
    });
  });
};

export default setupChatSocket;
