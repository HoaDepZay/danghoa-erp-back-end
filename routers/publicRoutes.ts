import express, { Request, Response } from "express";
import recruitmentRepository from "../repositories/recruitmentRepository";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { sendApplySuccessEmail } from "../services/emailService";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".pdf";
    const uniqueName = `cv-${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// GET /api/public/jobs - Lấy danh sách việc làm (Company Web)
router.get("/jobs", async (req: Request, res: Response) => {
  try {
    const data = await recruitmentRepository.getCampaigns('OPEN');
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Lỗi Public API get jobs:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// POST /api/public/apply - Ứng tuyển (Company Web)
router.post("/apply", upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { MA_CD, HO_TEN, EMAIL, SO_DIEN_THOAI } = req.body;
    const file = req.file;

    if (!MA_CD || !HO_TEN || !EMAIL) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    // TODO: Upload file CV lên MinIO và lấy URL (giả lập trước bằng tên file)
    const urlCV = file ? `/uploads/${file.filename}` : "";

    const maUV = "UV" + Date.now().toString().slice(-6); // Gen mã tạm
    
    await recruitmentRepository.createApplicant({
      MA_UV: maUV,
      MA_CD,
      HO_TEN,
      EMAIL,
      SO_DIEN_THOAI,
      URL_CV: urlCV
    });

    // Lấy thông tin chiến dịch để hiển thị tên vị trí trong email
    const campaign = await recruitmentRepository.getCampaignById(MA_CD);
    const tieuDe = campaign?.TIEU_DE || "Vị trí tuyển dụng";

    // Gửi mail cảm ơn ứng viên trong background (không block response của API)
    sendApplySuccessEmail(EMAIL, HO_TEN, tieuDe).catch((err) =>
      console.error("Lỗi gửi email xác nhận ứng tuyển:", err)
    );

    res.json({ success: true, message: "Nộp hồ sơ ứng tuyển thành công!" });
  } catch (error: any) {
    console.error("Lỗi Public API apply:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

export default router;
