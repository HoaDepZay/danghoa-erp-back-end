const fs = require('fs');
const path = require('path');

const dirsToScan = ['config', 'controllers', 'middleware', 'repositories', 'routers', 'services', 'utils'];
const rootFiles = ['server.js', 'app.js', 'gen_hash.js'];
const basePath = __dirname;

function processFile(filePath) {
    if (!filePath.endsWith('.js')) return;
    if (filePath.includes('node_modules')) return;
    if (path.basename(filePath) === 'migration.js') return; // ignore self

    let content = fs.readFileSync(filePath, 'utf8');

    // Remove "use strict" if present
    content = content.replace(/['"]use strict['"];?\n?/g, '');

    // Replace require without assignments e.g. require("dotenv").config();
    content = content.replace(/require\((['`"].+?['`"])\)(\.config\(\))?;?/g, (match, p1, p2) => {
        if(p2) return `import "dotenv/config";`;
        // if just require
        return match; // keep as is for now, maybe let another regex handle it if there's const
    });

    // Replace basic const x = require('y') -> import x from 'y'
    content = content.replace(/const\s+([a-zA-Z0-9_]+)\s*=\s*require\((['`"].+?['`"])\);?/g, 'import $1 from $2;');
    
    // Replace const { x, y } = require('z') -> import { x, y } from 'z'
    content = content.replace(/const\s+(\{[a-zA-Z0-9_,\s:]+\})\s*=\s*require\((['`"].+?['`"])\);?/g, 'import $1 from $2;');

    // Replace var x = require(...) 
    content = content.replace(/let\s+([a-zA-Z0-9_]+)\s*=\s*require\((['`"].+?['`"])\);?/g, 'import $1 from $2;');
    
    // Replace module.exports = x -> export default x
    content = content.replace(/module\.exports\s*=\s*([^;]+);?/g, 'export default $1;');

    // Rename file
    const newFilePath = filePath.replace(/\.js$/, '.ts');
    fs.writeFileSync(newFilePath, content, 'utf8');
    fs.unlinkSync(filePath); // delete old
    console.log(`Converted: ${filePath} -> ${newFilePath}`);
}

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

// Process dirs
dirsToScan.forEach(dir => scanDir(path.join(basePath, dir)));

// Process root files
rootFiles.forEach(file => {
    const fullPath = path.join(basePath, file);
    if (fs.existsSync(fullPath)) {
        processFile(fullPath);
    }
});

console.log("Migration to .ts completed!");
