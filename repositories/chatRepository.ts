import { appPool, sql } from "../config/db";

const ROOM_TYPE = {
  DIRECT: "Nhan vien",
  DEPARTMENT: "Phong ban",
  PROJECT: "Du an",
  GROUP: "Nhan vien",
};

// Generate random room reference ID for direct rooms and custom groups
const generateRandomRoomId = (): string => {
  return `ROOM_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const mapRoomRow = (row: any) => {
  if (!row) return null;
  return {
    MaPhong: row.MA_PHONG ?? row.MAPHONG ?? row.MaPhong,
    TenPhong: row.TEN_PHONG ?? row.TENPHONG ?? row.TenPhong,
    LoaiPhong: row.LOAI_PHONG ?? row.LOAIPHONG ?? row.LoaiPhong,
    NgayTao: row.NGAY_TAO ?? row.NGAYTAO ?? row.NgayTao,
  };
};

const chatRepository = {
  getMyRooms: async (MA_NV) => {
    const result = await appPool
      .request()
      .input("MA_NV", sql.VarChar(20), MA_NV)
      .execute("sp_getMyRooms");

    return result.recordset.map((row) => ({
      MaPhong: row.MA_PHONG ?? row.MAPHONG ?? row.MaPhong,
      TenPhong: row.TEN_PHONG ?? row.TENPHONG ?? row.TenPhong,
      LoaiPhong: row.LOAI_PHONG ?? row.LOAIPHONG ?? row.LoaiPhong,
      NgayTao: row.NGAY_TAO ?? row.NGAYTAO ?? row.NgayTao,
      SoThanhVien: row.SoThanhVien ?? row.SO_THANH_VIEN,
      TinNhanGanNhat: row.TinNhanGanNhat ?? row.TIN_NHAN_GAN_NHAT,
      HINH_DAI_DIEN: row.HINH_DAI_DIEN ?? row.HinhDaiDien,
    }));
  },

  isRoomMember: async (maPhong, MA_NV) => {
    const result = await appPool
      .request()
      .input("MA_PHG", sql.NVarChar(100), String(maPhong))
      .input("MA_NV", sql.VarChar(20), MA_NV)
      .execute("sp_isRoomMember");

    return result.recordset.length > 0;
  },

  getRoomById: async (maPhong) => {
    const result = await appPool
      .request()
      .input("MA_PHG", sql.NVarChar(100), String(maPhong))
      .execute("sp_getRoomById");

    return mapRoomRow(result.recordset[0]);
  },

  getRoomMessages: async (maPhong, limit = 50) => {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
    const result = await appPool
      .request()
      .input("MA_PHG", sql.NVarChar(100), String(maPhong))
      .input("Limit", sql.Int, safeLimit)
      .execute("sp_getRoomMessages");

    return result.recordset.reverse().map((row) => ({
      MaTN: row.MA_TN ?? row.MATN ?? row.MaTN,
      MaPhong: row.MA_PHONG ?? row.MAPHONG ?? row.MaPhong,
      MaNV_Gui: row.MANV_GUI ?? row.MaNV_Gui,
      TenNguoiGui: row.TenNguoiGui ?? row.TEN_NGUOI_GUI,
      NoiDung: row.NOI_DUNG ?? row.NOIDUNG ?? row.NoiDung,
      FileUrl: row.FILE_URL ?? row.FILEURL ?? row.FileUrl,
      FileType: row.FILE_TYPE ?? row.FILETYPE ?? row.FileType,
      ThoiGianGui: row.THOI_GIAN_GUI ?? row.THOIGIANGUI ?? row.ThoiGianGui,
      HINH_DAI_DIEN: row.HINH_DAI_DIEN ?? row.HinhDaiDien,
    }));
  },

  getLatestMessageByRoom: async (maPhong) => {
    const result = await appPool
      .request()
      .input("MAPHONG", sql.NVarChar(100), String(maPhong))
      .execute("sp_getLatestMessageByRoom");

    return result.recordset[0] || null;
  },

  searchMessagesByKeyword: async (maPhong, tuKhoa) => {
    const result = await appPool
      .request()
      .input("MAPHONG", sql.NVarChar(100), String(maPhong))
      .input("TUKHOA", sql.NVarChar(sql.MAX), tuKhoa)
      .execute("sp_searchMessagesByKeyword");

    return result.recordset.map((row) => ({
      MaTN: row.MA_TN ?? row.MATN ?? row.MaTN,
      MaPhong: row.MA_PHONG ?? row.MAPHONG ?? row.MaPhong,
      MaNV_Gui: row.MANV_GUI ?? row.MaNV_Gui,
      NoiDung: row.NOI_DUNG ?? row.NOIDUNG ?? row.NoiDung,
      FileUrl: row.FILE_URL ?? row.FILEURL ?? row.FileUrl,
      FileType: row.FILE_TYPE ?? row.FILETYPE ?? row.FileType,
      ThoiGianGui: row.THOI_GIAN_GUI ?? row.THOIGIANGUI ?? row.ThoiGianGui,
    }));
  },

  sendMessage: async (maPhong, maNvGui, noiDung, fileUrl: string | null = null, fileType: string | null = null) => {
    const result = await appPool
      .request()
      .input("MA_PHG", sql.NVarChar(100), String(maPhong))
      .input("MaNV_Gui", sql.VarChar(20), maNvGui)
      .input("NOI_DUNG", sql.NVarChar(sql.MAX), noiDung)
      .input("FILE_URL", sql.NVarChar(sql.MAX), fileUrl)
      .input("FILE_TYPE", sql.VarChar(100), fileType)
      .execute("sp_sendMessage");

    const row = result.recordset[0];
    if (!row) return null;

    let hinhDaiDien = null;
    let tenNguoiGui = null;
    try {
      const userRes = await appPool.request().input("MaNV", sql.VarChar(20), maNvGui).query("SELECT HO_TEN, HINH_DAI_DIEN FROM NHAN_VIEN WHERE MA_NV = @MaNV");
      if (userRes.recordset[0]) {
        hinhDaiDien = userRes.recordset[0].HINH_DAI_DIEN;
        tenNguoiGui = userRes.recordset[0].HO_TEN;
      }
    } catch (err) {
      console.error("Error fetching user info for new message:", err);
    }

    return {
      MaTN: row.MA_TN ?? row.MATN ?? row.MaTN,
      MaPhong: row.MA_PHONG ?? row.MAPHONG ?? row.MaPhong,
      MaNV_Gui: row.MANV_GUI ?? row.MaNV_Gui,
      TenNguoiGui: row.TenNguoiGui ?? row.TEN_NGUOI_GUI ?? tenNguoiGui,
      NoiDung: row.NOI_DUNG ?? row.NOIDUNG ?? row.NoiDung,
      ThoiGianGui: row.THOI_GIAN_GUI ?? row.THOIGIANGUI ?? row.ThoiGianGui,
      FileUrl: row.FILE_URL ?? row.FILEURL ?? row.FileUrl ?? null,
      FileType: row.FILE_TYPE ?? row.FILETYPE ?? row.FileType ?? null,
      HINH_DAI_DIEN: row.HINH_DAI_DIEN ?? row.HinhDaiDien ?? hinhDaiDien,
    };
  },

  getRoomMembers: async (maPhong) => {
    const result = await appPool
      .request()
      .input("MAPHONG", sql.NVarChar(100), String(maPhong))
      .execute("sp_getRoomMembers");

    return result.recordset;
  },

  findDirectRoom: async (maNvA, maNvB) => {
    const result = await appPool
      .request()
      .input("MANVA", sql.VarChar(20), maNvA)
      .input("MANVB", sql.VarChar(20), maNvB)
      .input("LOAIPHONG", sql.NVarChar(20), ROOM_TYPE.DIRECT)
      .execute("sp_findDirectRoom");

    return mapRoomRow(result.recordset[0]);
  },

  createDirectRoom: async (maNvA, maNvB) => {
    const maThamChieu = generateRandomRoomId();
    const result = await appPool
      .request()
      .input("MANVA", sql.VarChar(20), maNvA)
      .input("MANVB", sql.VarChar(20), maNvB)
      .input("LOAIPHONG", sql.NVarChar(20), ROOM_TYPE.DIRECT)
      .input("MAPHONG", sql.NVarChar(100), maThamChieu)
      .execute("sp_createDirectRoom");

    return mapRoomRow(result.recordset[0]);
  },

  getOrCreateReferenceRoom: async (roomType, maThamChieu, tenPhong = null) => {
    // MA_PHONG format: 'PB{id}' for department, 'DA{id}' for project
    const maPhong = roomType === ROOM_TYPE.DEPARTMENT
      ? `PB${maThamChieu}`
      : roomType === ROOM_TYPE.PROJECT
      ? `DA${maThamChieu}`
      : String(maThamChieu);
    const result = await appPool
      .request()
      .input("LOAIPHONG", sql.NVarChar(20), roomType)
      .input("MAPHONG", sql.NVarChar(100), maPhong)
      .input("TENPHONG", sql.NVarChar(255), tenPhong)
      .execute("sp_getOrCreateReferenceRoom");

    return mapRoomRow(result.recordset[0]);
  },

  addMemberIfNotExists: async (maPhong, MA_NV, vaiTro = "Thanh vien") => {
    await appPool
      .request()
      .input("MAPHONG", sql.NVarChar(100), String(maPhong))
      .input("MANV", sql.VarChar(20), MA_NV)
      .input("VAITRO", sql.NVarChar(50), vaiTro)
      .execute("sp_addRoomMember");
  },

  removeMember: async (maPhong, MA_NV) => {
    await appPool
      .request()
      .input("MAPHONG", sql.NVarChar(100), String(maPhong))
      .input("MANV", sql.VarChar(20), MA_NV)
      .execute("sp_removeRoomMember");
  },

  getDepartmentMembers: async (maPhg) => {
    const result = await appPool
      .request()
      .input("MAPHG", sql.Int, maPhg)
      .execute("sp_getDepartmentMembers");

    return result.recordset.map((r) => r.MANV ?? r.MA_NV ?? r.MaNV).filter(Boolean);
  },

  getProjectMembers: async (MA_DA) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .execute("sp_getProjectMembersSimple");

    return result.recordset.map((r) => r.MaNV ?? r.MA_NV ?? r.MANV).filter(Boolean);
  },

  getProjectInfo: async (MA_DA) => {
    const result = await appPool
      .request()
      .input("MADA", sql.Int, MA_DA)
      .execute("sp_getProjectInfo");

    return result.recordset[0] || null;
  },

  getDepartmentInfo: async (maPhg) => {
    const result = await appPool
      .request()
      .input("MAPHG", sql.Int, maPhg)
      .execute("sp_getDepartmentInfo");

    return result.recordset[0] || null;
  },

  createCustomGroupRoom: async (creatorMaNv, tenPhong, memberIds = []) => {
    const maThamChieu = generateRandomRoomId();
    const uniqueMembers = Array.from(
      new Set(memberIds.filter(Boolean))
    );
    const memberIdsStr = uniqueMembers.join(",");

    const result = await appPool
      .request()
      .input("CREATORMANV", sql.VarChar(20), creatorMaNv)
      .input("TENPHONG", sql.NVarChar(255), tenPhong)
      .input("MATHAMCHIEU", sql.VarChar(50), maThamChieu)
      .input("MEMBERIDS", sql.NVarChar(sql.MAX), memberIdsStr)
      .execute("sp_createCustomGroupRoom");

    return mapRoomRow(result.recordset[0]);
  },

  getRoomMemberRole: async (maPhong, MA_NV) => {
    const result = await appPool
      .request()
      .input("MAPHONG", sql.NVarChar(100), String(maPhong))
      .input("MANV", sql.VarChar(20), MA_NV)
      .execute("sp_getRoomMemberRole");

    return result.recordset[0]?.VaiTro || null;
  },

  ROOM_TYPE,
};

export default chatRepository;
