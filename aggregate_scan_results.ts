import * as fs from "fs";

const results = JSON.parse(fs.readFileSync("scan_results.json", "utf8"));
const summary: { [file: string]: { [prop: string]: number } } = {};

results.forEach((r: any) => {
  if (!summary[r.file]) {
    summary[r.file] = {};
  }
  if (!summary[r.file][r.prop]) {
    summary[r.file][r.prop] = 0;
  }
  summary[r.file][r.prop]++;
});

console.log("Summary of occurrences to change by file:");
Object.keys(summary).forEach(file => {
  console.log(`\nFile: ${file}`);
  Object.keys(summary[file]).forEach(prop => {
    console.log(`  - ${prop}: ${summary[file][prop]} times`);
  });
});
