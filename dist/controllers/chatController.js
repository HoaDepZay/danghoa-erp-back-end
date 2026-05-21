"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chatService_1 = __importDefault(require("../services/chatService"));
const chatController = {
    getMyRooms: async (req, res) => {
        try {
            const requesterMaNv = req.user?.userInfo?.manv;
            const result = await chatService_1.default.listMyRooms(requesterMaNv);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    getOrCreateDirectRoom: async (req, res) => {
        try {
            const requesterMaNv = req.user?.userInfo?.manv;
            const { targetMaNv } = req.body;
            const result = await chatService_1.default.getOrCreateDirectRoom(requesterMaNv, targetMaNv);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    getRoomMessages: async (req, res) => {
        try {
            const requesterMaNv = req.user?.userInfo?.manv;
            const { roomId } = req.params;
            const { limit = 50 } = req.query;
            const result = await chatService_1.default.getRoomMessagesForMember(roomId, requesterMaNv, limit);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(403).json({ success: false, message: error.message });
        }
    },
    getLatestRoomMessage: async (req, res) => {
        try {
            const requesterMaNv = req.user?.userInfo?.manv;
            const { roomId } = req.params;
            const result = await chatService_1.default.getLatestMessageForMember(roomId, requesterMaNv);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(403).json({ success: false, message: error.message });
        }
    },
    searchRoomMessages: async (req, res) => {
        try {
            const requesterMaNv = req.user?.userInfo?.manv;
            const { roomId } = req.params;
            const { keyword } = req.query;
            const result = await chatService_1.default.searchMessagesForMember(roomId, requesterMaNv, keyword);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    sendMessage: async (req, res) => {
        try {
            const requesterMaNv = req.user?.userInfo?.manv;
            const { roomId } = req.params;
            const { noiDung } = req.body;
            const result = await chatService_1.default.sendMessageToRoom(roomId, requesterMaNv, noiDung);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    createCustomGroup: async (req, res) => {
        try {
            const requesterMaNv = req.user?.userInfo?.manv;
            const result = await chatService_1.default.createCustomGroup(requesterMaNv, req.body);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    addMemberToCustomGroup: async (req, res) => {
        try {
            const requesterMaNv = req.user?.userInfo?.manv;
            const { roomId } = req.params;
            const { maNv } = req.body;
            const result = await chatService_1.default.addMemberToCustomGroup(roomId, requesterMaNv, maNv);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    removeMemberFromCustomGroup: async (req, res) => {
        try {
            const requesterMaNv = req.user?.userInfo?.manv;
            const { roomId, memberId } = req.params;
            const result = await chatService_1.default.removeMemberFromCustomGroup(roomId, requesterMaNv, memberId);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },
    getOrCreateProjectRoom: async (req, res) => {
        try {
            const requesterMaNv = req.user?.userInfo?.manv;
            const { projectId } = req.params;
            const result = await chatService_1.default.getOrCreateProjectRoomForMember(projectId, requesterMaNv);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(403).json({ success: false, message: error.message });
        }
    },
    getOrCreateDepartmentRoom: async (req, res) => {
        try {
            const requesterMaNv = req.user?.userInfo?.manv;
            const { departmentId } = req.params;
            const isAdmin = req.isAdmin || false;
            const result = await chatService_1.default.getOrCreateDepartmentRoomForMember(departmentId, requesterMaNv, isAdmin);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(403).json({ success: false, message: error.message });
        }
    },
};
exports.default = chatController;
