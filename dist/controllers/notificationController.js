"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.markAsRead = exports.getNotifications = void 0;
const db_1 = require("../config/db");
const getNotifications = async (req, res) => {
    try {
        const maNv = req.user?.userInfo?.manv || req.user?.manv;
        if (!maNv) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const result = await db_1.appPool.request()
            .input("MaNV", maNv)
            .execute("sp_getNotifications");
        res.json(result.recordset);
    }
    catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const maNv = req.user?.userInfo?.manv || req.user?.manv;
        const { id } = req.params;
        if (!maNv) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const result = await db_1.appPool.request()
            .input("MaTB", Number(id))
            .input("MaNV", maNv)
            .execute("sp_markNotificationRead");
        res.json({ message: "Đã đánh dấu đọc", notification: result.recordset[0] });
    }
    catch (error) {
        console.error("Mark read error:", error);
        res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
    }
};
exports.markAsRead = markAsRead;
// Helper function for backend to create notification programmatically
const createNotification = async (maNv, tieuDe, noiDung, loai, link = "") => {
    try {
        const result = await db_1.appPool.request()
            .input("MaNV", maNv)
            .input("TieuDe", tieuDe)
            .input("NoiDung", noiDung)
            .input("Loai", loai)
            .input("Link", link)
            .execute("sp_createNotification");
        return result.recordset[0];
    }
    catch (error) {
        console.error("Error creating notification:", error);
        return null;
    }
};
exports.createNotification = createNotification;
