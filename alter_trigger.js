const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "1433"),
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

const alterTriggerQuery = `
ALTER TRIGGER [dbo].[trg_AfterInsertNhanVien]
ON [dbo].[NHAN_VIEN]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 1. Tu dong tao tai khoan trong TAI_KHOANG cho nhan vien moi
    INSERT INTO TAI_KHOANG (MA_NV, EMAIL, TEN_DANG_NHAP, PASSWORD_HASH, MA_VAI_TRO, IS_VERIFIED, TRANG_THAI)
    SELECT 
        i.MA_NV, 
        i.EMAIL, 
        i.EMAIL, 
        '$2a$10$7b.bW1a/sF1uH.f/9w0XUeX3d1gB4g7o9tH5w/Q0h1i2j3k4l5m6n', -- Mat khau mac dinh: '123456aA*'
        3, -- Vai tro mac dinh: Staff (Nhan vien)
        1, -- Da xac thuc
        1  -- Dang hoat dong
    FROM inserted i
    WHERE NOT EXISTS (
        SELECT 1 FROM TAI_KHOANG tk WHERE tk.MA_NV = i.MA_NV
    )
    AND NOT EXISTS (
        -- Loai tru luong Onboarding dang o trang thai cho duyet (OTP_VERIFIED) de tranh xung dot khoa
        SELECT 1 FROM DANG_KY_CHO dkc 
        WHERE dkc.Email = i.EMAIL 
          AND dkc.REGISTRATION_STATUS = 'OTP_VERIFIED'
    );

    -- 2. Tu dong khoi tao ban ghi trong THONG_TIN_CONG_VIEC cho nhan vien moi
    INSERT INTO THONG_TIN_CONG_VIEC (MA_NV, TRANG_THAI_LAM_VIEC, NGAY_TUYEN_DUNG, CHUC_VU)
    SELECT 
        i.MA_NV,
        N'Đang làm việc',
        CAST(GETDATE() AS DATE),
        N'Nhân viên'
    FROM inserted i
    WHERE NOT EXISTS (
        SELECT 1 FROM THONG_TIN_CONG_VIEC ttcv WHERE ttcv.MA_NV = i.MA_NV
    )
    AND NOT EXISTS (
        -- Loai tru luong Onboarding
        SELECT 1 FROM DANG_KY_CHO dkc 
        WHERE dkc.Email = i.EMAIL 
          AND dkc.REGISTRATION_STATUS = 'OTP_VERIFIED'
    );
END;
`;

async function fix() {
  try {
    await sql.connect(config);
    await sql.query(alterTriggerQuery);
    console.log("Successfully altered trigger!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
