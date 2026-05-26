import { Server, Socket } from "socket.io";

const setupNotificationSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    socket.on("join_notification", (maNv: string) => {
      if (maNv) {
        socket.join(`user_${maNv}`);
        console.log(`User ${maNv} joined notification room user_${maNv}`);
      }
    });

    socket.on("disconnect", () => {
      // Automatic leave
    });
  });
};

export default setupNotificationSocket;
