const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('sudo -S docker logs --tail 50 huit-erp-backend', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    
    // We need to pass the sudo password!
    stream.write('31052006Hoa*\n');
  });
}).connect({
  host: '100.69.220.17',
  port: 22,
  username: 'danghoa',
  password: '31052006Hoa*'
});
