import express, { Request, Response } from "express";
import recruitmentRepository from "../repositories/recruitmentRepository";
import { withUserConnection } from "../middleware/authMiddleware";
import { requireDirectorOrAdmin } from "../middleware/authorizationMiddleware";

const router = express.Router();

// GET /api/recruitment/campaigns
router.get("/campaigns", withUserConnection, requireDirectorOrAdmin, async (req: Request, res: Response) => {
  try {
    const data = await recruitmentRepository.getCampaigns();
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Lỗi lấy danh sách chiến dịch:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// POST /api/recruitment/campaigns
router.post("/campaigns", withUserConnection, requireDirectorOrAdmin, async (req: Request, res: Response) => {
  try {
    const data = req.body;
    await recruitmentRepository.createCampaign(data);
    res.json({ success: true, message: "Tạo chiến dịch tuyển dụng thành công" });
  } catch (error: any) {
    console.error("Lỗi tạo chiến dịch:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// GET /api/recruitment/campaigns/:id
router.get("/campaigns/:id", withUserConnection, requireDirectorOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const data = await recruitmentRepository.getCampaignById(id);
    if (!data) return res.status(404).json({ success: false, message: "Không tìm thấy chiến dịch" });
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Lỗi lấy chi tiết chiến dịch:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// PUT /api/recruitment/campaigns/:id
router.put("/campaigns/:id", withUserConnection, requireDirectorOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const data = req.body;
    await recruitmentRepository.updateCampaign(id, data);
    res.json({ success: true, message: "Cập nhật chiến dịch thành công" });
  } catch (error: any) {
    console.error("Lỗi cập nhật chiến dịch:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// DELETE /api/recruitment/campaigns/:id
router.delete("/campaigns/:id", withUserConnection, requireDirectorOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await recruitmentRepository.deleteCampaign(id);
    res.json({ success: true, message: "Xóa chiến dịch thành công" });
  } catch (error: any) {
    console.error("Lỗi xóa chiến dịch:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// GET /api/recruitment/applicants
router.get("/applicants", withUserConnection, requireDirectorOrAdmin, async (req: Request, res: Response) => {
  try {
    const { MA_CD } = req.query;
    const data = await recruitmentRepository.getApplicants(MA_CD ? String(MA_CD) : undefined);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Lỗi lấy danh sách ứng viên:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// PUT /api/recruitment/applicants/:id/status
router.put("/applicants/:id/status", withUserConnection, requireDirectorOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { TRANG_THAI, GHI_CHU } = req.body;
    await recruitmentRepository.updateApplicantStatus(id, TRANG_THAI, GHI_CHU);
    res.json({ success: true, message: "Cập nhật trạng thái ứng viên thành công" });
  } catch (error: any) {
    console.error("Lỗi cập nhật trạng thái ứng viên:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

// POST /api/recruitment/applicants/:id/hire
router.post("/applicants/:id/hire", withUserConnection, requireDirectorOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { MA_NV, MA_PHG } = req.body;
    if (!MA_NV || !MA_PHG) {
      return res.status(400).json({ success: false, message: "Cần cung cấp MA_NV và MA_PHG để chuyển nhân viên" });
    }
    await recruitmentRepository.convertApplicantToEmployee(id, MA_NV, MA_PHG);
    res.json({ success: true, message: "Chuyển đổi thành Nhân viên thành công" });
  } catch (error: any) {
    console.error("Lỗi chuyển đổi ứng viên thành nhân viên:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ", error: error.message });
  }
});

export default router;
