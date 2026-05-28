"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const chatController_1 = __importDefault(require("../controllers/chatController"));
const authMiddleware_1 = __importDefault(require("../middleware/authMiddleware"));
const authorizationMiddleware_1 = require("../middleware/authorizationMiddleware");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage: storage });
router.get("/rooms", authMiddleware_1.default, chatController_1.default.getMyRooms);
router.post("/direct-room", authMiddleware_1.default, chatController_1.default.getOrCreateDirectRoom);
router.get("/rooms/:roomId/messages", authMiddleware_1.default, chatController_1.default.getRoomMessages);
router.get("/rooms/:roomId/messages/latest", authMiddleware_1.default, chatController_1.default.getLatestRoomMessage);
router.get("/rooms/:roomId/messages/search", authMiddleware_1.default, chatController_1.default.searchRoomMessages);
router.post("/rooms/:roomId/messages", authMiddleware_1.default, chatController_1.default.sendMessage);
router.post("/groups", authMiddleware_1.default, chatController_1.default.createCustomGroup);
router.post("/groups/:roomId/members", authMiddleware_1.default, chatController_1.default.addMemberToCustomGroup);
router.delete("/groups/:roomId/members/:memberId", authMiddleware_1.default, chatController_1.default.removeMemberFromCustomGroup);
router.get("/projects/:projectId/room", authMiddleware_1.default, chatController_1.default.getOrCreateProjectRoom);
router.get("/departments/:departmentId/room", authMiddleware_1.default, authorizationMiddleware_1.checkAdminOrPass, chatController_1.default.getOrCreateDepartmentRoom);
router.post("/upload", authMiddleware_1.default, upload.single('file'), (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ success: false, message: "Không tìm thấy file" });
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({ success: true, url: fileUrl, type: req.file.mimetype });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.default = router;
