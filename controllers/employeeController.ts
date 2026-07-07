import employeeService from "../services/employeeService";

const employeeController = {
  // 1. GET /api/employees - Lấy danh sách nhân viên
  getAllEmployees: async (req, res) => {
    try {
      const { page = 1, pageSize = 10, search = "" } = req.query;
      const pageNum = parseInt(page) || 1;
      const size = parseInt(pageSize) || 10;

      const userRole = req.user?.userInfo?.role;

      const result = await employeeService.getAllEmployees(
        pageNum,
        size,
        search,
        userRole,
      );

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // 2. GET /api/employees/:id - Xem chi tiết 1 nhân viên
  getEmployeeById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await employeeService.getEmployeeById(id);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // 3. POST /api/employees - Thêm nhân viên mới (Admin)
  createEmployee: async (req, res) => {
    try {
      // Kiểm tra quyền Admin (có thể thêm check từ JWT token)
      // const userRole = req.user?.role;
      // if (userRole !== 'Quản Trị Viên') {
      //   return res.status(403).json({ error: "Bạn không có quyền tạo nhân viên" });
      // }

      const result = await employeeService.createEmployee(req.body);

      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // 4. PUT /api/employees/:id - Cập nhật thông tin nhân viên (Admin)
  updateEmployee: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await employeeService.updateEmployee(id, req.body);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // 5. DELETE /api/employees/:id - Xóa/Khóa nhân viên (Admin)
  deleteEmployee: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await employeeService.deleteEmployee(id);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // 6. POST /api/employees/:id/avatar - Upload Avatar
  uploadAvatar: async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;

      const result = await employeeService.uploadAvatar(id, file);
      
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
};

export default employeeController;
