const { Client } = require('ssh2');

const conn = new Client();
const localFile = 'C:\\Users\\QUAN_TRI_NHAN_SU_temp.bak';
const remoteFile = '/home/danghoa/QUAN_TRI_NHAN_SU_temp.bak';
const host = '100.109.65.2';
const username = 'danghoa';
const password = '31052006Hoa*';

console.log('Đang kết nối SSH tới server ' + host + '...');

conn.on('ready', () => {
  console.log('Đã kết nối SSH thành công. Đang tải file lên server (quá trình này có thể mất vài phút tùy dung lượng file)...');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    sftp.fastPut(localFile, remoteFile, (err) => {
      if (err) {
        console.error('Lỗi khi upload file:', err);
        conn.end();
        return;
      }
      console.log('✅ Đã tải file lên máy chủ Ubuntu thành công: ' + remoteFile);
      
      console.log('Đang tìm SQL Server container...');
      // Tìm container có tên chứa "sql"
      conn.exec('docker ps --format "{{.Names}}" | grep -i "sql"', (err, stream) => {
        if (err) throw err;
        let containerName = '';
        stream.on('data', data => containerName += data.toString());
        stream.on('close', () => {
          containerName = containerName.trim().split('\n')[0];
          
          if (!containerName) {
             // Fallback tìm tất cả container xem cái nào là mssql
             conn.exec('docker ps --format "{{.Names}} {{.Image}}" | grep -i "mssql"', (err2, stream2) => {
                 let fbName = '';
                 stream2.on('data', d => fbName += d.toString());
                 stream2.on('close', () => {
                     fbName = fbName.trim().split(' ')[0];
                     if(fbName) {
                         executeDockerCp(fbName);
                     } else {
                         console.error('❌ KHÔNG TÌM THẤY CONTAINER SQL SERVER ĐANG CHẠY.');
                         conn.end();
                     }
                 });
             });
          } else {
            executeDockerCp(containerName);
          }
        });
      });
    });
  });
}).on('error', (err) => {
    console.error('Lỗi kết nối SSH:', err);
}).connect({
  host: host,
  port: 22,
  username: username,
  password: password
});

function executeDockerCp(containerName) {
    console.log(`✅ Tìm thấy SQL container: ${containerName}. Đang copy file vào thư mục data của container...`);
    
    const cmd = `echo '${password}' | sudo -S docker cp ${remoteFile} ${containerName}:/var/opt/mssql/data/`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            if(code === 0) {
                 console.log('✅ THÀNH CÔNG! File đã được đưa vào thư mục /var/opt/mssql/data/ trong SQL Server.');
                 console.log('Bây giờ bạn có thể mở SSMS và tiến hành Restore bình thường.');
            } else {
                 console.log(`❌ Có lỗi xảy ra khi copy vào docker (Exit code: ${code})`);
            }
            conn.end();
        }).on('data', (data) => {
            // console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            // console.log('STDERR: ' + data);
        });
    });
}
