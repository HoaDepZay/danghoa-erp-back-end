import employeeRepository from "../repositories/employeeRepository";
import { encrypt, decrypt } from "../utils/encryptionHelper";
import crypto from "crypto";
import { normalizeRole } from "../utils/authHelper";

const employeeService = {
  // 1. Lấy danh sách nhân viên
  getAllEmployees: async (pageNum = 1, pageSize = 10, searchKeyword = "", userRole?: string) => {
    try {
      const result = await employeeRepository.getAllEmployees(
        pageNum,
        pageSize,
        searchKeyword,
      );

      const normalizedRole = userRole ? normalizeRole(userRole) : "";
      const hasSalaryAccess = (normalizedRole === "admin" || normalizedRole === "quanly");

      if (!hasSalaryAccess && result.data) {
        result.data = result.data.map((emp: any) => {
          const { LUONG, luong, ...rest } = emp;
          return rest;
        });
      }

      return {
        success: true,
        message: "Lấy danh sách nhân viên thành công",
        ...result,
      };
    } catch (error) {
      throw new Error("Lỗi lấy danh sách nhân viên: " + error.message);
    }
  },

  // 2. Lấy chi tiết 1 nhân viên
  getEmployeeById: async (manv) => {
    try {
      if (!manv || manv.trim() === "") {
        throw new Error("Mã nhân viên không hợp lệ");
      }

      const employee = await employeeRepository.getEmployeeById(manv);

      if (!employee) {
        throw new Error("Nhân viên không tồn tại");
      }

      return {
        success: true,
        message: "Lấy thông tin nhân viên thành công",
        data: employee,
      };
    } catch (error) {
      throw new Error("Lỗi lấy thông tin nhân viên: " + error.message);
    }
  },
  createEmployee: async (data) => {
    try {
      // Validate dữ liệu
      if (!data.hoten || !data.email || !data.chucvu || !data.luong) {
        throw new Error("Vui lòng điền đầy đủ thông tin nhân viên");
      }

      // Tạo Mã nhân viên nếu không có
      let manv = data.manv;
      if (!manv) {
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let randomChars = "";
        for (let i = 0; i < 4; i++) {
          randomChars += chars.charAt(crypto.randomInt(0, chars.length));
        }
        manv = `NV${randomChars}`;
      }

      const employeeData = {
        manv,
        hoten: data.hoten,
        email: data.email,
        chucvu: data.chucvu,
        luong: parseFloat(data.luong),
        maphg: data.maphg || null,
        ngaysinh: data.ngaysinh || null,
        gioitinh: data.gioitinh || null,
        diachinhan: data.diachinhan || null,
        ngayvaolam: data.ngayvaolam || new Date(),
      };

      await employeeRepository.createEmployee(employeeData);

      return {
        success: true,
        message: "Tạo nhân viên mới thành công",
        manv,
      };
    } catch (error) {
      throw new Error("Lỗi tạo nhân viên: " + error.message);
    }
  },

  // 4. Cập nhật thông tin nhân viên (Admin)
  updateEmployee: async (manv, data) => {
    try {
      if (!manv || manv.trim() === "") {
        throw new Error("Mã nhân viên không hợp lệ");
      }

      // Kiểm tra nhân viên tồn tại
      const existing = await employeeRepository.getEmployeeById(manv);
      if (!existing) {
        throw new Error("Nhân viên không tồn tại");
      }

      // Validate dữ liệu nếu có
      if (data.luong !== undefined && isNaN(parseFloat(data.luong))) {
        throw new Error("Lương phải là số hợp lệ");
      }

      const updateData = {
        hoten: data.hoten,
        email: data.email,
        chucvu: data.chucvu,
        luong: data.luong ? parseFloat(data.luong) : undefined,
        maphg: data.maphg,
        ngaysinh: data.ngaysinh,
        gioitinh: data.gioitinh,
        diachinhan: data.diachinhan,
      };

      // Lọc các trường undefined
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key],
      );

      await employeeRepository.updateEmployee(manv, updateData);

      return {
        success: true,
        message: "Cập nhật thông tin nhân viên thành công",
      };
    } catch (error) {
      throw new Error("Lỗi cập nhật nhân viên: " + error.message);
    }
  },

  // 5. Xóa/Khóa nhân viên
  deleteEmployee: async (manv) => {
    try {
      if (!manv || manv.trim() === "") {
        throw new Error("Mã nhân viên không hợp lệ");
      }

      // Kiểm tra nhân viên tồn tại
      const existing = await employeeRepository.getEmployeeById(manv);
      if (!existing) {
        throw new Error("Nhân viên không tồn tại");
      }

      await employeeRepository.deleteEmployee(manv);

      return {
        success: true,
        message: "Xóa nhân viên thành công",
      };
    } catch (error) {
      throw new Error("Lỗi xóa nhân viên: " + error.message);
    }
  },

  // 6. Đổi mật khẩu
  changePassword: async (email, oldPassword, newPassword) => {
    try {
      if (!oldPassword || !newPassword) {
        throw new Error("Vui lòng nhập đầy đủ mật khẩu cũ và mới");
      }

      if (newPassword.length < 6) {
        throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự");
      }

      // TODO: Xác thực oldPassword vs DB
      // Tạm thời skip xác thực password cũ vì chưa có hàm compare

      // Mã hóa mật khẩu mới
      const encryptedPassword = encrypt(newPassword);

      await employeeRepository.changePassword(email, encryptedPassword);

      return {
        success: true,
        message: "Đổi mật khẩu thành công",
      };
    } catch (error) {
      throw new Error("Lỗi đổi mật khẩu: " + error.message);
    }
  },

  // 7. Cập nhật profile cá nhân
  updateProfile: async (email, data) => {
    try {
      if (!data || Object.keys(data).length === 0) {
        throw new Error("Không có dữ liệu để cập nhật");
      }

      const updateData = {
        hoten: data.hoten,
        ngaysinh: data.ngaysinh,
        gioitinh: data.gioitinh,
        diachinhan: data.diachinhan || data.diachi, // Support both naming conventions
      };

      // Lọc các trường undefined
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key],
      );

      await employeeRepository.updateProfile(email, updateData);

      return {
        success: true,
        message: "Cập nhật profile thành công",
      };
    } catch (error) {
      throw new Error("Lỗi cập nhật profile: " + error.message);
    }
  },
};

export default employeeService;
