import chatRepository from "../repositories/chatRepository";

const normalizeRole = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

const chatService = {
  listMyRooms: async (requesterMaNv) => {
    if (!requesterMaNv) {
      throw new Error("Không xác định được nhân viên gọi API.");
    }

    const data = await chatRepository.getMyRooms(requesterMaNv);
    return { success: true, data };
  },

  getOrCreateDirectRoom: async (requesterMaNv, targetMaNv) => {
    const sender = String(requesterMaNv || "").trim();
    const target = String(targetMaNv || "").trim();

    if (!sender || !target) {
      throw new Error("Thiếu mã nhân viên để tạo phòng chat cá nhân.");
    }

    if (sender === target) {
      throw new Error("Không thể tạo phòng chat cá nhân với chính mình.");
    }

    let room = await chatRepository.findDirectRoom(sender, target);
    if (!room) {
      room = await chatRepository.createDirectRoom(sender, target);
    }

    const members = await chatRepository.getRoomMembers(room.MaPhong);
    return { success: true, data: { ...room, thanhVien: members } };
  },

  getRoomMessagesForMember: async (roomId, requesterMaNv, limit, requesterRole) => {
    const maPhong = String(roomId || "").trim();
    if (!maPhong) {
      throw new Error("Mã phòng không hợp lệ.");
    }

    const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";
    const isMember = await chatRepository.isRoomMember(maPhong, requesterMaNv);
    if (!isAdmin && !isMember) {
      throw new Error("Bạn không phải thành viên của phòng chat.");
    }

    const room = await chatRepository.getRoomById(maPhong);
    const messages = await chatRepository.getRoomMessages(maPhong, limit);

    return {
      success: true,
      data: {
        room,
        messages,
      },
    };
  },

  getLatestMessageForMember: async (roomId, requesterMaNv) => {
    const maPhong = String(roomId || "").trim();
    if (!maPhong) {
      throw new Error("Mã phòng không hợp lệ.");
    }

    const isMember = await chatRepository.isRoomMember(maPhong, requesterMaNv);
    if (!isMember) {
      throw new Error("Bạn không phải thành viên của phòng chat.");
    }

    const message = await chatRepository.getLatestMessageByRoom(maPhong);
    return {
      success: true,
      data: message,
    };
  },

  searchMessagesForMember: async (roomId, requesterMaNv, keyword) => {
    const maPhong = String(roomId || "").trim();
    const tuKhoa = String(keyword || "").trim();

    if (!maPhong) {
      throw new Error("Mã phòng không hợp lệ.");
    }

    if (!tuKhoa) {
      throw new Error("Từ khóa tìm kiếm không được để trống.");
    }

    const isMember = await chatRepository.isRoomMember(maPhong, requesterMaNv);
    if (!isMember) {
      throw new Error("Bạn không phải thành viên của phòng chat.");
    }

    const messages = await chatRepository.searchMessagesByKeyword(
      maPhong,
      tuKhoa,
    );
    return {
      success: true,
      data: messages,
    };
  },

  sendMessageToRoom: async (roomId, requesterMaNv, noiDung, fileUrl = null, fileType = null, requesterRole = null) => {
    const maPhong = String(roomId || "").trim();
    const content = String(noiDung || "").trim();

    if (!maPhong) {
      throw new Error("Mã phòng không hợp lệ.");
    }

    if (!content && !fileUrl) {
      throw new Error("Nội dung tin nhắn không được để trống.");
    }

    const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";
    const isMember = await chatRepository.isRoomMember(maPhong, requesterMaNv);
    if (!isAdmin && !isMember) {
      throw new Error("Bạn không phải thành viên của phòng chat.");
    }

    const message = await chatRepository.sendMessage(
      maPhong,
      requesterMaNv,
      content,
      fileUrl,
      fileType
    );
    return {
      success: true,
      message: "Gửi tin nhắn thành công",
      data: message,
    };
  },

  createCustomGroup: async (requesterMaNv, payload) => {
    const tenPhong = String(payload?.tenPhong || "").trim();
    const memberIds = Array.isArray(payload?.memberIds)
      ? payload.memberIds.map((x) => String(x || "").trim()).filter(Boolean)
      : [];

    if (!tenPhong) {
      throw new Error("Tên nhóm chat là bắt buộc.");
    }

    const room = await chatRepository.createCustomGroupRoom(
      requesterMaNv,
      tenPhong,
      memberIds,
    );

    const members = await chatRepository.getRoomMembers(room.MaPhong);
    return {
      success: true,
      message: "Tạo nhóm chat thành công",
      data: { ...room, thanhVien: members },
    };
  },

  addMemberToCustomGroup: async (roomId, requesterMaNv, memberMaNv) => {
    const maPhong = String(roomId || "").trim();
    const target = String(memberMaNv || "").trim();

    if (!maPhong || !target) {
      throw new Error("Thiếu thông tin phòng hoặc nhân viên cần thêm.");
    }

    const room = await chatRepository.getRoomById(maPhong);
    if (!room || room.LoaiPhong !== chatRepository.ROOM_TYPE.GROUP) {
      throw new Error("Phòng chat không hợp lệ cho thao tác nhóm tự tạo.");
    }

    const role = await chatRepository.getRoomMemberRole(maPhong, requesterMaNv);
    if (normalizeRole(role) !== normalizeRole("Trưởng nhóm")) {
      throw new Error("Chỉ Trưởng nhóm mới được thêm thành viên.");
    }

    await chatRepository.addMemberIfNotExists(maPhong, target);
    return { success: true, message: "Thêm thành viên vào nhóm thành công" };
  },

  removeMemberFromCustomGroup: async (roomId, requesterMaNv, memberMaNv) => {
    const maPhong = String(roomId || "").trim();
    const target = String(memberMaNv || "").trim();

    if (!maPhong || !target) {
      throw new Error("Thiếu thông tin phòng hoặc nhân viên cần xóa.");
    }

    const room = await chatRepository.getRoomById(maPhong);
    if (!room || room.LoaiPhong !== chatRepository.ROOM_TYPE.GROUP) {
      throw new Error("Phòng chat không hợp lệ cho thao tác nhóm tự tạo.");
    }

    const role = await chatRepository.getRoomMemberRole(maPhong, requesterMaNv);
    if (normalizeRole(role) !== normalizeRole("Trưởng nhóm")) {
      throw new Error("Chỉ Trưởng nhóm mới được xóa thành viên.");
    }

    await chatRepository.removeMember(maPhong, target);
    return { success: true, message: "Xóa thành viên khỏi nhóm thành công" };
  },

  getOrCreateProjectRoomForMember: async (projectId, requesterMaNv, requesterRole) => {
    const MA_DA = Number(projectId);
    if (!MA_DA) {
      throw new Error("Mã dự án không hợp lệ.");
    }

    const isAdmin = normalizeRole(requesterRole) === "admin" || normalizeRole(requesterRole) === "giamdoc";
    const projectMembers = await chatRepository.getProjectMembers(MA_DA);
    if (!isAdmin && !projectMembers.includes(requesterMaNv)) {
      throw new Error("Bạn không thuộc dự án này.");
    }

    // Lấy tên dự án từ DB
    const project = await chatRepository.getProjectInfo(MA_DA);
    const TEN_DA = project?.TENDA || `Dự án #${MA_DA}`;

    const room = await chatRepository.getOrCreateReferenceRoom(
      chatRepository.ROOM_TYPE.PROJECT,
      String(MA_DA),
      `Dự án: ${TEN_DA}`,
    );

    for (const MA_NV of projectMembers) {
      await chatRepository.addMemberIfNotExists(room.MaPhong, MA_NV);
    }

    const members = await chatRepository.getRoomMembers(room.MaPhong);
    return { success: true, data: { ...room, thanhVien: members } };
  },

  getOrCreateDepartmentRoomForMember: async (
    departmentId,
    requesterMaNv,
    isAdmin = false,
  ) => {
    const maPhg = Number(departmentId);
    if (!maPhg) {
      throw new Error("Mã phòng ban không hợp lệ.");
    }

    const departmentMembers = await chatRepository.getDepartmentMembers(maPhg);
    // Nếu không phải admin thì check quyền
    if (!isAdmin && !departmentMembers.includes(requesterMaNv)) {
      throw new Error("Bạn không thuộc phòng ban này.");
    }

    // Lấy tên phòng ban từ DB
    const department = await chatRepository.getDepartmentInfo(maPhg);
    const tenPb = department?.TENPB || `Phòng ban #${maPhg}`;

    const room = await chatRepository.getOrCreateReferenceRoom(
      chatRepository.ROOM_TYPE.DEPARTMENT,
      String(maPhg),
      `Phòng ban: ${tenPb}`,
    );

    for (const MA_NV of departmentMembers) {
      await chatRepository.addMemberIfNotExists(room.MaPhong, MA_NV);
    }

    const members = await chatRepository.getRoomMembers(room.MaPhong);
    return { success: true, data: { ...room, thanhVien: members } };
  },

  ensureProjectRoomCreated: async (MA_DA, TEN_DA) => {
    const room = await chatRepository.getOrCreateReferenceRoom(
      chatRepository.ROOM_TYPE.PROJECT,
      String(MA_DA),
      TEN_DA ? `Dự án: ${TEN_DA}` : `Dự án #${MA_DA}`,
    );

    const members = await chatRepository.getProjectMembers(MA_DA);
    for (const MA_NV of members) {
      await chatRepository.addMemberIfNotExists(room.MaPhong, MA_NV);
    }

    return room;
  },

  ensureDepartmentRoomCreated: async (maPhg, tenPb) => {
    const room = await chatRepository.getOrCreateReferenceRoom(
      chatRepository.ROOM_TYPE.DEPARTMENT,
      String(maPhg),
      tenPb ? `Phòng ban: ${tenPb}` : `Phòng ban #${maPhg}`,
    );

    const members = await chatRepository.getDepartmentMembers(maPhg);
    for (const MA_NV of members) {
      await chatRepository.addMemberIfNotExists(room.MaPhong, MA_NV);
    }

    return room;
  },

  syncProjectMemberAdded: async (MA_DA, MA_NV, TEN_DA = null) => {
    const room = await chatRepository.getOrCreateReferenceRoom(
      chatRepository.ROOM_TYPE.PROJECT,
      String(MA_DA),
      TEN_DA ? `Dự án: ${TEN_DA}` : `Dự án #${MA_DA}`,
    );
    await chatRepository.addMemberIfNotExists(room.MaPhong, MA_NV);
  },

  syncProjectMemberRemoved: async (MA_DA, MA_NV) => {
    const room = await chatRepository.getOrCreateReferenceRoom(
      chatRepository.ROOM_TYPE.PROJECT,
      String(MA_DA),
      `Dự án #${MA_DA}`,
    );
    await chatRepository.removeMember(room.MaPhong, MA_NV);
  },
};

export default chatService;
