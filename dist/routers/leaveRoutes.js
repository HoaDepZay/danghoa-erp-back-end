"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../config/db");
const authMiddleware_1 = require("../middleware/authMiddleware");
const notificationController_1 = require("../controllers/notificationController");
const server_1 = require("../server");
const router = express_1.default.Router();
// GET / - Lấy danh sách đơn (admin/manager xem tất cả, nhân viên xem của mình)
router.get("/", authMiddleware_1.withUserConnection, async (req, res) => {
    try {
        const { maNv, trangThaiDuyet } = req.query;
        const request = db_1.appPool.request();
        if (maNv)
            request.input("MaNV", db_1.sql.VarChar(20), maNv);
        if (trangThaiDuyet)
            request.input("TrangThaiDuyet", db_1.sql.NVarChar(50), trangThaiDuyet);
        const result = await request.execute("sp_getLeaves");
        res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        console.error("Lỗi get leaves:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
});
router.get("/types", authMiddleware_1.withUserConnection, async (req, res) => {
    try {
        const result = await db_1.appPool.request().query("SELECT * FROM LOAI_NGHI_PHEP");
        res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        console.error("Lỗi get leave types:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ" });
    }
});
// Duyệt đơn nghỉ phép (đa cấp)
router.post("/approve", authMiddleware_1.withUserConnection, async (req, res) => {
    try {
        const { maDon, capDuyet, trangThai, lyDoTuChoi } = req.body;
        // req.user được gán từ withUserConnection (middleware)
        // Lấy mã NV của người duyệt
        const nguoiDuyet = req.user?.MANV || "ADMIN";
        if (!maDon || !capDuyet || !trangThai) {
            return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
        }
        const request = db_1.appPool.request()
            .input("MaDon", db_1.sql.Int, maDon)
            .input("NguoiDuyet", db_1.sql.VarChar(20), nguoiDuyet)
            .input("CapDuyet", db_1.sql.Int, capDuyet)
            .input("TrangThai", db_1.sql.NVarChar(50), trangThai);
        if (lyDoTuChoi) {
            request.input("LyDoTuChoi", db_1.sql.NVarChar(500), lyDoTuChoi);
        }
        await request.execute("sp_approveLeave");
        res.json({ success: true, message: "Đã cập nhật trạng thái đơn nghỉ phép" });
    }
    catch (error) {
        console.error("Lỗi approve leave:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
});
// POST / - Nhân viên nộp đơn nghỉ phép mới
router.post("/", authMiddleware_1.withUserConnection, async (req, res) => {
    try {
        const maNv = req.user?.userInfo?.manv;
        const { tuNgay, denNgay, lyDo, maLoaiNghi } = req.body;
        if (!maNv)
            return res.status(401).json({ success: false, message: "Không xác định được nhân viên" });
        if (!tuNgay || !denNgay || !lyDo || !maLoaiNghi) {
            return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin nộp đơn" });
        }
        await db_1.appPool.request()
            .input("MANV", db_1.sql.VarChar(20), maNv)
            .input("TUNGAY", db_1.sql.Date, new Date(tuNgay))
            .input("DENNGAY", db_1.sql.Date, new Date(denNgay))
            .input("LYDO", db_1.sql.NVarChar(500), lyDo)
            .input("MALOAINGHI", db_1.sql.Int, maLoaiNghi)
            .query(`
        INSERT INTO DON_NGHI_PHEP (MANV, TUNGAY, DENNGAY, LYDO, TRANGTHAIDUYET, MALOAINGHI)
        VALUES (@MANV, @TUNGAY, @DENNGAY, @LYDO, N'Chờ duyệt', @MALOAINGHI)
      `);
        // Logic gửi thông báo cho Trưởng phòng
        try {
            const deptHeadQuery = await db_1.appPool.request()
                .input("MANV", db_1.sql.VarChar(20), maNv)
                .query(`
          SELECT pb.MATRUONGPHG 
          FROM NHAN_VIEN nv
          LEFT JOIN PHONG_BAN pb ON nv.MAPHG = pb.MAPHG
          WHERE nv.MANV = @MANV
        `);
            const maTruongPhg = deptHeadQuery.recordset[0]?.MATRUONGPHG;
            let targetMaNv = maTruongPhg;
            // Nếu không có Trưởng phòng, tìm 1 admin làm fallback
            if (!targetMaNv) {
                const adminQuery = await db_1.appPool.request()
                    .query("SELECT TOP 1 MANV FROM TAI_KHOAN WHERE ROLE = 'admin'");
                targetMaNv = adminQuery.recordset[0]?.MANV;
            }
            if (targetMaNv) {
                const notif = await (0, notificationController_1.createNotification)(targetMaNv, "Đơn nghỉ phép mới", `Nhân viên ${maNv} vừa nộp đơn xin nghỉ phép. Vui lòng kiểm tra và phê duyệt.`, "leave_request", "/leaves");
                if (notif)
                    (0, server_1.emitNotification)(targetMaNv, notif);
            }
        }
        catch (e) {
            console.error("Lỗi gửi thông báo xin nghỉ phép:", e);
        }
        res.json({ success: true, message: "Nộp đơn nghỉ phép thành công! Đang chờ phê duyệt." });
    }
    catch (error) {
        console.error("Lỗi nộp đơn:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
    }
});
// GET /my - Nhân viên xem đơn nghỉ phép của bản thân
router.get("/my", authMiddleware_1.withUserConnection, async (req, res) => {
    try {
        const maNv = req.user?.userInfo?.manv;
        if (!maNv)
            return res.status(401).json({ success: false, message: "Không xác định được nhân viên" });
        const result = await db_1.appPool.request()
            .input("MaNV", db_1.sql.VarChar(20), maNv)
            .execute("sp_getLeaves");
        res.json({ success: true, data: result.recordset });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
