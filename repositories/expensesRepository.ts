import { appPool, sql } from "../config/db";

export const getExpenses = async () => {
  const result = await appPool.request().query(`
    SELECT c.*, n.HO_TEN as TenNhanVienPhuTrach 
    FROM CHI_TIEU c
    LEFT JOIN NHAN_VIEN n ON c.MA_NV_PHU_TRACH = n.MA_NV
    ORDER BY c.NGAY_CHI DESC
  `);
  return result.recordset;
};

export const getExpenseById = async (id: string) => {
  const result = await appPool.request()
    .input("Id", sql.Int, id)
    .query("SELECT * FROM CHI_TIEU WHERE MA_CHI_TIEU = @Id");
  return result.recordset[0];
};

export const createExpense = async (expenseData: any) => {
  const { tenKhoanChi, soTien, ngayChi, maNvPhuTrach } = expenseData;
  const result = await appPool.request()
    .input("TenKhoanChi", sql.NVarChar(200), tenKhoanChi)
    .input("SoTien", sql.Decimal(18, 2), soTien)
    .input("NgayChi", sql.Date, new Date(ngayChi))
    .input("MaNV", sql.VarChar(20), maNvPhuTrach)
    .query(`
      INSERT INTO CHI_TIEU (TEN_KHOAN_CHI, SO_TIEN, NGAY_CHI, MA_NV_PHU_TRACH, TRANG_THAI)
      OUTPUT INSERTED.*
      VALUES (@TenKhoanChi, @SoTien, @NgayChi, @MaNV, N'Chờ duyệt')
    `);
  return result.recordset[0];
};

export const updateExpense = async (id: string, updateData: any) => {
  const { tenKhoanChi, soTien, ngayChi, trangThai } = updateData;
  const result = await appPool.request()
    .input("Id", sql.Int, id)
    .input("TenKhoanChi", sql.NVarChar(200), tenKhoanChi)
    .input("SoTien", sql.Decimal(18, 2), soTien)
    .input("NgayChi", sql.Date, new Date(ngayChi))
    .input("TrangThai", sql.NVarChar(50), trangThai)
    .query(`
      UPDATE CHI_TIEU
      SET TEN_KHOAN_CHI = @TenKhoanChi,
          SO_TIEN = @SoTien,
          NGAY_CHI = @NgayChi,
          TRANG_THAI = @TrangThai
      OUTPUT INSERTED.*
      WHERE MA_CHI_TIEU = @Id
    `);
  return result.recordset[0];
};

export const deleteExpense = async (id: string) => {
  await appPool.request()
    .input("Id", sql.Int, id)
    .query("DELETE FROM CHI_TIEU WHERE MA_CHI_TIEU = @Id");
  return true;
};
