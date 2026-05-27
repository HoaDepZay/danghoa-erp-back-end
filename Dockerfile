# Sử dụng Debian-based Node.js bản nhẹ (Node 20) để hỗ trợ ODBC Driver
FROM node:20-slim

# Cài đặt các công cụ build và dependency cần thiết cho Native Addons (msnodesqlv8)
RUN apt-get update && apt-get install -y \
    gnupg2 \
    curl \
    ca-certificates \
    apt-transport-https \
    build-essential \
    python3 \
    unixodbc \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# Thêm key và repository của Microsoft ODBC Driver 17
RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - \
    && curl https://packages.microsoft.com/config/debian/11/prod.list > /etc/apt/sources.list.d/mssql-release.list

# Cài đặt Microsoft ODBC Driver 17 cho SQL Server (chấp nhận EULA tự động)
RUN apt-get update && ACCEPT_EULA=Y apt-get install -y msodbcsql17 mssql-tools \
    && echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc \
    && rm -rf /var/lib/apt/lists/*

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy các tệp cấu hình package vào trước để tận dụng cache Docker
COPY package*.json ./
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Biên dịch TypeScript sang JavaScript
RUN npm run build

# Mở port của ứng dụng (trong code đang chạy port 5000)
EXPOSE 5000

# Khởi chạy ứng dụng bằng code đã biên dịch trong thư mục dist
CMD ["node", "dist/server.js"]