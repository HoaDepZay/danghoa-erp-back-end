import * as fs from "fs";
import * as path from "path";

const dirToScan = "c:\\Users\\DANGQUANGHOA\\Desktop\\BE-FB-QuanTriNhanSu\\BackEnd";
const targetProperties = [
  "RegistrationStatus",
  "RejectReason",
  "PasswordMaHoa",
  "MaNV",
  "MaPhong",
  "MaTN",
  "NoiDung",
  "ThoiGianGui",
  "LoaiPhong",
  "TenPhong",
  "MaThamChieu",
  "NgayTao",
  "VaiTro",
  "NgayThamGia",
  "VaiTroDuAn",
  "MaNVDA",
  "TenNhiemVu",
  "PhanTramHoanThanh",
  "GhiChuSauHoanThanh",
  "LuongCoBan_DongBH",
  "LuongThoaThuan",
  "PhanTramHuongLuong",
  "SoNguoiPhuThuoc",
  "MaNV_Gui",
  "TenChucDanh",
  "PhuCap",
  "DoUuTien"
];

const results: any[] = [];

function scanDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".git" && file !== ".vscode") {
        scanDirectory(fullPath);
      }
    } else if (file.endsWith(".ts")) {
      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        targetProperties.forEach(prop => {
          const regex = new RegExp(`\\b${prop}\\b`, "g");
          if (regex.test(line)) {
            // Exclude self (scanner script itself)
            if (!fullPath.includes("scan_lowercase_properties.ts") && !fullPath.includes("read_all_sp_definitions.ts")) {
              results.push({
                file: path.relative(dirToScan, fullPath),
                line: idx + 1,
                prop,
                content: line.trim()
              });
            }
          }
        });
      });
    }
  }
}

scanDirectory(dirToScan);
fs.writeFileSync("scan_results.json", JSON.stringify(results, null, 2));
console.log(`Scan complete. Found ${results.length} occurrences. Saved to scan_results.json.`);
