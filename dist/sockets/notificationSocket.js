"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setupNotificationSocket = (io) => {
    io.on("connection", (socket) => {
        socket.on("join_notification", (maNv) => {
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
exports.default = setupNotificationSocket;
