import employeeRepository from "../repositories/employeeRepository";
import { uploadFileToMinIO } from "../utils/minioClient";
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
      const hasSalaryAccess = (normalizedRole === "admin" || normalizedRole === "quanly" || normalizedRole === "giamdoc");

      if (!hasSalaryAccess && result.data) {
        result.data = result.data.map((emp: any) => {
          const { LUONG, ...rest } = emp;
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
  getEmployeeById: async (MA_NV) => {
    try {
      if (!MA_NV || MA_NV.trim() === "") {
        throw new Error("Mã nhân viên không hợp lệ");
      }

      const employee = await employeeRepository.getEmployeeById(MA_NV);

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
      if (!data.HO_TEN || !data.EMAIL || !data.CHUC_VU || !data.LUONG) {
        throw new Error("Vui lòng điền đầy đủ thông tin nhân viên");
      }

      // Tạo Mã nhân viên nếu không có
      let MA_NV = data.MA_NV;
      if (!MA_NV) {
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let randomChars = "";
        for (let i = 0; i < 4; i++) {
          randomChars += chars.charAt(crypto.randomInt(0, chars.length));
        }
        MA_NV = `NV${randomChars}`;
      }

      const employeeData = {
        MA_NV,
        HO_TEN: data.HO_TEN,
        EMAIL: data.EMAIL,
        CHUC_VU: data.CHUC_VU,
        LUONG: parseFloat(data.LUONG),
        MA_PHG: data.MA_PHG || null,
        NGAY_SINH: data.NGAY_SINH || null,
        GIOI_TINH: data.GIOI_TINH || null,
        SDT: data.SDT || null,
        DIA_CHI: data.DIA_CHI || null,
        NGAY_TUYEN_DUNG: data.NGAY_TUYEN_DUNG || new Date(),
      };

      await employeeRepository.createEmployee(employeeData);

      return {
        success: true,
        message: "Tạo nhân viên mới thành công",
        MA_NV,
      };
    } catch (error) {
      throw new Error("Lỗi tạo nhân viên: " + error.message);
    }
  },

  // 4. Cập nhật thông tin nhân viên (Admin)
  updateEmployee: async (MA_NV, data) => {
    try {
      if (!MA_NV || MA_NV.trim() === "") {
        throw new Error("Mã nhân viên không hợp lệ");
      }

      // Kiểm tra nhân viên tồn tại
      const existing = await employeeRepository.getEmployeeById(MA_NV);
      if (!existing) {
        throw new Error("Nhân viên không tồn tại");
      }

      // Validate dữ liệu nếu có
      if (data.LUONG !== undefined && isNaN(parseFloat(data.LUONG))) {
        throw new Error("Lương phải là số hợp lệ");
      }

      const updateData = {
        HO_TEN: data.HO_TEN,
        EMAIL: data.EMAIL,
        CHUC_VU: data.CHUC_VU,
        LUONG: data.LUONG ? parseFloat(data.LUONG) : undefined,
        MA_PHG: data.MA_PHG,
        NGAY_SINH: data.NGAY_SINH,
        GIOI_TINH: data.GIOI_TINH,
        SDT: data.SDT,
        DIA_CHI: data.DIA_CHI,
        HINH_DAI_DIEN: data.HINH_DAI_DIEN,
      };

      // Lọc các trường undefined
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key],
      );

      await employeeRepository.updateEmployee(MA_NV, updateData);

      return {
        success: true,
        message: "Cập nhật thông tin nhân viên thành công",
      };
    } catch (error) {
      throw new Error("Lỗi cập nhật nhân viên: " + error.message);
    }
  },

  // 5. Xóa/Khóa nhân viên
  deleteEmployee: async (MA_NV) => {
    try {
      if (!MA_NV || MA_NV.trim() === "") {
        throw new Error("Mã nhân viên không hợp lệ");
      }

      // Kiểm tra nhân viên tồn tại
      const existing = await employeeRepository.getEmployeeById(MA_NV);
      if (!existing) {
        throw new Error("Nhân viên không tồn tại");
      }

      await employeeRepository.deleteEmployee(MA_NV);

      return {
        success: true,
        message: "Xóa nhân viên thành công",
      };
    } catch (error) {
      throw new Error("Lỗi xóa nhân viên: " + error.message);
    }
  },

  // 6. Đổi mật khẩu
  changePassword: async (EMAIL, oldPassword, newPassword) => {
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

      await employeeRepository.changePassword(EMAIL, encryptedPassword);

      return {
        success: true,
        message: "Đổi mật khẩu thành công",
      };
    } catch (error) {
      throw new Error("Lỗi đổi mật khẩu: " + error.message);
    }
  },

  // 7. Cập nhật profile cá nhân
  updateProfile: async (EMAIL, data) => {
    try {
      if (!data || Object.keys(data).length === 0) {
        throw new Error("Không có dữ liệu để cập nhật");
      }

      const updateData = {
        HO_TEN: data.HO_TEN,
        NGAY_SINH: data.NGAY_SINH,
        GIOI_TINH: data.GIOI_TINH,
        DIA_CHI: data.DIA_CHI || data.DIA_CHI, // Support both naming conventions
        HINH_DAI_DIEN: data.HINH_DAI_DIEN,
      };

      // Lọc các trường undefined
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key],
      );

      await employeeRepository.updateProfile(EMAIL, updateData);

      return {
        success: true,
        message: "Cập nhật profile thành công",
      };
    } catch (error) {
      throw new Error("Lỗi cập nhật profile: " + error.message);
    }
  },

  // 8. Upload Avatar
  uploadAvatar: async (MA_NV: string, file: any) => {
    try {
      if (!file) throw new Error("Không tìm thấy file ảnh");
      
      // Kiểm tra nhân viên tồn tại
      const existing = await employeeRepository.getEmployeeById(MA_NV);
      if (!existing) throw new Error("Nhân viên không tồn tại");

      const fileName = await uploadFileToMinIO(file.buffer, file.originalname, file.mimetype);
      const cdnUrl = process.env.CDN_BASE_URL || "https://cdn.danghoa-erp.site/media";
      const fullUrl = `${cdnUrl}/${fileName}`;

      // Cập nhật URL vào DB
      await employeeRepository.updateEmployee(MA_NV, { HINH_DAI_DIEN: fullUrl });

      return {
        success: true,
        message: "Tải lên ảnh đại diện thành công",
        avatarUrl: fullUrl
      };
    } catch (error) {
      throw new Error("Lỗi upload ảnh: " + error.message);
    }
  }
};

export default employeeService;
