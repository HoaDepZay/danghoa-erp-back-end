import crypto from "crypto";
import { appPool, sql } from "../config/db";

const generateContractCode = () => {
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 10)
    .toUpperCase();
  return `HD${timestampPart}${randomPart}`;
};

const getContractCodeColumn = async () => {
  const result = await appPool.request().query(`
    SELECT TOP 1 c.name AS columnName
    FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    WHERE t.name = 'HOP_DONG_LAO_DONG'
      AND c.name IN ('MA_HD', 'MaHD', 'MAHD', 'SoHopDong')
    ORDER BY CASE c.name
      WHEN 'MA_HD' THEN 1
      WHEN 'MaHD' THEN 2
      WHEN 'MAHD' THEN 3
      WHEN 'SoHopDong' THEN 4
      ELSE 5
    END
  `);

  return result.recordset[0]?.columnName || null;
};

const isDuplicateKeyError = (error: any) => {
  const errorCode = String(error?.number || error?.originalError?.number || "");
  const errorMessage = String(error?.message || "");

  return (
    errorCode === "2601" ||
    errorCode === "2627" ||
    /duplicate key|unique constraint/i.test(errorMessage)
  );
};

const generateUniqueContractCode = async () => {
  const contractCodeColumn = await getContractCodeColumn();

  for (let attempt = 0; attempt < 5; attempt++) {
    const contractCode = generateContractCode();

    if (!contractCodeColumn) {
      return contractCode;
    }

    const checkResult = await appPool
      .request()
      .input("ContractCode", sql.VarChar(50), contractCode)
      .query(
        `SELECT 1 AS found FROM HOP_DONG_LAO_DONG WHERE [${contractCodeColumn}] = @ContractCode`,
      );

    if (checkResult.recordset.length === 0) {
      return contractCode;
    }
  }

  return generateContractCode();
};

const contractRepository = {
  getContracts: async (MA_NV?: string) => {
    const request = appPool.request();
    if (MA_NV) request.input("MaNV", sql.VarChar(20), MA_NV);

    const result = await request.execute("sp_getContracts");
    return result.recordset;
  },

  getExpiringContracts: async (SO_NGAY = 30) => {
    const result = await appPool
      .request()
      .input("SoNgay", sql.Int, SO_NGAY)
      .execute("sp_getExpiringContracts");

    return result.recordset;
  },

  createContract: async (data: {
    MA_NV: string;
    LOAI_HOP_DONG: string;
    TU_NGAY: string;
    DEN_NGAY?: string;
    LUONG_CO_BAN: string | number;
    NGAY_KY?: string;
    GHI_CHU?: string;
  }) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const MA_HD = await generateUniqueContractCode();
      const request = appPool
        .request()
        .input("MA_HD", sql.VarChar(50), MA_HD)
        .input("MA_NV", sql.VarChar(20), data.MA_NV)
        .input("LOAI_HOP_DONG", sql.NVarChar(100), data.LOAI_HOP_DONG)
        .input("TU_NGAY", sql.Date, data.TU_NGAY)
        .input("LUONG_CO_BAN", sql.Decimal(18, 2), data.LUONG_CO_BAN);

      if (data.DEN_NGAY) request.input("DEN_NGAY", sql.Date, data.DEN_NGAY);
      if (data.NGAY_KY) request.input("NgayKy", sql.Date, data.NGAY_KY);
      if (data.GHI_CHU)
        request.input("GhiChu", sql.NVarChar(500), data.GHI_CHU);

      try {
        await request.execute("sp_createContract");
        return { MA_HD };
      } catch (error: any) {
        if (attempt < 2 && isDuplicateKeyError(error)) {
          continue;
        }
        throw error;
      }
    }

    throw new Error("Không thể tạo mã hợp đồng duy nhất");
  },

  updateEmployeeLegal: async (data: {
    MA_NV: string;
    MA_SO_THUE?: string;
    SO_TAI_KHOAN?: string;
    NGAN_HANG?: string;
    SO_NGUOI_PHU_THUOC?: number;
  }) => {
    const request = appPool
      .request()
      .input("MaNV", sql.VarChar(20), data.MA_NV);

    if (data.MA_SO_THUE)
      request.input("MaSoThue", sql.VarChar(20), data.MA_SO_THUE);
    if (data.SO_TAI_KHOAN)
      request.input("SoTaiKhoan", sql.VarChar(30), data.SO_TAI_KHOAN);
    if (data.NGAN_HANG)
      request.input("NganHang", sql.NVarChar(100), data.NGAN_HANG);
    if (data.SO_NGUOI_PHU_THUOC !== undefined)
      request.input("SoNguoiPhuThuoc", sql.Int, data.SO_NGUOI_PHU_THUOC);

    await request.execute("sp_updateEmployeeLegal");
  },
};

export default contractRepository;
