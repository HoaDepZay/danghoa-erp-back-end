const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = `echo "31052006Hoa*" | sudo -S docker pull danghoa578/danghoa-erp-backend:latest && cd ~/danghoa-erp-backend && echo "31052006Hoa*" | sudo -S DOCKER_USERNAME=danghoa578 docker compose down && echo "31052006Hoa*" | sudo -S DOCKER_USERNAME=danghoa578 docker compose up -d && docker ps`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).on('error', (err) => {
  console.log('Connection failed:', err.message);
}).connect({
  host: '100.109.65.2',
  port: 22,
  username: 'danghoa',
  password: '31052006Hoa*'
});
