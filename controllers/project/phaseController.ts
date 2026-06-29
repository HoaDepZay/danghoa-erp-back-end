import { Request, Response } from "express";
import { phaseRepository } from "../../repositories/project/phaseRepository";
import projectRepository from "../../repositories/project/projectRepository";
import { keysToCamelCase } from "../../utils/camelCaseHelper";

// Utility to check permission
const normalizeRole = (role: string) =>
  String(role || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();

async function canManageTasks(maGd: number, maNv: string, userRole: string): Promise<boolean> {
  const normRole = normalizeRole(userRole);
  if (normRole === "admin" || normRole === "giamdoc") return true;

  const phase = await phaseRepository.getPhaseById(maGd);
  if (!phase) return false;
  
  const projectRole = await projectRepository.getProjectMemberRole(phase.MA_DA, maNv);
  if (projectRole === "Trưởng dự án" || projectRole === "Phó dự án") return true;

  const phaseRole = await phaseRepository.getEmployeeRoleInPhase(maGd, maNv);
  if (phaseRole === "Trưởng giai đoạn") return true;

  return false;
}

export const phaseController = {
  getPhasesByProject: async (req: Request, res: Response) => {
    try {
      const maDa = Number(req.params.projectId);
      const phases = await phaseRepository.getPhasesByProject(maDa);
      res.json({ success: true, data: keysToCamelCase(phases) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getPhaseById: async (req: Request, res: Response) => {
    try {
      const maGd = Number(req.params.phaseId);
      const phase = await phaseRepository.getPhaseById(maGd);
      if (!phase) {
        return res.status(404).json({ success: false, message: "Phase not found" });
      }
      res.json({ success: true, data: keysToCamelCase(phase) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  createPhase: async (req: Request, res: Response) => {
    try {
      req.body.maDa = Number(req.params.projectId);
      const phase = await phaseRepository.createPhase(req.body);
      res.json({ success: true, data: keysToCamelCase(phase) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updatePhase: async (req: Request, res: Response) => {
    try {
      const maGd = Number(req.params.phaseId);
      const phase = await phaseRepository.updatePhase(maGd, req.body);
      res.json({ success: true, data: keysToCamelCase(phase) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deletePhase: async (req: Request, res: Response) => {
    try {
      const maGd = Number(req.params.phaseId);
      await phaseRepository.deletePhase(maGd);
      res.json({ success: true, message: "Đã xóa giai đoạn" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getPhaseAssignments: async (req: Request, res: Response) => {
    try {
      const maGd = Number(req.params.phaseId);
      const assignments = await phaseRepository.getPhaseAssignments(maGd);
      res.json({ success: true, data: keysToCamelCase(assignments) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  addPhaseAssignment: async (req: Request, res: Response) => {
    try {
      const maGd = Number(req.params.phaseId);
      const { maNv, vaiTro } = req.body;
      await phaseRepository.addPhaseAssignment(maGd, maNv, vaiTro);
      res.json({ success: true, message: "Đã phân công nhân sự" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  removePhaseAssignment: async (req: Request, res: Response) => {
    try {
      const maGd = Number(req.params.phaseId);
      const maNv = req.params.employeeId;
      await phaseRepository.removePhaseAssignment(maGd, maNv);
      res.json({ success: true, message: "Đã xóa nhân sự khỏi giai đoạn" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getTasksByPhase: async (req: Request, res: Response) => {
    try {
      const maGd = Number(req.params.phaseId);
      const tasks = await phaseRepository.getTasksByPhase(maGd);
      res.json({ success: true, data: tasks });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  createTask: async (req: Request, res: Response) => {
    try {
      const maGd = Number(req.params.phaseId);
      const user = (req as any).user;
      
      if (!user) {
         return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const userRole = user.userInfo?.role || user.role;
      const hasPerm = await canManageTasks(maGd, user.MA_NV || user.maNv, userRole);
      if (!hasPerm) {
        return res.status(403).json({ success: false, message: "Không có quyền tạo công việc trong giai đoạn này" });
      }

      req.body.maGd = maGd;
      const task = await phaseRepository.createTask(req.body);
      res.json({ success: true, data: task });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateTask: async (req: Request, res: Response) => {
    try {
      const maNvGd = Number(req.params.taskId);
      const user = (req as any).user;
      
      if (!user) {
         return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const taskObj = await phaseRepository.getTaskById(maNvGd);
      if (!taskObj) {
         return res.status(404).json({ success: false, message: "Task not found" });
      }
      
      const userRole = user.userInfo?.role || user.role;
      const hasPerm = await canManageTasks(taskObj.MA_GD, user.MA_NV || user.maNv, userRole);
      if (!hasPerm) {
        return res.status(403).json({ success: false, message: "Không có quyền sửa/duyệt công việc này" });
      }

      const task = await phaseRepository.updateTask(maNvGd, req.body);
      res.json({ success: true, data: task });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteTask: async (req: Request, res: Response) => {
    try {
      const maNvGd = Number(req.params.taskId);
      const user = (req as any).user;
      
      const taskObj = await phaseRepository.getTaskById(maNvGd);
      if (taskObj) {
        const userRole = user.userInfo?.role || user.role;
        const hasPerm = await canManageTasks(taskObj.MA_GD, user.MA_NV || user.maNv, userRole);
        if (!hasPerm) {
          return res.status(403).json({ success: false, message: "Không có quyền xóa" });
        }
        await phaseRepository.deleteTask(maNvGd);
      }
      res.json({ success: true, message: "Đã xóa công việc" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
