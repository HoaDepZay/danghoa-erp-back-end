"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const projectRepository = {
    isEmployeeInProject: async (maDa, maNv) => {
        const request = db_1.appPool.request();
        const result = await request
            .input("MaDA", db_1.sql.Int, maDa)
            .input("MaNV", db_1.sql.VarChar, maNv).query(`
        SELECT TOP 1 1 AS IsMember
        FROM PHAN_CONG_DU_AN
        WHERE MaDA = @MaDA AND MaNV = @MaNV
      `);
        return result.recordset.length > 0;
    },
    getProjectMemberRole: async (maDa, maNv) => {
        const request = db_1.appPool.request();
        const result = await request
            .input("MaDA", db_1.sql.Int, maDa)
            .input("MaNV", db_1.sql.VarChar, maNv).query(`
        SELECT TOP 1 VaiTroDuAn
        FROM PHAN_CONG_DU_AN
        WHERE MaDA = @MaDA AND MaNV = @MaNV
      `);
        return result.recordset[0]?.VaiTroDuAn || null;
    },
    getProjectTasks: async (maDa) => {
        const request = db_1.appPool.request();
        const result = await request.input("MaDA", db_1.sql.Int, maDa).query(`
      SELECT
        nvda.MaNVDA,
        nvda.MaDA,
        nvda.MaNV,
        nv.HOTEN AS TenNhanVien,
        nvda.TenNhiemVu,
        nvda.MoTa,
        nvda.NgayBatDau,
        nvda.NgayKetThuc,
        nvda.DoUuTien,
        nvda.TrangThai,
        nvda.PhanTramHoanThanh,
        nvda.GhiChuSauHoanThanh,
        nvda.CreatedAt
      FROM NHIEM_VU nvda
      LEFT JOIN NHAN_VIEN nv ON nv.MANV = nvda.MaNV
      WHERE nvda.MaDA = @MaDA
      ORDER BY nvda.CreatedAt DESC, nvda.MaNVDA DESC
    `);
        return result.recordset;
    },
    createTask: async (maDa, data) => {
        const request = db_1.appPool.request();
        const result = await request
            .input("MaDA", db_1.sql.Int, maDa)
            .input("MaNV", db_1.sql.VarChar(20), data.manv)
            .input("TenNhiemVu", db_1.sql.NVarChar(255), data.tennhiemvu)
            .input("MoTa", db_1.sql.NVarChar(db_1.sql.MAX), data.mota ?? null)
            .input("NgayBatDau", db_1.sql.Date, data.ngaybatdau ?? null)
            .input("NgayKetThuc", db_1.sql.Date, data.ngayketthuc ?? null)
            .input("DoUuTien", db_1.sql.NVarChar(20), data.douutien ?? null)
            .input("TrangThai", db_1.sql.NVarChar(50), data.trangthai ?? "Mới")
            .input("PhanTramHoanThanh", db_1.sql.Int, data.phantramhoanthanh ?? 0)
            .input("GhiChuSauHoanThanh", db_1.sql.NVarChar(db_1.sql.MAX), data.ghichusauhoanthanh ?? null).query(`
        INSERT INTO NHIEM_VU
        (
          MaDA,
          MaNV,
          TenNhiemVu,
          MoTa,
          NgayBatDau,
          NgayKetThuc,
          DoUuTien,
          TrangThai,
          PhanTramHoanThanh,
          GhiChuSauHoanThanh
        )
        OUTPUT INSERTED.*
        VALUES
        (
          @MaDA,
          @MaNV,
          @TenNhiemVu,
          @MoTa,
          @NgayBatDau,
          @NgayKetThuc,
          @DoUuTien,
          @TrangThai,
          @PhanTramHoanThanh,
          @GhiChuSauHoanThanh
        )
      `);
        return result.recordset[0] || null;
    },
    getTaskByIdInProject: async (maDa, maNvDa) => {
        const request = db_1.appPool.request();
        const result = await request
            .input("MaDA", db_1.sql.Int, maDa)
            .input("MaNVDA", db_1.sql.Int, maNvDa).query(`
        SELECT TOP 1 *
        FROM NHIEM_VU
        WHERE MaDA = @MaDA AND MaNVDA = @MaNVDA
      `);
        return result.recordset[0] || null;
    },
    updateTask: async (maDa, maNvDa, data) => {
        const request = db_1.appPool.request();
        const updateFields = [];
        if (data.manv !== undefined) {
            updateFields.push("MaNV = @MaNV");
            request.input("MaNV", db_1.sql.VarChar(20), data.manv);
        }
        if (data.tennhiemvu !== undefined) {
            updateFields.push("TenNhiemVu = @TenNhiemVu");
            request.input("TenNhiemVu", db_1.sql.NVarChar(255), data.tennhiemvu);
        }
        if (data.mota !== undefined) {
            updateFields.push("MoTa = @MoTa");
            request.input("MoTa", db_1.sql.NVarChar(db_1.sql.MAX), data.mota);
        }
        if (data.ngaybatdau !== undefined) {
            updateFields.push("NgayBatDau = @NgayBatDau");
            request.input("NgayBatDau", db_1.sql.Date, data.ngaybatdau);
        }
        if (data.ngayketthuc !== undefined) {
            updateFields.push("NgayKetThuc = @NgayKetThuc");
            request.input("NgayKetThuc", db_1.sql.Date, data.ngayketthuc);
        }
        if (data.douutien !== undefined) {
            updateFields.push("DoUuTien = @DoUuTien");
            request.input("DoUuTien", db_1.sql.NVarChar(20), data.douutien);
        }
        if (data.trangthai !== undefined) {
            updateFields.push("TrangThai = @TrangThai");
            request.input("TrangThai", db_1.sql.NVarChar(50), data.trangthai);
        }
        if (data.phantramhoanthanh !== undefined) {
            updateFields.push("PhanTramHoanThanh = @PhanTramHoanThanh");
            request.input("PhanTramHoanThanh", db_1.sql.Int, data.phantramhoanthanh);
        }
        if (data.ghichusauhoanthanh !== undefined) {
            updateFields.push("GhiChuSauHoanThanh = @GhiChuSauHoanThanh");
            request.input("GhiChuSauHoanThanh", db_1.sql.NVarChar(db_1.sql.MAX), data.ghichusauhoanthanh);
        }
        if (updateFields.length === 0) {
            throw new Error("Không có trường nào để cập nhật task");
        }
        request.input("MaDA", db_1.sql.Int, maDa);
        request.input("MaNVDA", db_1.sql.Int, maNvDa);
        const result = await request.query(`
      UPDATE NHIEM_VU
      SET ${updateFields.join(", ")}
      OUTPUT INSERTED.*
      WHERE MaDA = @MaDA AND MaNVDA = @MaNVDA
    `);
        return result.recordset[0] || null;
    },
    // 1. Lấy danh sách dự án
    getAllProjects: async () => {
        const request = db_1.appPool.request();
        const result = await request.query(`
      SELECT MADA, TENDA, MoTa, NgayBatDau, NgayKetThuc, TrangThai 
      FROM DU_AN
      ORDER BY MADA DESC
    `);
        return result.recordset;
    },
    // 2. Lấy chi tiết dự án
    getProjectById: async (maDa) => {
        const request = db_1.appPool.request();
        const result = await request.input("MaDA", db_1.sql.Int, maDa).query(`
        SELECT MADA, TENDA, MoTa, NgayBatDau, NgayKetThuc, TrangThai 
        FROM DU_AN
        WHERE MADA = @MaDA
      `);
        return result.recordset[0] || null;
    },
    // 3. Lấy ds thành viên trong dự án
    getProjectMembers: async (maDa) => {
        const request = db_1.appPool.request();
        const result = await request.input("MaDA", db_1.sql.Int, maDa).query(`
        SELECT pc.MaNV, nv.HOTEN, nv.EMAIL, nv.CHUCVU, pc.VaiTroDuAn, pc.NgayThamGia
        FROM PHAN_CONG_DU_AN pc
        JOIN NHAN_VIEN nv ON pc.MaNV = nv.MANV
        WHERE pc.MaDA = @MaDA
      `);
        return result.recordset;
    },
    // 4. Lấy ds dự án của 1 nhân viên
    getEmployeeProjects: async (maNv) => {
        const request = db_1.appPool.request();
        const result = await request.input("MaNV", db_1.sql.VarChar, maNv).query(`
        SELECT da.MADA, da.TENDA, da.TrangThai, pc.VaiTroDuAn, pc.NgayThamGia
          FROM PHAN_CONG_DU_AN pc
          JOIN DU_AN da ON pc.MaDA = da.MADA
        WHERE pc.MaNV = @MaNV
      `);
        return result.recordset;
    },
    // 4b. Lấy đầy đủ thông tin dự án mà nhân viên đang tham gia, kèm toàn bộ thành viên từng dự án
    getProjectsWithMembersByEmployee: async (maNv) => {
        const request = db_1.appPool.request();
        const result = await request.input("MaNV", db_1.sql.VarChar, maNv).query(`
      SELECT
        da.MADA,
        da.TENDA,
        da.MoTa,
        da.NgayBatDau,
        da.NgayKetThuc,
        da.TrangThai,
        mem.MaNV AS MemberMaNV,
        nv.HOTEN AS MemberHoTen,
        nv.EMAIL AS MemberEmail,
        nv.CHUCVU AS MemberChucVu,
        mem.VaiTroDuAn AS MemberVaiTroDuAn,
        mem.NgayThamGia AS MemberNgayThamGia
      FROM DU_AN da
      INNER JOIN PHAN_CONG_DU_AN selfPc
        ON selfPc.MaDA = da.MADA
       AND selfPc.MaNV = @MaNV
      LEFT JOIN PHAN_CONG_DU_AN mem
        ON mem.MaDA = da.MADA
      LEFT JOIN NHAN_VIEN nv
        ON nv.MANV = mem.MaNV
      ORDER BY da.MADA DESC, mem.NgayThamGia ASC
    `);
        return result.recordset;
    },
    // 5. Tạo dự án mới
    createProject: async (data) => {
        const request = db_1.appPool.request();
        const result = await request
            .input("TenDA", db_1.sql.NVarChar, data.tenda)
            .input("MoTa", db_1.sql.NVarChar, data.mota || null)
            .input("NgayBatDau", db_1.sql.Date, data.ngaybatdau || new Date())
            .input("NgayKetThuc", db_1.sql.Date, data.ngayketthuc || null)
            .input("TrangThai", db_1.sql.NVarChar, data.trangthai || "Đang lên kế hoạch")
            .query(`
        INSERT INTO DU_AN (TENDA, MoTa, NgayBatDau, NgayKetThuc, TrangThai)
        OUTPUT INSERTED.MADA, INSERTED.TENDA, INSERTED.MoTa, INSERTED.NgayBatDau, INSERTED.NgayKetThuc, INSERTED.TrangThai
        VALUES (@TenDA, @MoTa, @NgayBatDau, @NgayKetThuc, @TrangThai)
      `);
        return result.recordset[0] || null;
    },
    // 6. Sửa dự án
    updateProject: async (maDa, data) => {
        const request = db_1.appPool.request();
        let updateFields = [];
        if (data.tenda !== undefined) {
            updateFields.push("TENDA = @TenDA");
            request.input("TenDA", db_1.sql.NVarChar, data.tenda);
        }
        if (data.mota !== undefined) {
            updateFields.push("MoTa = @MoTa");
            request.input("MoTa", db_1.sql.NVarChar, data.mota);
        }
        if (data.ngaybatdau !== undefined) {
            updateFields.push("NgayBatDau = @NgayBatDau");
            request.input("NgayBatDau", db_1.sql.Date, data.ngaybatdau);
        }
        if (data.ngayketthuc !== undefined) {
            updateFields.push("NgayKetThuc = @NgayKetThuc");
            request.input("NgayKetThuc", db_1.sql.Date, data.ngayketthuc);
        }
        if (data.trangthai !== undefined) {
            updateFields.push("TrangThai = @TrangThai");
            request.input("TrangThai", db_1.sql.NVarChar, data.trangthai);
        }
        if (updateFields.length === 0)
            return;
        request.input("MaDA", db_1.sql.Int, maDa);
        const query = `UPDATE DU_AN SET ${updateFields.join(", ")} WHERE MADA = @MaDA`;
        await request.query(query);
    },
    // 7a. Xóa danh sách nhiệm vụ của dự án
    deleteProjectTasks: async (maDa) => {
        const request = db_1.appPool.request();
        await request
            .input("MaDA", db_1.sql.Int, maDa)
            .query(`DELETE FROM NHIEM_VU WHERE MaDA = @MaDA`);
    },
    // 7b. Xóa phân công nhân viên của dự án
    deleteProjectAssignments: async (maDa) => {
        const request = db_1.appPool.request();
        await request
            .input("MaDA", db_1.sql.Int, maDa)
            .query(`DELETE FROM PHAN_CONG_DU_AN WHERE MaDA = @MaDA`);
    },
    // 7. Xóa dự án
    deleteProject: async (maDa) => {
        const request = db_1.appPool.request();
        await request
            .input("MaDA", db_1.sql.Int, maDa)
            .query(`DELETE FROM DU_AN WHERE MADA = @MaDA`);
    },
    // 8. Thêm thành viên vào dự án
    addProjectMember: async (maDa, maNv, vaiTroDuAn) => {
        const request = db_1.appPool.request();
        await request
            .input("MaDA", db_1.sql.Int, maDa)
            .input("MaNV", db_1.sql.VarChar, maNv)
            .input("VaiTroDuAn", db_1.sql.NVarChar, vaiTroDuAn).query(`
        INSERT INTO PHAN_CONG_DU_AN (MaDA, MaNV, VaiTroDuAn, NgayThamGia)
        VALUES (@MaDA, @MaNV, @VaiTroDuAn, GETDATE())
      `);
    },
    // 9. Xóa thành viên khỏi dự án
    removeProjectMember: async (maDa, maNv) => {
        const transaction = db_1.appPool.transaction();
        await transaction.begin();
        try {
            const request = new db_1.sql.Request(transaction);
            const result = await request
                .input("MaDA", db_1.sql.Int, maDa)
                .input("MaNV", db_1.sql.VarChar, maNv).query(`
          IF OBJECT_ID(N'dbo.NHIEMVU', N'U') IS NOT NULL
          BEGIN
            DELETE FROM dbo.NHIEMVU
            WHERE MaDA = @MaDA AND MaNV = @MaNV;
          END

          IF OBJECT_ID(N'dbo.NHIEM_VU', N'U') IS NOT NULL
          BEGIN
            DELETE FROM dbo.NHIEM_VU
            WHERE MaDA = @MaDA AND MaNV = @MaNV;
          END

          DELETE FROM PHAN_CONG_DU_AN
          WHERE MaDA = @MaDA AND MaNV = @MaNV;

          SELECT @@ROWCOUNT AS RemovedMemberCount;
        `);
            const removedMemberCount = result.recordset?.[0]?.RemovedMemberCount || 0;
            if (removedMemberCount === 0) {
                throw new Error("Nhân viên không tồn tại trong dự án");
            }
            await transaction.commit();
        }
        catch (error) {
            await transaction.rollback().catch(() => undefined);
            throw error;
        }
    },
};
exports.default = projectRepository;
