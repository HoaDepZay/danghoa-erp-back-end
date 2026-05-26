import { connectDB, appPool } from "./config/db";
import * as fs from "fs";
import * as path from "path";

async function run() {
    try {
        await connectDB();
        console.log("Connected to DB");
        const sqlScript = fs.readFileSync(path.join(__dirname, "database/Phase2.sql"), "utf8");
        const batches = sqlScript.split(/\bGO\b/i);
        for (const batch of batches) {
            const trimmed = batch.trim();
            if (trimmed) {
                console.log("Executing batch...");
                await appPool.request().query(trimmed);
            }
        }
        console.log("Phase 2 SQL executed successfully");
        process.exit(0);
    } catch (err) {
        console.error("Error executing SQL:", err);
        process.exit(1);
    }
}

run();
