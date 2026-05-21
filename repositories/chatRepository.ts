import { appPool, sql } from "../config/db";

const ROOM_TYPE = {
  DIRECT: 1,
  DEPARTMENT: 2,
  PROJECT: 3,
  GROUP: 4,
};

// Generate random room reference ID for direct rooms and custom groups
const generateRandomRoomId = (): string => {
  return `ROOM_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const chatRepository = {
  getMyRooms: async (maNv) => {
    const result = await appPool
      .request()
      .input("MaNV", sql.VarChar(20), maNv)
      .execute("sp_getMyRooms");

    return result.recordset;
  },

  isRoomMember: async (maPhong, maNv) => {
    const result = await appPool
      .request()
      .input("MaPhong", sql.Int, maPhong)
      .input("MaNV", sql.VarChar(20), maNv)
      .execute("sp_isRoomMember");

    return result.recordset.length > 0;
  },

  getRoomById: async (maPhong) => {
    const result = await appPool
      .request()
      .input("MaPhong", sql.Int, maPhong)
      .execute("sp_getRoomById");

    return result.recordset[0] || null;
  },

  getRoomMessages: async (maPhong, limit = 50) => {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
    const result = await appPool
      .request()
      .input("MaPhong", sql.Int, maPhong)
      .input("Limit", sql.Int, safeLimit)
      .execute("sp_getRoomMessages");

    return result.recordset.reverse();
  },

  getLatestMessageByRoom: async (maPhong) => {
    const result = await appPool.request().input("MaPhong", sql.Int, maPhong)
      .query(`
        SELECT MaTN, MaPhong, MaNV_Gui, NoiDung, ThoiGianGui
        FROM dbo.fn_LayTinNhanMoiNhat(@MaPhong)
      `);

    return result.recordset[0] || null;
  },

  searchMessagesByKeyword: async (maPhong, tuKhoa) => {
    const result = await appPool
      .request()
      .input("MaPhong", sql.Int, maPhong)
      .input("TuKhoa", sql.NVarChar(sql.MAX), tuKhoa).query(`
        SELECT MaTN, MaPhong, MaNV_Gui, NoiDung, ThoiGianGui
        FROM dbo.fn_TimKiemTinNhan(@MaPhong, @TuKhoa)
        ORDER BY ThoiGianGui DESC
      `);

    return result.recordset;
  },

  sendMessage: async (maPhong, maNvGui, noiDung) => {
    const result = await appPool
      .request()
      .input("MaPhong", sql.Int, maPhong)
      .input("MaNV_Gui", sql.VarChar(20), maNvGui)
      .input("NoiDung", sql.NVarChar(sql.MAX), noiDung)
      .execute("sp_sendMessage");

    return result.recordset[0] || null;
  },

  getRoomMembers: async (maPhong) => {
    const result = await appPool.request().input("MaPhong", sql.Int, maPhong)
      .query(`
        SELECT
          tvp.MaNV,
          nv.HOTEN,
          nv.EMAIL,
          tvp.VaiTro,
          tvp.NgayThamGia
        FROM THANH_VIEN_PHONG tvp
        LEFT JOIN NHAN_VIEN nv ON nv.MANV = tvp.MaNV
        WHERE tvp.MaPhong = @MaPhong
        ORDER BY tvp.NgayThamGia ASC
      `);

    return result.recordset;
  },

  findDirectRoom: async (maNvA, maNvB) => {
    const result = await appPool
      .request()
      .input("MaNVA", sql.VarChar(20), maNvA)
      .input("MaNVB", sql.VarChar(20), maNvB)
      .input("LoaiPhong", sql.TinyInt, ROOM_TYPE.DIRECT).query(`
        SELECT TOP 1 pc.MaPhong, pc.TenPhong, pc.LoaiPhong, pc.MaThamChieu, pc.NgayTao
        FROM PHONG_CHAT pc
        WHERE pc.LoaiPhong = @LoaiPhong
          AND EXISTS (
            SELECT 1 FROM THANH_VIEN_PHONG tv1
            WHERE tv1.MaPhong = pc.MaPhong AND tv1.MaNV = @MaNVA
          )
          AND EXISTS (
            SELECT 1 FROM THANH_VIEN_PHONG tv2
            WHERE tv2.MaPhong = pc.MaPhong AND tv2.MaNV = @MaNVB
          )
          AND (
            SELECT COUNT(*) FROM THANH_VIEN_PHONG tv3
            WHERE tv3.MaPhong = pc.MaPhong
          ) = 2
      `);

    return result.recordset[0] || null;
  },

  createDirectRoom: async (maNvA, maNvB) => {
    const transaction = appPool.transaction();
    await transaction.begin();

    try {
      // Get user names from NHAN_VIEN table
      const userAResult = await appPool
        .request()
        .input("MaNV", sql.VarChar(20), maNvA)
        .query(`SELECT HOTEN FROM NHAN_VIEN WHERE MANV = @MaNV`);

      const userBResult = await appPool
        .request()
        .input("MaNV", sql.VarChar(20), maNvB)
        .query(`SELECT HOTEN FROM NHAN_VIEN WHERE MANV = @MaNV`);

      const tenUserA = userAResult.recordset[0]?.HOTEN || maNvA;
      const tenUserB = userBResult.recordset[0]?.HOTEN || maNvB;
      const tenPhong = `${tenUserA} - ${tenUserB}`;
      const maThamChieu = generateRandomRoomId();

      const roomResult = await new sql.Request(transaction)
        .input("TenPhong", sql.NVarChar(255), tenPhong)
        .input("LoaiPhong", sql.TinyInt, ROOM_TYPE.DIRECT)
        .input("MaThamChieu", sql.VarChar(50), maThamChieu).query(`
          INSERT INTO PHONG_CHAT (TenPhong, LoaiPhong, MaThamChieu)
          OUTPUT INSERTED.MaPhong, INSERTED.TenPhong, INSERTED.LoaiPhong, INSERTED.MaThamChieu, INSERTED.NgayTao
          VALUES (@TenPhong, @LoaiPhong, @MaThamChieu)
        `);

      const room = roomResult.recordset[0];

      await new sql.Request(transaction)
        .input("MaPhong", sql.Int, room.MaPhong)
        .input("MaNV", sql.VarChar(20), maNvA).query(`
          INSERT INTO THANH_VIEN_PHONG (MaPhong, MaNV, VaiTro)
          VALUES (@MaPhong, @MaNV, N'Thành viên')
        `);

      await new sql.Request(transaction)
        .input("MaPhong", sql.Int, room.MaPhong)
        .input("MaNV", sql.VarChar(20), maNvB).query(`
          INSERT INTO THANH_VIEN_PHONG (MaPhong, MaNV, VaiTro)
          VALUES (@MaPhong, @MaNV, N'Thành viên')
        `);

      await transaction.commit();
      return room;
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    }
  },

  getOrCreateReferenceRoom: async (roomType, maThamChieu, tenPhong = null) => {
    const existed = await appPool
      .request()
      .input("LoaiPhong", sql.TinyInt, roomType)
      .input("MaThamChieu", sql.VarChar(50), String(maThamChieu)).query(`
        SELECT TOP 1 MaPhong, TenPhong, LoaiPhong, MaThamChieu, NgayTao
        FROM PHONG_CHAT
        WHERE LoaiPhong = @LoaiPhong AND MaThamChieu = @MaThamChieu
      `);

    if (existed.recordset[0]) {
      return existed.recordset[0];
    }

    const created = await appPool
      .request()
      .input("TenPhong", sql.NVarChar(255), tenPhong)
      .input("LoaiPhong", sql.TinyInt, roomType)
      .input("MaThamChieu", sql.VarChar(50), String(maThamChieu)).query(`
        INSERT INTO PHONG_CHAT (TenPhong, LoaiPhong, MaThamChieu)
        OUTPUT INSERTED.MaPhong, INSERTED.TenPhong, INSERTED.LoaiPhong, INSERTED.MaThamChieu, INSERTED.NgayTao
        VALUES (@TenPhong, @LoaiPhong, @MaThamChieu)
      `);

    return created.recordset[0] || null;
  },

  addMemberIfNotExists: async (maPhong, maNv, vaiTro = "Thành viên") => {
    await appPool
      .request()
      .input("MaPhong", sql.Int, maPhong)
      .input("MaNV", sql.VarChar(20), maNv)
      .input("VaiTro", sql.NVarChar(50), vaiTro).query(`
        IF NOT EXISTS (
          SELECT 1 FROM THANH_VIEN_PHONG WHERE MaPhong = @MaPhong AND MaNV = @MaNV
        )
        BEGIN
          INSERT INTO THANH_VIEN_PHONG (MaPhong, MaNV, VaiTro)
          VALUES (@MaPhong, @MaNV, @VaiTro)
        END
      `);
  },

  removeMember: async (maPhong, maNv) => {
    await appPool
      .request()
      .input("MaPhong", sql.Int, maPhong)
      .input("MaNV", sql.VarChar(20), maNv).query(`
        DELETE FROM THANH_VIEN_PHONG
        WHERE MaPhong = @MaPhong AND MaNV = @MaNV
      `);
  },

  getDepartmentMembers: async (maPhg) => {
    const result = await appPool.request().input("MaPhg", sql.Int, maPhg)
      .query(`
        SELECT MANV
        FROM NHAN_VIEN
        WHERE MAPHG = @MaPhg
      `);

    return result.recordset.map((r) => r.MANV);
  },

  getProjectMembers: async (maDa) => {
    const result = await appPool.request().input("MaDA", sql.Int, maDa).query(`
        SELECT MaNV
        FROM PHAN_CONG_DU_AN
        WHERE MaDA = @MaDA
      `);

    return result.recordset.map((r) => r.MaNV);
  },

  getProjectInfo: async (maDa) => {
    const result = await appPool.request().input("MaDA", sql.Int, maDa).query(`
        SELECT MADA, TENDA, MoTa, NgayBatDau, NgayKetThuc, TrangThai
        FROM DU_AN
        WHERE MADA = @MaDA
      `);

    return result.recordset[0] || null;
  },

  getDepartmentInfo: async (maPhg) => {
    const result = await appPool.request().input("MaPhg", sql.Int, maPhg)
      .query(`
        SELECT MAPHG, TENPB
        FROM PHONG_BAN
        WHERE MAPHG = @MaPhg
      `);

    return result.recordset[0] || null;
  },

  createCustomGroupRoom: async (creatorMaNv, tenPhong, memberIds = []) => {
    const transaction = appPool.transaction();
    await transaction.begin();

    try {
      const maThamChieu = generateRandomRoomId();

      const roomResult = await new sql.Request(transaction)
        .input("TenPhong", sql.NVarChar(255), tenPhong)
        .input("LoaiPhong", sql.TinyInt, ROOM_TYPE.GROUP)
        .input("MaThamChieu", sql.VarChar(50), maThamChieu).query(`
          INSERT INTO PHONG_CHAT (TenPhong, LoaiPhong, MaThamChieu)
          OUTPUT INSERTED.MaPhong, INSERTED.TenPhong, INSERTED.LoaiPhong, INSERTED.MaThamChieu, INSERTED.NgayTao
          VALUES (@TenPhong, @LoaiPhong, @MaThamChieu)
        `);

      const room = roomResult.recordset[0];

      const uniqueMembers = Array.from(
        new Set([creatorMaNv, ...memberIds.filter(Boolean)]),
      );

      for (const maNv of uniqueMembers) {
        await new sql.Request(transaction)
          .input("MaPhong", sql.Int, room.MaPhong)
          .input("MaNV", sql.VarChar(20), maNv)
          .input(
            "VaiTro",
            sql.NVarChar(50),
            maNv === creatorMaNv ? "Trưởng nhóm" : "Thành viên",
          ).query(`
            IF NOT EXISTS (
              SELECT 1 FROM THANH_VIEN_PHONG WHERE MaPhong = @MaPhong AND MaNV = @MaNV
            )
            BEGIN
              INSERT INTO THANH_VIEN_PHONG (MaPhong, MaNV, VaiTro)
              VALUES (@MaPhong, @MaNV, @VaiTro)
            END
          `);
      }

      await transaction.commit();
      return room;
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    }
  },

  getRoomMemberRole: async (maPhong, maNv) => {
    const result = await appPool
      .request()
      .input("MaPhong", sql.Int, maPhong)
      .input("MaNV", sql.VarChar(20), maNv).query(`
        SELECT TOP 1 VaiTro
        FROM THANH_VIEN_PHONG
        WHERE MaPhong = @MaPhong AND MaNV = @MaNV
      `);

    return result.recordset[0]?.VaiTro || null;
  },

  ROOM_TYPE,
};

export default chatRepository;
