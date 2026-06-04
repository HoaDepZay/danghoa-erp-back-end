# Sử dụng base image Node.js bản nhẹ (Alpine)
FROM node:20-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /usr/src/app

# Copy file package.json và package-lock.json
COPY package*.json ./

# Cài đặt các thư viện cần thiết (chỉ cài dependency cho production)
RUN npm install --production

# Cài đặt ts-node (vì project dùng ts-node-dev trên server, ta cần ts-node để chạy TS ở production)
RUN npm install -g typescript ts-node

# Copy toàn bộ mã nguồn vào container
COPY . .

# Expose port 5000 để docker-compose có thể map
EXPOSE 5000

# Lệnh khởi chạy ứng dụng
CMD ["ts-node", "--transpile-only", "server.ts"]