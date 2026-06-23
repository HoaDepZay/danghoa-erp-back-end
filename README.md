# DANGHOA-ERP - BackEnd Project Documentation

Dự án này là hệ thống quản trị nhân sự (ERP) cho HUIT, được xây dựng bằng **Node.js** với **TypeScript**, sử dụng **SQL Server** làm cơ sở dữ liệu.

## 📁 Cấu trúc thư mục (Project Structure)

Dưới đây là mô tả chi tiết về chức năng của từng thư mục và tệp tin quan trọng trong dự án:

### 1. Thư mục cốt lõi (Core Folders)

- **`config/`**: Chứa các tệp cấu hình hệ thống.
  - `db.ts`: Cấu hình kết nối SQL Server sử dụng thư viện `mssql`.
- **`controllers/`**: Xử lý logic điều hướng, tiếp nhận request từ router, gọi service và trả về response cho client.
- **`services/`**: Nơi thực hiện các nghiệp vụ (Business Logic). Đây là tầng trung gian xử lý dữ liệu trước khi lưu vào DB hoặc sau khi lấy ra từ DB.
- **`repositories/`**: Tầng truy xuất dữ liệu (Data Access Layer). Chứa các câu lệnh truy vấn SQL (Query) thuần túy để tương tác trực tiếp với Database.
- **`routers/`**: Định nghĩa các đường dẫn API (Endpoints) và chỉ định controller/middleware tương ứng.
  - `authRoutes.ts`: Các API liên quan đến đăng nhập, đăng ký.
  - `employee.ts`: Các API quản lý nhân viên.
  - `admin.ts`: Các API dành cho quản trị viên.
  - ... (tương tự cho department, project, payroll)

### 2. Các thư mục hỗ trợ (Support Folders)

- **`database/`**: Lưu trữ các kịch bản SQL (`.sql`) để khởi tạo hoặc cập nhật cấu trúc database (Schema).
- **`docs/`**: Chứa tài liệu API.
  - `swagger.yaml`: Định nghĩa tài liệu API theo chuẩn Swagger/OpenAPI.
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**: Tài liệu tóm tắt các endpoint API nhanh (Markdown).
- **`middleware/`**: Chứa các hàm trung gian xử lý trước khi vào controller (ví dụ: xác thực JWT, phân quyền, kiểm tra dữ liệu đầu vào).
- **`types/`**: Định nghĩa các kiểu dữ liệu (Interfaces/Types) cho TypeScript để đảm bảo code an toàn và có gợi ý tốt.
- **`utils/`**: Các công cụ tiện ích dùng chung cho toàn dự án.
  - `encryptionHelper.ts`: Mã hóa mật khẩu, dữ liệu.
  - `jwtHelper.ts`: Tạo và xác thực mã Token.
  - `mailHelper.ts`: Xử lý gửi email.

### 3. Tệp tin ở thư mục gốc (Root Files)

- **`server.ts`**: Tệp tin khởi chạy chính của ứng dụng. Nơi kết nối Database và chạy server Express.
- **`app.ts`**: Cấu hình ứng dụng Express (middleware, routes).
- **`.env`**: (Ẩn) Lưu trữ các biến môi trường như tài khoản DB, PORT, Secret Key (Rất quan trọng).
- **`package.json`**: Quản lý các thư viện (dependencies) và các câu lệnh run script (npm run dev, npm start).
- **`tsconfig.json`**: Cấu hình trình biên dịch TypeScript.
- **`Dockerfile`**: Cấu hình để đóng gói ứng dụng bằng Docker.
- **`migration.js`**: Script hỗ trợ chạy các thay đổi database.

---

## 🚀 Cách chạy dự án (How to run)

1. **Cài đặt thư viện:** `npm install`
2. **Cấu hình môi trường:** Chỉnh sửa file `.env` với thông tin SQL Server của bạn.
   - Có thể dùng riêng tài khoản quản trị master để tạo LOGIN:
   - `DB_MASTER=master`
   - `DB_MASTER_USER=<tai_khoan_co_quyen_tren_master>`
   - `DB_MASTER_PASS=<mat_khau_tai_khoan_master>`
   - Nếu không cấu hình, hệ thống sẽ fallback sang `DB_USER/DB_PASS`.
3. **Chạy ở chế độ phát triển:** `npm run dev`
4. **Build code sang JS:** `npm run build`
5. **Chạy Production:** `npm start`

---

_Cảm ơn bạn đã sử dụng hệ thống._
