# Sử dụng base image Node.js bản nhẹ (Alpine)
FROM node:20-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /usr/src/app

# Copy file package.json và package-lock.json
COPY package*.json ./

# Cài đặt toàn bộ thư viện (bao gồm cả typescript và ts-node trong devDependencies)
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Expose port 5000 để docker-compose có thể map
EXPOSE 5000

# Lệnh khởi chạy ứng dụng bằng script start trong package.json
CMD ["npm", "start"]