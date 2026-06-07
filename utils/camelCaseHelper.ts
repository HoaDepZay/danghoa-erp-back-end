const SPECIAL_KEYS: Record<string, string> = {
  // Employees
  MA_NV: "MA_NV",
  manvda: "maNvDa",
  HO_TEN: "HO_TEN",
  EMAIL: "EMAIL",
  CHUC_VU: "CHUC_VU",
  LUONG: "LUONG",
  MA_PHG: "MA_PHG",
  NGAY_SINH: "NGAY_SINH",
  GIOI_TINH: "GIOI_TINH",
  DIA_CHI: "DIA_CHI",
  NGAY_TUYEN_DUNG: "NGAY_TUYEN_DUNG",
  ngaytuyendung: "NGAY_TUYEN_DUNG",
  status: "status",
  SDT: "SDT",

  // Departments
  tenpb: "tenpb",
  matruongphg: "matruongphg",
  ngthanhlap: "ngthanhlap",
  ng_thanhlap: "ngthanhlap",
  tentruongphong: "tenTruongPhong",

  // Projects
  MA_DA: "MA_DA",
  TEN_DA: "TEN_DA",
  MO_TA: "MO_TA",
  TRANG_THAI: "TRANG_THAI",
  NGAY_BAT_DAU: "NGAY_BAT_DAU",
  NGAY_KET_THUC: "NGAY_KET_THUC",

  // Tasks
  TEN_NHIEM_VU: "TEN_NHIEM_VU",
  DO_UU_TIEN: "DO_UU_TIEN",
  PHAN_TRAM_HOAN_THANH: "PHAN_TRAM_HOAN_THANH",
  GHI_CHU_SAU_HOAN_THANH: "GHI_CHU_SAU_HOAN_THANH",

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
  LOAI_PHONG: "LOAI_PHONG",
  MA_THAM_CHIEU: "MA_THAM_CHIEU",
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
