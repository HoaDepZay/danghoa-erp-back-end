const SPECIAL_KEYS: Record<string, string> = {
  // Employees
  manv: "manv",
  manvda: "maNvDa",
  hoten: "hoten",
  email: "email",
  chucvu: "chucvu",
  luong: "luong",
  maphg: "maphg",
  ngaysinh: "ngaysinh",
  gioitinh: "gioitinh",
  diachinhan: "diachinhan",
  diachi: "diachinhan",
  ngayvaolam: "ngayvaolam",
  ngaytuyendung: "ngayvaolam",
  status: "status",
  sodienthoai: "sodienthoai",
  sdt: "sdt",

  // Departments
  tenpb: "tenpb",
  matruongphg: "matruongphg",
  ngthanhlap: "ngthanhlap",
  ng_thanhlap: "ngthanhlap",
  tentruongphong: "tenTruongPhong",

  // Projects
  mada: "mada",
  tenda: "tenda",
  mota: "mota",
  trangthai: "trangthai",
  ngaybatdau: "ngaybatdau",
  ngayketthuc: "ngayketthuc",

  // Tasks
  tennhiemvu: "tennhiemvu",
  douutien: "douutien",
  phantramhoanthanh: "phantramhoanthanh",
  ghichusauhoanthanh: "ghichusauhoanthanh",

  // Payroll
  macc: "macc",
  giorao: "giora",
  giora: "giora",
  giovao: "giovao",
  ditre: "ditre",
  buoilamviec: "buoilamviec",
  mabl: "mabl",
  thang: "thang",
  nam: "nam",
  giolamviec: "giolamViec",
  thuong: "thuong",
  bhxh: "bhxh",
  phucap: "phucap",
  thuetncn: "thueTNCN",
  thuclanh: "thucLanh",
  tienphattre: "tienPhatTre",
  solantre: "soLanTre",
  solantangca: "soLanTangca",

  // Chat
  maphong: "maphong",
  tenphong: "tenphong",
  loaiphong: "loaiphong",
  mathamchieu: "mathamchieu",
  ngaytao: "ngaytao",
  sothanhvien: "soThanhVien",
  tinnhangannhat: "tinNhanGanNhat",
  matn: "matn",
  manvgui: "manvGui",
  manv_gui: "manvGui",
  noidung: "noidung",
  thoigiangui: "thoigiangui",
};

export const toCamelCase = (str: string): string => {
  if (!str) return str;
  
  // 0. Check in special keys mapping first (case insensitive)
  const lowerStr = str.toLowerCase();
  if (SPECIAL_KEYS[lowerStr] !== undefined) {
    return SPECIAL_KEYS[lowerStr];
  }

  // 1. Nếu chuỗi viết HOA hoàn toàn và không chứa dấu gạch dưới (ví dụ: MAPHG, TENPB, MANV, HOTEN)
  if (str === str.toUpperCase() && !str.includes('_')) {
    return str.toLowerCase();
  }
  
  // 2. Nếu chuỗi chứa dấu gạch dưới (ví dụ: NG_THANHLAP, THUE_TNCN)
  if (str.includes('_')) {
    return str
      .toLowerCase()
      .split('_')
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
  
  // 3. Nếu chuỗi viết hoa chữ cái đầu (PascalCase hoặc camelCase sẵn, ví dụ: TenTruongPhong, GiolamViec)
  return str.charAt(0).toLowerCase() + str.slice(1);
};

export const keysToCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToCamelCase(v));
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [toCamelCase(key)]: keysToCamelCase(obj[key]),
      }),
      {}
    );
  }
  return obj;
};
