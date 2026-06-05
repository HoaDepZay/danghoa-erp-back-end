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
  getEmployeeById: async (manv) => {
    const result = await appPool
      .request()
      .input("MaNV", sql.NVarChar, manv)
      .execute("sp_getEmployeeById");
    return result.recordset[0] || null;
  },

  // 3. Thêm nhân viên mới (Admin dùng)
  createEmployee: async (data) => {
    return await appPool
      .request()
      .input("MaNV", sql.NVarChar, data.manv)
      .input("HoTen", sql.NVarChar, data.hoten)
      .input("Email", sql.NVarChar, data.email)
      .input("ChucVu", sql.NVarChar, data.chucvu)
      .input("Luong", sql.Decimal(18, 2), data.luong)
      .input("MaPhg", sql.Int, data.maphg)
      .input("NgaySinh", sql.Date, data.ngaysinh || null)
      .input("GioiTinh", sql.NVarChar, data.gioitinh || null)
      .input("DiaChi", sql.NVarChar, data.diachinhan || null)
      .input("NgayTuyenDung", sql.Date, data.ngayvaolam || null)
      .execute("sp_createEmployee");
  },

  // 4. Cập nhật thông tin nhân viên
  updateEmployee: async (manv, data) => {
    const request = appPool.request();
    request.input("MaNV", sql.NVarChar, manv);

    if (data.hoten !== undefined) {
      request.input("HoTen", sql.NVarChar, data.hoten);
    }
    if (data.email !== undefined) {
      request.input("Email", sql.NVarChar, data.email);
    }
    if (data.chucvu !== undefined) {
      request.input("ChucVu", sql.NVarChar, data.chucvu);
    }
    if (data.luong !== undefined) {
      request.input("Luong", sql.Decimal(18, 2), data.luong);
    }
    if (data.maphg !== undefined) {
      request.input("MaPhg", sql.Int, data.maphg);
    }
    if (data.ngaysinh !== undefined) {
      request.input("NgaySinh", sql.Date, data.ngaysinh);
    }
    if (data.gioitinh !== undefined) {
      request.input("GioiTinh", sql.NVarChar, data.gioitinh);
    }
    if (data.diachinhan !== undefined) {
      request.input("DiaChi", sql.NVarChar, data.diachinhan);
    }

    return await request.execute("sp_updateEmployee");
  },

  // 5. Xóa/Khóa nhân viên (cập nhật status)
  deleteEmployee: async (manv) => {
    await appPool
      .request()
      .input("MaNV", sql.NVarChar, manv)
      .execute("sp_deleteEmployeeFull");
  },

  // 6. Đổi mật khẩu nhân viên
  changePassword: async (email, newPassword) => {
    return await appPool
      .request()
      .input("Email", sql.NVarChar, email)
      .input("NewPassword", sql.NVarChar, newPassword)
      .execute("sp_changePassword");
  },

  // 7. Cập nhật profile nhân viên
  updateProfile: async (email, data) => {
    const request = appPool.request();
    request.input("Email", sql.NVarChar, email);

    if (data.hoten !== undefined) {
      request.input("HoTen", sql.NVarChar, data.hoten);
    }
    if (data.ngaysinh !== undefined) {
      request.input("NgaySinh", sql.Date, data.ngaysinh);
    }
    if (data.gioitinh !== undefined) {
      request.input("GioiTinh", sql.NVarChar, data.gioitinh);
    }
    const diaChiValue = data.diachinhan || data.diachi;
    if (diaChiValue !== undefined) {
      request.input("DiaChi", sql.NVarChar, diaChiValue);
    }
    if (data.sdt !== undefined) {
      request.input("SDT", sql.NVarChar, data.sdt);
    }

    return await request.execute("sp_updateProfile");
  },
};

export default employeeRepository;
