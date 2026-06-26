import { appPool, sql } from "../config/db";

const employeeRepository = {
  // 1. Lấy danh sách nhân viên (có phân trang + tìm kiếm)
  getAllEmployees: async (pageNum = 1, pageSize = 10, searchKeyword = "") => {
    const request = appPool.request();
    request.input("PageNum", sql.Int, pageNum);
    request.input("PageSize", sql.Int, pageSize);

    if (searchKeyword && searchKeyword.trim() !== "") {
      request.input("SearchKeyword", sql.NVarChar(100), searchKeyword.trim());
    }

    const result = await request.execute("sp_getAllEmployees");
    const totalRecords = result.recordsets?.[1]?.[0]?.TotalRecords || 0;

    return {
      data: result.recordsets?.[0] || [],
      pagination: {
        pageNum,
        pageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
      },
    };
  },

  // 2. Lấy chi tiết 1 nhân viên
  getEmployeeById: async (MA_NV) => {
    const result = await appPool
      .request()
      .input("MaNV", sql.NVarChar, MA_NV)
      .execute("sp_getEmployeeById");
    return result.recordset[0] || null;
  },

  // 3. Thêm nhân viên mới (Admin dùng)
  createEmployee: async (data) => {
    return await appPool
      .request()
      .input("MaNV", sql.NVarChar, data.MA_NV)
      .input("HoTen", sql.NVarChar, data.HO_TEN)
      .input("Email", sql.NVarChar, data.EMAIL)
      .input("ChucVu", sql.NVarChar, data.CHUC_VU)
      .input("Luong", sql.Decimal(18, 2), data.LUONG)
      .input("MaPhg", sql.Int, data.MA_PHG)
      .input("NgaySinh", sql.Date, data.NGAY_SINH || null)
      .input("GioiTinh", sql.NVarChar, data.GIOI_TINH || null)
      .input("SDT", sql.NVarChar, data.SDT || null)
      .input("DiaChi", sql.NVarChar, data.DIA_CHI || null)
      .input("NgayTuyenDung", sql.Date, data.NGAY_TUYEN_DUNG || null)
      .execute("sp_createEmployee");
  },

  // 4. Cập nhật thông tin nhân viên
  updateEmployee: async (MA_NV, data) => {
    const request = appPool.request();
    request.input("MaNV", sql.NVarChar, MA_NV);

    if (data.HO_TEN !== undefined) {
      request.input("HoTen", sql.NVarChar, data.HO_TEN);
    }
    if (data.EMAIL !== undefined) {
      request.input("Email", sql.NVarChar, data.EMAIL);
    }
    if (data.CHUC_VU !== undefined) {
      request.input("ChucVu", sql.NVarChar, data.CHUC_VU);
    }
    if (data.LUONG !== undefined) {
      request.input("Luong", sql.Decimal(18, 2), data.LUONG);
    }
    if (data.MA_PHG !== undefined) {
      request.input("MaPhg", sql.Int, data.MA_PHG);
    }
    if (data.NGAY_SINH !== undefined) {
      request.input("NgaySinh", sql.Date, data.NGAY_SINH);
    }
    if (data.GIOI_TINH !== undefined) {
      request.input("GioiTinh", sql.NVarChar, data.GIOI_TINH);
    }
    if (data.SDT !== undefined) {
      request.input("SDT", sql.NVarChar, data.SDT);
    }
    if (data.DIA_CHI !== undefined) {
      request.input("DiaChi", sql.NVarChar, data.DIA_CHI);
    }

    return await request.execute("sp_updateEmployee");
  },

  // 5. Xóa/Khóa nhân viên (cập nhật status)
  deleteEmployee: async (MA_NV) => {
    await appPool
      .request()
      .input("MaNV", sql.NVarChar, MA_NV)
      .execute("sp_deleteEmployeeFull");
  },

  // 6. Đổi mật khẩu nhân viên
  changePassword: async (EMAIL, newPassword) => {
    return await appPool
      .request()
      .input("Email", sql.NVarChar, EMAIL)
      .input("NewPassword", sql.NVarChar, newPassword)
      .execute("sp_changePassword");
  },

  // 7. Cập nhật profile nhân viên
  updateProfile: async (EMAIL, data) => {
    const request = appPool.request();
    request.input("Email", sql.NVarChar, EMAIL);

    if (data.HO_TEN !== undefined) {
      request.input("HoTen", sql.NVarChar, data.HO_TEN);
    }
    if (data.NGAY_SINH !== undefined) {
      request.input("NgaySinh", sql.Date, data.NGAY_SINH);
    }
    if (data.GIOI_TINH !== undefined) {
      request.input("GioiTinh", sql.NVarChar, data.GIOI_TINH);
    }
    const diaChiValue = data.DIA_CHI || data.DIA_CHI;
    if (diaChiValue !== undefined) {
      request.input("DiaChi", sql.NVarChar, diaChiValue);
    }
    if (data.SDT !== undefined) {
      request.input("SDT", sql.NVarChar, data.SDT);
    }
    if (data.MA_SO_THUE !== undefined) {
      request.input("MaSoThue", sql.NVarChar, data.MA_SO_THUE);
    }
    if (data.SO_TAI_KHOAN !== undefined) {
      request.input("SoTaiKhoan", sql.NVarChar, data.SO_TAI_KHOAN);
    }
    if (data.NGAN_HANG !== undefined) {
      request.input("NganHang", sql.NVarChar, data.NGAN_HANG);
    }

    return await request.execute("sp_updateProfile");
  },
};

export default employeeRepository;
