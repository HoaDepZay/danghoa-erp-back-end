import departmentService from "../services/departmentService";

const departmentController = {
  getAllDepartments: async (req, res) => {
    try {
      const result = await departmentService.getAllDepartments();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  getDepartmentById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await departmentService.getDepartmentWithEmployees(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  },

  createDepartment: async (req, res) => {
    try {
      const result = await departmentService.createDepartment(req.body);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  updateDepartment: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await departmentService.updateDepartment(id, req.body);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  deleteDepartment: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await departmentService.deleteDepartment(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  getEmployeeDepartments: async (req, res) => {
    try {
      const { id } = req.params; // MA_NV
      const requesterMaNv = req.user?.userInfo?.MA_NV;
      const requesterRole = req.user?.userInfo?.role;

      const result = await departmentService.getEmployeeDepartments(
        id,
        requesterMaNv,
        requesterRole,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }
  },

  getEmployeeDepartmentWithMembers: async (req, res) => {
    try {
      const { id } = req.params; // MA_NV
      const requesterMaNv = req.user?.userInfo?.MA_NV;
      const requesterRole = req.user?.userInfo?.role;

      const result = await departmentService.getEmployeeDepartmentWithMembers(
        id,
        requesterMaNv,
        requesterRole,
      );
      return res.status(200).json(result);
    } catch (error) {
      return res.status(403).json({ success: false, message: error.message });
    }
  },
};

export default departmentController;
