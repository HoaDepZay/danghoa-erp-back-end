const sql = require('mssql');
const c = {
    server: '100.109.65.2',
    user: 'sa',
    password: '31052006Hoa*',
    port: 1433,
    database: 'QuanTriNhanSu',
    options: { encrypt: false, trustServerCertificate: true }
};
sql.connect(c).then(async p => {
    const r1 = await p.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'");
    const tables = r1.recordset.map(x => x.TABLE_NAME);
    for(let n of tables) {
        const r = await p.request().query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='${n}'`);
        console.log(n + ': ' + r.recordset.map(x => x.COLUMN_NAME).join(', '));
    }
    p.close();
});
