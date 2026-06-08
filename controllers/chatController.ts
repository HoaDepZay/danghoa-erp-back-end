import chatService from "../services/chatService";

const chatController = {
  getMyRooms: async (req, res) => {
    try {
      const requesterMaNv = req.user?.userInfo?.MA_NV;
      const result = await chatService.listMyRooms(requesterMaNv);
      console.log("DEBUG getMyRooms returned:", result.data?.length, "rooms for", requesterMaNv);
      if (result.data?.length > 0) console.log("DEBUG first room:", result.data[0]);
      return res.status(200).json(result);
    } catch (error) {
      console.error("DEBUG getMyRooms error:", error.message);
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  getOrCreateDirectRoom: async (req, res) => {
    try {
      const requesterMaNv = req.user?.userInfo?.MA_NV;
      const { targetMaNv } = req.body;
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
      const requesterMaNv = req.user?.userInfo?.MA_NV;
      const requesterRole = req.user?.userInfo?.role;
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
      const requesterMaNv = req.user?.userInfo?.MA_NV;
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
      const requesterMaNv = req.user?.userInfo?.MA_NV;
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
      const requesterMaNv = req.user?.userInfo?.MA_NV;
      const requesterRole = req.user?.userInfo?.role;
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
      const requesterMaNv = req.user?.userInfo?.MA_NV;
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
      const requesterMaNv = req.user?.userInfo?.MA_NV;
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
      const requesterMaNv = req.user?.userInfo?.MA_NV;
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
      const requesterMaNv = req.user?.userInfo?.MA_NV;
      const requesterRole = req.user?.userInfo?.role;
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
      const requesterMaNv = req.user?.userInfo?.MA_NV;
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
};

export default chatController;
