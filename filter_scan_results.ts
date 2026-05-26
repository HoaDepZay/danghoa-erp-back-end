import * as fs from "fs";

const results = JSON.parse(fs.readFileSync("scan_results.json", "utf8"));
const filtered = results.filter((r: any) => 
  r.file.includes("payroll") || 
  r.file.includes("department") || 
  r.file.includes("employeeRepository")
);

console.log(JSON.stringify(filtered, null, 2));
