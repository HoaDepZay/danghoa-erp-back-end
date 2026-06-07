export const SPECIAL_KEYS_TO_UPPER: Record<string, string> = {
  // Common mappings where generic camelCase/PascalCase to snake_case fails
  "manv": "MA_NV",
  "maNv": "MA_NV",
  "MaNV": "MA_NV",
  "hoten": "HO_TEN",
  "hoTen": "HO_TEN",
  "HoTen": "HO_TEN",
  "email": "EMAIL",
  "Email": "EMAIL",
  "chucvu": "CHUC_VU",
  "ChucVu": "CHUC_VU",
  "luong": "LUONG",
  "Luong": "LUONG",
  "maphg": "MA_PHG",
  "MaPhg": "MA_PHG",
  "ngaysinh": "NGAY_SINH",
  "NgaySinh": "NGAY_SINH",
  "gioitinh": "GIOI_TINH",
  "GioiTinh": "GIOI_TINH",
  "diachi": "DIA_CHI",
  "DiaChi": "DIA_CHI",
  "sdt": "SDT",
  "Sdt": "SDT",
  "SDT": "SDT",
  "ngaytuyendung": "NGAY_TUYEN_DUNG",
  "NgayTuyenDung": "NGAY_TUYEN_DUNG",
  "ngayvaolam": "NGAY_TUYEN_DUNG",
  "NgayVaoLam": "NGAY_TUYEN_DUNG",
  
  "mada": "MA_DA",
  "MaDA": "MA_DA",
  "MaDa": "MA_DA",
  "tenda": "TEN_DA",
  "TenDA": "TEN_DA",
  "TenDa": "TEN_DA",
  "mota": "MO_TA",
  "MoTa": "MO_TA",
  "trangthai": "TRANG_THAI",
  "TrangThai": "TRANG_THAI",
  "ngaybatdau": "NGAY_BAT_DAU",
  "NgayBatDau": "NGAY_BAT_DAU",
  "ngayketthuc": "NGAY_KET_THUC",
  "NgayKetThuc": "NGAY_KET_THUC",
  "vaitroduan": "VAI_TRO_DU_AN",
  "VaiTroDuAn": "VAI_TRO_DU_AN",
  
  "tennhiemvu": "TEN_NHIEM_VU",
  "TenNhiemVu": "TEN_NHIEM_VU",
  "douutien": "DO_UU_TIEN",
  "DoUuTien": "DO_UU_TIEN",
  "phantramhoanthanh": "PHAN_TRAM_HOAN_THANH",
  "PhanTramHoanThanh": "PHAN_TRAM_HOAN_THANH",
  
  "maphongchat": "MA_PHONG_CHAT",
  "MaPhongChat": "MA_PHONG_CHAT",
  "loaiphong": "LOAI_PHONG",
  "LoaiPhong": "LOAI_PHONG",
  "mathamchieu": "MA_THAM_CHIEU",
  "MaThamChieu": "MA_THAM_CHIEU"
};

const IGNORE_KEYS = [
  "success", "message", "data", "error", "token", "accessToken", "refreshToken",
  "isClosed", "session", "userEmail", "userInfo", "sqlPassEncrypted",
  "tokenType", "iat", "exp", "page", "pageSize", "totalRecords", "totalPages",
  "records", "attendance", "list", "payslip", "recordset", "recordsets", "output", "rowsAffected",
  "user", "role", "status", "nhanvien", "employee"
];

export const toUpperSnakeCase = (str: string): string => {
  if (!str) return str;
  
  if (IGNORE_KEYS.includes(str)) {
    return str;
  }
  
  // 1. Check exact match in special keys
  if (SPECIAL_KEYS_TO_UPPER[str]) {
    return SPECIAL_KEYS_TO_UPPER[str];
  }
  
  const lowerStr = str.toLowerCase();
  if (SPECIAL_KEYS_TO_UPPER[lowerStr]) {
    return SPECIAL_KEYS_TO_UPPER[lowerStr];
  }

  // 2. If it's already UPPER_SNAKE_CASE, return as is
  if (str === str.toUpperCase() && str.includes('_')) {
    return str;
  }
  
  // 3. If it's already upper case but no underscore (e.g. EMAIL), return
  if (str === str.toUpperCase()) {
    return str;
  }

  // 4. Convert PascalCase or camelCase to UPPER_SNAKE_CASE
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase();
};

export const keysToUpperSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToUpperSnakeCase(v));
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [toUpperSnakeCase(key)]: keysToUpperSnakeCase(obj[key]),
      }),
      {}
    );
  }
  return obj;
};
