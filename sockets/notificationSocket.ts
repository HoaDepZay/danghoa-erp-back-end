import { Server, Socket } from "socket.io";

const setupNotificationSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    socket.on("join_notification", (MA_NV: string) => {
      if (MA_NV) {
        socket.join(`user_${MA_NV}`);
        console.log(`User ${MA_NV} joined notification room user_${MA_NV}`);
      }
    });

    socket.on("disconnect", () => {
      // Automatic leave
    });
  });
};

export default setupNotificationSocket;
