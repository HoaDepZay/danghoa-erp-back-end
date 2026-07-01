require('ts-node/register');
const {appPool, connectDB, sql} = require('./config/db');
connectDB().then(async () => {
    try {
        const req = appPool.request();
        await req.query(INSERT INTO PHAN_CONG_GIAI_DOAN (MA_GD, MA_NV, VAI_TRO, MA_DA) VALUES (18, 'NV_TEST01', N'Trưởng giai đoạn', 23));
        await req.query(INSERT INTO PHAN_CONG_GIAI_DOAN (MA_GD, MA_NV, VAI_TRO, MA_DA) VALUES (18, 'NV_TEST05', N'Nhân viên', 23));
        await req.query(UPDATE NHIEM_VU_GIAI_DOAN SET MA_NV = 'NV_TEST01' WHERE TENNHIEMVU = N'Phân tích từ khóa ngành' AND MA_GD = 18);
        await req.query(UPDATE NHIEM_VU_GIAI_DOAN SET MA_NV = 'NV_TEST05' WHERE TENNHIEMVU = N'Phân tích website đối thủ' AND MA_GD = 18);
        console.log('Seeded members and assigned tasks.');
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
