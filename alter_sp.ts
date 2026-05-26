import { appPool, connectDB } from "./config/db";

const run = async () => {
  await connectDB();
  const alterQuery = `
    ALTER PROCEDURE sp_updateProfile
        @EMAIL NVARCHAR(100),
        @HOTEN NVARCHAR(200) = NULL,
        @NGAYSINH DATE = NULL,
        @GIOITINH NVARCHAR(20) = NULL,
        @DIACHI NVARCHAR(MAX) = NULL,
        @SDT NVARCHAR(15) = NULL
    AS
    BEGIN
        UPDATE NHAN_VIEN
        SET HOTEN = ISNULL(@HOTEN, HOTEN),
            NGAYSINH = ISNULL(@NGAYSINH, NGAYSINH),
            GIOITINH = ISNULL(@GIOITINH, GIOITINH),
            DIACHI = ISNULL(@DIACHI, DIACHI),
            SDT = ISNULL(@SDT, SDT)
        WHERE EMAIL = @EMAIL;
    END;
  `;
  await appPool.request().query(alterQuery);
  console.log("SUCCESS: sp_updateProfile altered!");
  process.exit(0);
};

run();
