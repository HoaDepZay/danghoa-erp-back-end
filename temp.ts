import * as dotenv from 'dotenv';
dotenv.config();
import { appPool, sql } from './config/db';

import bcrypt from 'bcryptjs';

async function main() {
    try {
        await appPool.connect();
        const email = 'hoadang0869@gmail.com';
        const rawPassword = 'admin123';
        const hash = bcrypt.hashSync(rawPassword, 10);
        const maNV = 'NVGD0869';

        console.log("Checking if user exists...");
        const check = await appPool.request().input('EMAIL', sql.NVarChar, email).query("SELECT * FROM TAI_KHOANG WHERE EMAIL = @EMAIL");
        if (check.recordset.length > 0) {
            console.log("User already exists, updating password and role...");
            await appPool.request()
                .input('EMAIL', sql.NVarChar, email)
                .input('PASSWORD_HASH', sql.NVarChar, hash)
                .query("UPDATE TAI_KHOANG SET PASSWORD_HASH = @PASSWORD_HASH, MA_VAI_TRO = 1, IS_VERIFIED = 1, TRANG_THAI = 1 WHERE EMAIL = @EMAIL");
            console.log("Updated TAI_KHOANG.");
            
            // Cập nhật chức danh
            const user = check.recordset[0];
            await appPool.request().input('MANV', sql.VarChar, user.MA_NV).query("UPDATE THONG_TIN_CONG_VIEC SET MA_CHUC_DANH = 26 WHERE MA_NV = @MANV");
        } else {
            console.log("Creating new user...");
            const transaction = new sql.Transaction(appPool);
            await transaction.begin();
            
            try {
                const req = transaction.request();
                
                await req.input('MANV', sql.VarChar, maNV)
                         .input('HOTEN', sql.NVarChar, 'Hoa Đăng')
                         .input('EMAIL', sql.VarChar, email)
                         .query("INSERT INTO NHAN_VIEN (MA_NV, HO_TEN, EMAIL) VALUES (@MANV, @HOTEN, @EMAIL)");
                
                await req.query("INSERT INTO THONG_TIN_CONG_VIEC (MA_NV, MA_CHUC_DANH, NGAY_TUYEN_DUNG) VALUES (@MANV, 26, GETDATE())");
                
                await req.input('HASH', sql.NVarChar, hash)
                         .query("INSERT INTO TAI_KHOANG (MA_NV, EMAIL, PASSWORD_HASH, MA_VAI_TRO, TEN_DANG_NHAP, IS_VERIFIED, TRANG_THAI) VALUES (@MANV, @EMAIL, @HASH, 1, @EMAIL, 1, 1)");
                
                await transaction.commit();
                console.log("Successfully created user!");
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
main();
