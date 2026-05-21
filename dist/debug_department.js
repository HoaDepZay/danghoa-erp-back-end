"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./config/db");
const departmentRepository_1 = __importDefault(require("./repositories/departmentRepository"));
/**
 * Script debug để kiểm tra vấn đề tạo phòng ban
 */
async function debugDepartmentCreation() {
    try {
        console.log("=== DEBUG: Department Creation ===\n");
        // Step 0: Ensure connection
        console.log("Step 0: Kết nối database...");
        await db_1.appPool.connect();
        console.log("✓ Connected to database\n");
        // Step 1: Lấy tất cả phòng ban hiện tại
        console.log("Step 1: Lấy tất cả phòng ban...");
        const allDepts = await departmentRepository_1.default.getAllDepartments();
        console.log("Danh sách phòng ban hiện tại:");
        console.table(allDepts);
        if (allDepts && allDepts.length > 0) {
            console.log("\nField names từ database:");
            console.log(Object.keys(allDepts[0]));
            // Try parse IDs
            console.log("\nThử parse ID:");
            allDepts.forEach((d, idx) => {
                console.log(`  Dept ${idx}: MaPhg=${d.MaPhg}, maphg=${d.maphg}, MAPHG=${d.MAPHG}`);
            });
            // Calculate maxId
            const maxId = Math.max(...allDepts.map((d) => {
                const id1 = parseInt(d.MaPhg) || 0;
                const id2 = parseInt(d.maphg) || 0;
                const id3 = parseInt(d.MAPHG) || 0;
                const parsed = Math.max(id1, id2, id3);
                return isNaN(parsed) ? 0 : parsed;
            }));
            console.log(`\nMax ID tính được: ${maxId}`);
            console.log(`ID mới sẽ là: ${maxId + 1}`);
        }
        // Step 2: Thử kiểm tra một ID cụ thể
        console.log("\n\nStep 2: Kiểm tra phòng ban với ID = 1");
        const testDept = await departmentRepository_1.default.getDepartmentById(1);
        console.log("Kết quả:", testDept);
        // Step 3: Xem database constraint
        console.log("\n\nStep 3: Kiểm tra constraint trên bảng PHONG_BAN");
        const constraints = await db_1.appPool.request().query(`
        SELECT 
          CONSTRAINT_NAME,
          CONSTRAINT_TYPE,
          TABLE_NAME,
          COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_NAME = 'PHONG_BAN'
      `);
        console.table(constraints.recordset);
        // Step 4: Thử test tạo phòng ban với ID cụ thể
        const testId = Math.max(...(allDepts || []).map((d) => parseInt(d.MaPhg) || 0)) + 1;
        console.log(`\n\nStep 4: Thử test tạo phòng ban với ID = ${testId}`);
        console.log("Request body sẽ là:", {
            maphg: testId,
            tenpb: "TEST_DEBUG",
            matruongphg: null,
        });
        // TODO: Bạn có thể gọi API hoặc repository trực tiếp tại đây
    }
    catch (error) {
        console.error("ERROR:", error);
    }
    finally {
        process.exit(0);
    }
}
// Run debug
debugDepartmentCreation();
