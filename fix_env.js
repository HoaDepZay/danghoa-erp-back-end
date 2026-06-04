const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('sudo -S sed -i "s/DB_SERVER=100.69.220.17/DB_SERVER=172.17.0.1/g" ~/huit-erp-backend/.env && sudo -S docker compose -f ~/huit-erp-backend/docker-compose.yml restart', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    stream.write('31052006Hoa*\n');
  });
}).connect({
  host: '100.69.220.17',
  port: 22,
  username: 'danghoa',
  password: '31052006Hoa*'
});
