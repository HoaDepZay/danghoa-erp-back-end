"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const ROOM_TYPE = {
    DIRECT: 1,
    DEPARTMENT: 2,
    PROJECT: 3,
    GROUP: 4,
};
// Generate random room reference ID for direct rooms and custom groups
const generateRandomRoomId = () => {
    return `ROOM_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};
const chatRepository = {
    getMyRooms: async (maNv) => {
        const result = await db_1.appPool
            .request()
            .input("MaNV", db_1.sql.VarChar(20), maNv)
            .execute("sp_getMyRooms");
        return result.recordset.map((row) => ({
            MaPhong: row.MAPHONG ?? row.MaPhong,
            TenPhong: row.TENPHONG ?? row.TenPhong,
            LoaiPhong: row.LOAIPHONG ?? row.LoaiPhong,
            MaThamChieu: row.MATHAMCHIEU ?? row.MaThamChieu,
            NgayTao: row.NGAYTAO ?? row.NgayTao,
            SoThanhVien: row.SoThanhVien,
            TinNhanGanNhat: row.TinNhanGanNhat,
        }));
    },
    isRoomMember: async (maPhong, maNv) => {
        const result = await db_1.appPool
            .request()
            .input("MaPhong", db_1.sql.Int, maPhong)
            .input("MaNV", db_1.sql.VarChar(20), maNv)
            .execute("sp_isRoomMember");
        return result.recordset.length > 0;
    },
    getRoomById: async (maPhong) => {
        const result = await db_1.appPool
            .request()
            .input("MaPhong", db_1.sql.Int, maPhong)
            .execute("sp_getRoomById");
        const row = result.recordset[0];
        if (!row)
            return null;
        return {
            MaPhong: row.MAPHONG ?? row.MaPhong,
            TenPhong: row.TENPHONG ?? row.TenPhong,
            LoaiPhong: row.LOAIPHONG ?? row.LoaiPhong,
            MaThamChieu: row.MATHAMCHIEU ?? row.MaThamChieu,
            NgayTao: row.NGAYTAO ?? row.NgayTao,
        };
    },
    getRoomMessages: async (maPhong, limit = 50) => {
        const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
        const result = await db_1.appPool
            .request()
            .input("MaPhong", db_1.sql.Int, maPhong)
            .input("Limit", db_1.sql.Int, safeLimit)
            .execute("sp_getRoomMessages");
        return result.recordset.reverse().map((row) => ({
            MaTN: row.MATN ?? row.MaTN,
            MaPhong: row.MAPHONG ?? row.MaPhong,
            MaNV_Gui: row.MANV_GUI ?? row.MaNV_Gui,
            TenNguoiGui: row.TenNguoiGui,
            NoiDung: row.NOIDUNG ?? row.NoiDung,
            ThoiGianGui: row.THOIGIANGUI ?? row.ThoiGianGui,
        }));
    },
    getLatestMessageByRoom: async (maPhong) => {
        const result = await db_1.appPool
            .request()
            .input("MAPHONG", db_1.sql.Int, maPhong)
            .execute("sp_getLatestMessageByRoom");
        return result.recordset[0] || null;
    },
    searchMessagesByKeyword: async (maPhong, tuKhoa) => {
        const result = await db_1.appPool
            .request()
            .input("MAPHONG", db_1.sql.Int, maPhong)
            .input("TUKHOA", db_1.sql.NVarChar(db_1.sql.MAX), tuKhoa)
            .execute("sp_searchMessagesByKeyword");
        return result.recordset.map((row) => ({
            MaTN: row.MATN ?? row.MaTN,
            MaPhong: row.MAPHONG ?? row.MaPhong,
            MaNV_Gui: row.MANV_GUI ?? row.MaNV_Gui,
            NoiDung: row.NOIDUNG ?? row.NoiDung,
            ThoiGianGui: row.THOIGIANGUI ?? row.ThoiGianGui,
        }));
    },
    sendMessage: async (maPhong, maNvGui, noiDung, fileUrl = null, fileType = null) => {
        const result = await db_1.appPool
            .request()
            .input("MaPhong", db_1.sql.Int, maPhong)
            .input("MaNV_Gui", db_1.sql.VarChar(20), maNvGui)
            .input("NoiDung", db_1.sql.NVarChar(db_1.sql.MAX), noiDung)
            .input("FileUrl", db_1.sql.NVarChar(db_1.sql.MAX), fileUrl)
            .input("FileType", db_1.sql.VarChar(50), fileType)
            .execute("sp_sendMessage");
        const row = result.recordset[0];
        if (!row)
            return null;
        return {
            MaTN: row.MATN ?? row.MaTN,
            MaPhong: row.MAPHONG ?? row.MaPhong,
            MaNV_Gui: row.MANV_GUI ?? row.MaNV_Gui,
            NoiDung: row.NOIDUNG ?? row.NoiDung,
            ThoiGianGui: row.THOIGIANGUI ?? row.ThoiGianGui,
            FileUrl: row.FILEURL ?? row.FileUrl ?? null,
            FileType: row.FILETYPE ?? row.FileType ?? null,
        };
    },
    getRoomMembers: async (maPhong) => {
        const result = await db_1.appPool
            .request()
            .input("MAPHONG", db_1.sql.Int, maPhong)
            .execute("sp_getRoomMembers");
        return result.recordset;
    },
    findDirectRoom: async (maNvA, maNvB) => {
        const result = await db_1.appPool
            .request()
            .input("MANVA", db_1.sql.VarChar(20), maNvA)
            .input("MANVB", db_1.sql.VarChar(20), maNvB)
            .input("LOAIPHONG", db_1.sql.TinyInt, ROOM_TYPE.DIRECT)
            .execute("sp_findDirectRoom");
        return result.recordset[0] || null;
    },
    createDirectRoom: async (maNvA, maNvB) => {
        const maThamChieu = generateRandomRoomId();
        const result = await db_1.appPool
            .request()
            .input("MANVA", db_1.sql.VarChar(20), maNvA)
            .input("MANVB", db_1.sql.VarChar(20), maNvB)
            .input("LOAIPHONG", db_1.sql.TinyInt, ROOM_TYPE.DIRECT)
            .input("MATHAMCHIEU", db_1.sql.VarChar(50), maThamChieu)
            .execute("sp_createDirectRoom");
        return result.recordset[0] || null;
    },
    getOrCreateReferenceRoom: async (roomType, maThamChieu, tenPhong = null) => {
        const result = await db_1.appPool
            .request()
            .input("LOAIPHONG", db_1.sql.TinyInt, roomType)
            .input("MATHAMCHIEU", db_1.sql.VarChar(50), String(maThamChieu))
            .input("TENPHONG", db_1.sql.NVarChar(255), tenPhong)
            .execute("sp_getOrCreateReferenceRoom");
        return result.recordset[0] || null;
    },
    addMemberIfNotExists: async (maPhong, maNv, vaiTro = "Thành viên") => {
        await db_1.appPool
            .request()
            .input("MAPHONG", db_1.sql.Int, maPhong)
            .input("MANV", db_1.sql.VarChar(20), maNv)
            .input("VAITRO", db_1.sql.NVarChar(50), vaiTro)
            .execute("sp_addRoomMember");
    },
    removeMember: async (maPhong, maNv) => {
        await db_1.appPool
            .request()
            .input("MAPHONG", db_1.sql.Int, maPhong)
            .input("MANV", db_1.sql.VarChar(20), maNv)
            .execute("sp_removeRoomMember");
    },
    getDepartmentMembers: async (maPhg) => {
        const result = await db_1.appPool
            .request()
            .input("MAPHG", db_1.sql.Int, maPhg)
            .execute("sp_getDepartmentMembers");
        return result.recordset.map((r) => r.MANV);
    },
    getProjectMembers: async (maDa) => {
        const result = await db_1.appPool
            .request()
            .input("MADA", db_1.sql.Int, maDa)
            .execute("sp_getProjectMembersSimple");
        return result.recordset.map((r) => r.MaNV);
    },
    getProjectInfo: async (maDa) => {
        const result = await db_1.appPool
            .request()
            .input("MADA", db_1.sql.Int, maDa)
            .execute("sp_getProjectInfo");
        return result.recordset[0] || null;
    },
    getDepartmentInfo: async (maPhg) => {
        const result = await db_1.appPool
            .request()
            .input("MAPHG", db_1.sql.Int, maPhg)
            .execute("sp_getDepartmentInfo");
        return result.recordset[0] || null;
    },
    createCustomGroupRoom: async (creatorMaNv, tenPhong, memberIds = []) => {
        const maThamChieu = generateRandomRoomId();
        const uniqueMembers = Array.from(new Set(memberIds.filter(Boolean)));
        const memberIdsStr = uniqueMembers.join(",");
        const result = await db_1.appPool
            .request()
            .input("CREATORMANV", db_1.sql.VarChar(20), creatorMaNv)
            .input("TENPHONG", db_1.sql.NVarChar(255), tenPhong)
            .input("MATHAMCHIEU", db_1.sql.VarChar(50), maThamChieu)
            .input("MEMBERIDS", db_1.sql.NVarChar(db_1.sql.MAX), memberIdsStr)
            .execute("sp_createCustomGroupRoom");
        return result.recordset[0] || null;
    },
    getRoomMemberRole: async (maPhong, maNv) => {
        const result = await db_1.appPool
            .request()
            .input("MAPHONG", db_1.sql.Int, maPhong)
            .input("MANV", db_1.sql.VarChar(20), maNv)
            .execute("sp_getRoomMemberRole");
        return result.recordset[0]?.VaiTro || null;
    },
    ROOM_TYPE,
};
exports.default = chatRepository;
