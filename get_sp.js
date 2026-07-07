const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config({ path: './BackEnd/.env' });

async function main() {
  await sql.connect(process.env.DB_URI);
  
  try {
    const result = await sql.query(`
      SELECT definition
      FROM sys.sql_modules
      WHERE object_id = OBJECT_ID('sp_getMyRooms');
    `);
    console.log("sp_getMyRooms:");
    console.log(result.recordset[0].definition);
  } catch (e) { console.error(e.message); }

  try {
    const result2 = await sql.query(`
      SELECT definition
      FROM sys.sql_modules
      WHERE object_id = OBJECT_ID('sp_getRoomMessages');
    `);
    console.log("sp_getRoomMessages:");
    console.log(result2.recordset[0].definition);
  } catch (e) { console.error(e.message); }
  
  process.exit(0);
}
main().catch(console.error);
