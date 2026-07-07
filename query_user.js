const sql = require('mssql');
require('dotenv').config({ path: './.env' });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkUser() {
    try {
        await sql.connect(config);
        const result = await sql.query(`EXEC sp_getUserByEmail 'hoadang0869@gmail.com'`);
        console.log(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
