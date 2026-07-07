import { sql, appPool } from "./config/db";

async function main() {
    await appPool.connect();
    const result = await appPool.request().query("SELECT TOP 5 MA_TN, MA_PHONG, NOI_DUNG, FILE_URL, FILE_TYPE FROM TIN_NHAN ORDER BY THOI_GIAN_GUI DESC");
    console.log(result.recordset);
    await appPool.close();
}

main().catch(console.error);
