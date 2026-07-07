import chatService from "../services/chatService";
import userRepository from "../repositories/userRepository";
import fs from "fs";
import path from "path";
import { fileService } from "../services/fileService";

const resolveRequesterContext = async (req) => {
  const requesterMaNv = String(
    req.user?.userInfo?.MA_NV || req.user?.MA_NV || "",
  ).trim();
  const requesterRole = String(
    req.user?.userInfo?.role || req.user?.role || "",
  ).trim();

  if (requesterMaNv) {
    return { requesterMaNv, requesterRole };
  }

  const requesterEmail = String(
    req.user?.userEmail || req.user?.userInfo?.EMAIL || req.user?.EMAIL || "",
  ).trim();

  if (!requesterEmail) {
    return { requesterMaNv: "", requesterRole };
  }

  const userResult = await userRepository.getUserByEmail(requesterEmail);
  const user = userResult?.recordset?.[0];
  const fallbackMaNv = String(
    user?.MA_NV || user?.MANV || user?.MaNV || "",
  ).trim();

  return { requesterMaNv: fallbackMaNv, requesterRole };
};

const chatController = {
  getMyRooms: async (req, res) => {
    try {
      const { requesterMaNv } = await resolveRequesterContext(req);
      const result = await chatService.listMyRooms(requesterMaNv);
      console.log(
        "DEBUG getMyRooms returned:",
        result.data?.length,
        "rooms for",
        requesterMaNv,
      );
      if (result.data?.length > 0)
        console.log("DEBUG first room:", result.data[0]);
      return res.status(200).json(result);
    } catch (error) {
      console.error("DEBUG getMyRooms error:", error.message);
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  getOrCreateDirectRoom: async (req, res) => {
    try {
      const { requesterMaNv } = await resolveRequesterContext(req);
      const { targetMaNv } = req.body;
      console.log("DEBUG getOrCreateDirectRoom -> requesterMaNv:", requesterMaNv, "targetMaNv:", targetMaNv);
      const result = await chatService.getOrCreateDirectRoom(
        requesterMaNv,
        targetMaNv,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  getRoomMessages: async (req, res) => {
    try {
      const { requesterMaNv, requesterRole } =
        await resolveRequesterContext(req);
      const { roomId } = req.params;
      const { limit = 50 } = req.query;
      const result = await chatService.getRoomMessagesForMember(
        roomId,
        requesterMaNv,
        limit,
        requesterRole,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }
  },

  getLatestRoomMessage: async (req, res) => {
    try {
      const { requesterMaNv } = await resolveRequesterContext(req);
      const { roomId } = req.params;
      const result = await chatService.getLatestMessageForMember(
        roomId,
        requesterMaNv,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }
  },

  searchRoomMessages: async (req, res) => {
    try {
      const { requesterMaNv } = await resolveRequesterContext(req);
      const { roomId } = req.params;
      const { keyword } = req.query;
      const result = await chatService.searchMessagesForMember(
        roomId,
        requesterMaNv,
        keyword,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  sendMessage: async (req, res) => {
    try {
      const { requesterMaNv, requesterRole } =
        await resolveRequesterContext(req);
      const { roomId } = req.params;
      const { noiDung } = req.body;
      const result = await chatService.sendMessageToRoom(
        roomId,
        requesterMaNv,
        noiDung,
        null,
        null,
        requesterRole,
      );
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  createCustomGroup: async (req, res) => {
    try {
      const { requesterMaNv } = await resolveRequesterContext(req);
      const result = await chatService.createCustomGroup(
        requesterMaNv,
        req.body,
      );
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  addMemberToCustomGroup: async (req, res) => {
    try {
      const { requesterMaNv } = await resolveRequesterContext(req);
      const { roomId } = req.params;
      const { MA_NV } = req.body;
      const result = await chatService.addMemberToCustomGroup(
        roomId,
        requesterMaNv,
        MA_NV,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  removeMemberFromCustomGroup: async (req, res) => {
    try {
      const { requesterMaNv } = await resolveRequesterContext(req);
      const { roomId, memberId } = req.params;
      const result = await chatService.removeMemberFromCustomGroup(
        roomId,
        requesterMaNv,
        memberId,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  getOrCreateProjectRoom: async (req, res) => {
    try {
      const { requesterMaNv, requesterRole } =
        await resolveRequesterContext(req);
      const { projectId } = req.params;
      const result = await chatService.getOrCreateProjectRoomForMember(
        projectId,
        requesterMaNv,
        requesterRole,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }
  },

  getOrCreateDepartmentRoom: async (req, res) => {
    try {
      const { requesterMaNv } = await resolveRequesterContext(req);
      const { departmentId } = req.params;
      const isAdmin = req.isAdmin || false;
      const result = await chatService.getOrCreateDepartmentRoomForMember(
        departmentId,
        requesterMaNv,
        isAdmin,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }
  },

  editMessage: async (req, res) => {
    try {
      const { requesterMaNv } = await resolveRequesterContext(req);
      const { messageId } = req.params;
      const { noiDung } = req.body;
      const result = await chatService.editMessage(messageId, requesterMaNv, noiDung);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }
  },

  revokeMessage: async (req, res) => {
    try {
      const { requesterMaNv } = await resolveRequesterContext(req);
      const { messageId } = req.params;
      const result = await chatService.revokeMessage(messageId, requesterMaNv);
      
      // Delete file physically if it exists
      if (result.fileUrlToDelete) {
        try {
          if (result.fileUrlToDelete.startsWith("http")) {
            // Delete from MinIO via fileService
            await fileService.deleteFile(result.fileUrlToDelete);
          } else {
            // Delete from local uploads (backward compatibility)
            const filename = path.basename(result.fileUrlToDelete);
            const filepath = path.join(__dirname, "..", "uploads", filename);
            if (fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
            }
          }
        } catch (err) {
          console.error("Lỗi khi xóa file đính kèm:", err);
        }
      }
      return res.status(200).json(result);
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }
  },

  deleteMessageForMe: async (req, res) => {
    try {
      const { requesterMaNv } = await resolveRequesterContext(req);
      const { messageId } = req.params;
      const result = await chatService.deleteMessageForMe(messageId, requesterMaNv);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },
};

export default chatController;
