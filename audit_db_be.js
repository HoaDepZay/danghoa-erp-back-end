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
    trustServerCertificate: true,
    connectTimeout: 15000
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

// Map sql type identifiers to string representation
function getSqlTypeName(typeId) {
  // Common SQL Server system type IDs
  const types = {
    34: 'image', 35: 'text', 36: 'uniqueidentifier', 40: 'date', 41: 'time',
    42: 'datetime2', 43: 'datetimeoffset', 48: 'tinyint', 52: 'smallint',
    56: 'int', 58: 'smalldatetime', 59: 'real', 60: 'money', 61: 'datetime',
    62: 'float', 98: 'sql_variant', 99: 'ntext', 104: 'bit', 106: 'decimal',
    108: 'numeric', 122: 'smallmoney', 127: 'bigint', 165: 'varbinary',
    167: 'varchar', 173: 'binary', 175: 'char', 231: 'nvarchar', 239: 'nchar'
  };
  return types[typeId] || `type_${typeId}`;
}

async function run() {
  const repoFiles = getAllFiles(path.join(__dirname, 'repositories'));
  const beProcs = {};

  // Regexes to parse parameter inputs and executions
  // e.g. .input("MADA", sql.Int, maDa) or .input("Email", sql.NVarChar(100), email)
  const inputRegex = /\.input\(\s*["']([^"']+)["']\s*,\s*(sql\.[a-zA-Z0-9_()]+)/g;
  const execRegex = /\.execute\(\s*["']([^"']+)["']\s*\)/g;

  for (const file of repoFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Find all blocks of requests
    // We split by .request() or repository calls to group inputs with their execute
    const blocks = content.split(/appPool\s*\.\s*request\s*\(\s*\)/g);
    
    // The first block is header/helper stuff, subsequent blocks contain inputs and execute
    for (let i = 1; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Find execute procedure name in this block
      execRegex.lastIndex = 0;
      const execMatch = execRegex.exec(block);
      if (!execMatch) continue;
      const procName = execMatch[1];
      
      if (!beProcs[procName]) {
        beProcs[procName] = {
          file: path.basename(file),
          parameters: []
        };
      }
      
      // Find all inputs in this block
      inputRegex.lastIndex = 0;
      let inputMatch;
      while ((inputMatch = inputRegex.exec(block)) !== null) {
        beProcs[procName].parameters.push({
          name: inputMatch[1],
          type: inputMatch[2]
        });
      }
    }
  }

  console.log(`Parsed ${Object.keys(beProcs).length} stored procedures from Backend code.`);

  try {
    console.log('Connecting to database...');
    await sql.connect(config);
    
    // Query database for all stored procedures and their parameters
    const query = `
      SELECT 
        p.name AS ProcedureName,
        param.name AS ParameterName,
        param.system_type_id AS TypeId,
        param.max_length AS MaxLength,
        param.is_output AS IsOutput
      FROM sys.procedures p
      LEFT JOIN sys.parameters param ON p.object_id = param.object_id
      ORDER BY p.name, param.parameter_id;
    `;
    
    const result = await sql.query(query);
    const dbProcs = {};
    
    for (const row of result.recordset) {
      const procName = row.ProcedureName;
      if (!dbProcs[procName]) {
        dbProcs[procName] = [];
      }
      if (row.ParameterName) {
        dbProcs[procName].push({
          name: row.ParameterName.replace(/^@/, ''), // strip leading @
          typeId: row.TypeId,
          typeName: getSqlTypeName(row.TypeId),
          maxLength: row.MaxLength,
          isOutput: row.IsOutput
        });
      }
    }
    
    console.log(`Loaded ${Object.keys(dbProcs).length} stored procedures from Database.\n`);
    
    // Compare Backend vs Database
    const mismatches = [];
    const missingInDb = [];
    
    for (const procName of Object.keys(beProcs)) {
      const be = beProcs[procName];
      const db = dbProcs[procName];
      
      if (!db) {
        missingInDb.push({ procName, file: be.file });
        continue;
      }
      
      const beParams = be.parameters;
      const dbParams = db;
      
      // Check for mismatches
      const mismatchesForProc = [];
      
      // 1. Check if backend parameters exist in database
      for (const beParam of beParams) {
        const matchingDbParam = dbParams.find(p => p.name.toLowerCase() === beParam.name.toLowerCase());
        if (!matchingDbParam) {
          mismatchesForProc.push(`Parameter '${beParam.name}' (${beParam.type}) is called in Backend but missing in Database`);
        } else {
          // Check casing
          if (matchingDbParam.name !== beParam.name) {
            mismatchesForProc.push(`Casing mismatch: Backend calls '${beParam.name}', Database defines '@${matchingDbParam.name}'`);
          }
        }
      }
      
      // 2. Check if database parameters are missing in backend (could cause default value issues if not nullable)
      for (const dbParam of dbParams) {
        const matchingBeParam = beParams.find(p => p.name.toLowerCase() === dbParam.name.toLowerCase());
        if (!matchingBeParam) {
          // Check if it's an output parameter or required
          mismatchesForProc.push(`Parameter '@${dbParam.name}' (${dbParam.typeName}) is defined in Database but not passed by Backend`);
        }
      }
      
      if (mismatchesForProc.length > 0) {
        mismatches.push({
          procName,
          file: be.file,
          errors: mismatchesForProc
        });
      }
    }
    
    if (missingInDb.length > 0) {
      console.log('=== MISSING PROCEDURES IN DATABASE ===');
      missingInDb.forEach(m => console.log(`- ${m.procName} (called in ${m.file})`));
      console.log();
    }
    
    if (mismatches.length > 0) {
      console.log('=== PARAMETER MISMATCHES ===');
      mismatches.forEach(m => {
        console.log(`\n[${m.procName}] (in ${m.file}):`);
        m.errors.forEach(e => console.log(`  - ${e}`));
      });
    } else {
      console.log('=== NO PARAMETER MISMATCHES FOUND! ===');
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await sql.close();
  }
}

run();
