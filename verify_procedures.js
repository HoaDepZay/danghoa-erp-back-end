const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const config = {
  user: 'sa',
  password: '31052006Hoa*',
  server: '100.108.208.39',
  database: 'QuanTriNhanSu',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });
  return arrayOfFiles;
}

async function run() {
  const repoFiles = getAllFiles(path.join(__dirname, 'repositories'));
  const calledProcedures = new Set();
  
  const regex = /"sp_[a-zA-Z0-9_]+"/g;
  
  for (const file of repoFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = regex.exec(content)) !== null) {
      calledProcedures.add(match[0].replace(/"/g, ''));
    }
  }

  console.log(`Found ${calledProcedures.size} stored procedures called in code.`);

  try {
    await sql.connect(config);
    const result = await sql.query(`SELECT name FROM sys.objects WHERE type = 'P'`);
    const existingProcedures = new Set(result.recordset.map(r => r.name));
    
    console.log(`Found ${existingProcedures.size} stored procedures in database.`);
    
    const missing = [];
    for (const proc of calledProcedures) {
      if (!existingProcedures.has(proc)) {
        missing.push(proc);
      }
    }
    
    if (missing.length > 0) {
      console.log('\\n=== MISSING STORED PROCEDURES ===');
      missing.forEach(m => console.log('- ' + m));
    } else {
      console.log('\\n=== NO MISSING PROCEDURES FOUND ===');
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    sql.close();
  }
}

run();
