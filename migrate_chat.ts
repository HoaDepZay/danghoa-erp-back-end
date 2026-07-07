import { sql, appPool } from "./config/db";

async function main() {
    await appPool.connect();
    
    console.log("Altering sp_getMyRooms...");
    await appPool.request().query(`
      ALTER PROCEDURE sp_getMyRooms
          @MA_NV VARCHAR(20)
      AS BEGIN
          SET NOCOUNT ON;
          SELECT pc.MA_PHONG, 
                 CASE 
                     WHEN pc.LOAI_PHONG = 'Nhan vien' THEN 
                         ISNULL((SELECT TOP 1 nv.HO_TEN 
                          FROM THANH_VIEN_PHONG_CHAT tv_other 
                          JOIN NHAN_VIEN nv ON nv.MA_NV = tv_other.MA_NV 
                          WHERE tv_other.MA_PHONG = pc.MA_PHONG AND tv_other.MA_NV != @MA_NV), pc.TEN_PHONG)
                     ELSE pc.TEN_PHONG 
                 END AS TEN_PHONG,
                 CASE 
                     WHEN pc.LOAI_PHONG = 'Nhan vien' THEN 
                         (SELECT TOP 1 nv.HINH_DAI_DIEN 
                          FROM THANH_VIEN_PHONG_CHAT tv_other 
                          JOIN NHAN_VIEN nv ON nv.MA_NV = tv_other.MA_NV 
                          WHERE tv_other.MA_PHONG = pc.MA_PHONG AND tv_other.MA_NV != @MA_NV)
                     ELSE NULL 
                 END AS HINH_DAI_DIEN,
                 pc.LOAI_PHONG, pc.NGAY_TAO,
                 COUNT(tv2.MA_NV) AS SoThanhVien,
                 (SELECT TOP 1 NOI_DUNG FROM TIN_NHAN WHERE MA_PHONG = pc.MA_PHONG ORDER BY THOI_GIAN_GUI DESC) AS TinNhanGanNhat
          FROM PHONG_CHAT pc
          JOIN THANH_VIEN_PHONG_CHAT tv ON tv.MA_PHONG = pc.MA_PHONG AND tv.MA_NV = @MA_NV
          LEFT JOIN THANH_VIEN_PHONG_CHAT tv2 ON tv2.MA_PHONG = pc.MA_PHONG
          GROUP BY pc.MA_PHONG, pc.TEN_PHONG, pc.LOAI_PHONG, pc.NGAY_TAO
          ORDER BY pc.NGAY_TAO DESC;
      END
    `);

    console.log("Altering sp_getRoomMessages...");
    await appPool.request().query(`
      ALTER PROCEDURE sp_getRoomMessages
          @MA_PHG NVARCHAR(100),
          @Limit  INT = 50
      AS BEGIN
          SET NOCOUNT ON;
          SELECT TOP (@Limit) tn.MA_TN, tn.MA_PHONG, tn.MA_NV_GUI AS MANV_GUI,
                 nv.HO_TEN AS TenNguoiGui, nv.HINH_DAI_DIEN, tn.NOI_DUNG, tn.THOI_GIAN_GUI, tn.FILE_URL, tn.FILE_TYPE
          FROM TIN_NHAN tn
          JOIN NHAN_VIEN nv ON nv.MA_NV = tn.MA_NV_GUI
          WHERE tn.MA_PHONG = @MA_PHG
          ORDER BY tn.THOI_GIAN_GUI DESC;
      END
    `);

    console.log("Migration finished.");
    process.exit(0);
}

main().catch(console.error);
