# DANGHOA-ERP - Tài liệu API (Backend)

Tài liệu này tổng hợp các danh sách endpoint của hệ thống Quản trị Nhân sự (ERP).

**Cấu hình chung:**

- **URL cơ sở:** `http://localhost:5000/api`
- **Swagger UI:** `http://localhost:5000/api-docs`

---

## 1. Xác thực & Tài khoản (Authentication)

_Cơ sở: `/api/auth`_

| Phương thức | Endpoint           | Mô tả                      | Yêu cầu (Body)                               |
| :---------- | :----------------- | :------------------------- | :------------------------------------------- |
| **POST**    | `/register`        | Đăng ký tài khoản mới      | `email`, `password`, `manv`, `username`, ... |
| **POST**    | `/verify-otp`      | Xác thực mã OTP            | `email`, `otpCode`                           |
| **POST**    | `/login`           | Đăng nhập hệ thống         | `email`, `password`                          |
| **PUT**     | `/change-password` | Đổi mật khẩu               | `email`, `oldPassword`, `newPassword`        |
| **PUT**     | `/update-profile`  | Cập nhật thông tin profile | `email`, các trường thông tin khác           |

---

## 2. Quản lý Nhân viên (Employees)

_Cơ sở: `/api/employees`_

| Phương thức | Endpoint             | Mô tả                                | Ghi chú   |
| :---------- | :------------------- | :----------------------------------- | :-------- |
| **GET**     | `/`                  | Lấy danh sách toàn bộ nhân viên      |           |
| **GET**     | `/:id`               | Xem chi tiết 1 nhân viên / Profile   |           |
| **POST**    | `/`                  | Thêm nhân viên mới                   |           |
| **PUT**     | `/:id`               | Cập nhật thông tin nhân viên         |           |
| **DELETE**  | `/:id`               | Xóa/Khóa hồ sơ nhân viên             |           |
| **GET**     | `/my-projects/:manv` | Xem danh sách dự án tham gia         | Cần Token |
| **GET**     | `/coworkers/:maphg`  | Xem danh sách đồng nghiệp cùng phòng | Cần Token |
| **PUT**     | `/update-info`       | NV tự cập nhật Email                 |           |

---

## 3. Quản trị (Admin)

_Cơ sở: `/api/admin`_

| Phương thức | Endpoint            | Mô tả                         | Yêu cầu (Body)                              |
| :---------- | :------------------ | :---------------------------- | :------------------------------------------ |
| **PUT**     | `/nhan-vien/edit`   | Admin chỉnh sửa thông tin NV  | `manv`, `hoten`, `maphg`, `luong`, `chucvu` |
| **DELETE**  | `/nhan-vien/:manv`  | Admin xóa NV                  |                                             |
| **GET**     | `/phong-ban`        | Admin xem danh sách phòng ban |                                             |
| **POST**    | `/phong-ban/create` | Tạo phòng ban mới             | `tenpb`                                     |
| **PUT**     | `/phong-ban/edit`   | Sửa tên phòng ban             | `maphg`, `tenpb`                            |
| **DELETE**  | `/phong-ban/:maphg` | Xóa phòng ban (phải trống NV) |                                             |

---

## 4. Quản lý Phòng ban (Departments)

_Cơ sở: `/api/departments`_

| Phương thức | Endpoint | Mô tả                   |
| :---------- | :------- | :---------------------- |
| **GET**     | `/`      | Lấy danh sách phòng ban |
| **GET**     | `/:id`   | Xem chi tiết phòng ban  |
| **POST**    | `/`      | Thêm mới phòng ban      |
| **PUT**     | `/:id`   | Cập nhật phòng ban      |
| **DELETE**  | `/:id`   | Xóa phòng ban           |

---

## 5. Quản lý Dự án (Projects)

_Cơ sở: `/api/projects`_

| Phương thức | Endpoint                   | Mô tả                           |
| :---------- | :------------------------- | :------------------------------ |
| **GET**     | `/`                        | Lấy danh sách dự án             |
| **GET**     | `/:id`                     | Xem chi tiết dự án & thành viên |
| **POST**    | `/`                        | Thêm dự án mới                  |
| **PUT**     | `/:id`                     | Cập nhật thông tin dự án        |
| **DELETE**  | `/:id`                     | Xóa dự án                       |
| **GET**     | `/employee/:id`            | Xem dự án của 1 nhân viên       |
| **POST**    | `/:id/members`             | Thêm nhân viên vào dự án        |
| **DELETE**  | `/:id/members/:employeeId` | Xóa nhân viên khỏi dự án        |

---

## 6. Quản lý Lương (Payroll)

_Cơ sở: `/api/payroll`_

### Mục tiêu cho FE

Payroll backend hiện đã chuyển sang mô hình đọc dữ liệu cho bảng lương, nhưng vẫn có API check-in/check-out để ghi chấm công vào `BAN_CHAM_CONG`.

Check-in/check-out sẽ gọi stored procedure `sp_CheckIn` và `sp_CheckOut`. Khi `GioRa` thay đổi, DB sẽ tự cập nhật `DiTre`, `BuoiLamViec` và đồng bộ sang `BANG_LUONG`.

### 6 API FE cần dùng

| Phương thức | Endpoint                   | Mô tả                             | Yêu cầu (Body/Params)           |
| :---------- | :------------------------- | :-------------------------------- | :------------------------------ |
| **POST**    | `/check-in`                | Check-in nhân viên                | `maNV`                          |
| **POST**    | `/check-out`               | Check-out nhân viên               | `maNV`                          |
| **GET**     | `/attendance/:date`        | Lấy danh sách chấm công theo ngày | `date` (YYYY-MM-DD)             |
| **GET**     | `/attendance/employee/:id` | Lấy chấm công nhân viên           | Query: `fromDate`, `toDate`     |
| **GET**     | `/:year/:month`            | Lấy danh sách bảng lương tháng    | `year`, `month`                 |
| **GET**     | `/employee/:id`            | Lấy phiếu lương cá nhân           | Query tùy chọn: `month`, `year` |

### Thiết kế mới theo trigger

- `POST /api/payroll/check-in` gọi `sp_CheckIn` để tạo bản ghi `BAN_CHAM_CONG` với `GioVao`.
- `POST /api/payroll/check-out` gọi `sp_CheckOut` để cập nhật `GioRa` và trạng thái nhân viên.
- `BAN_CHAM_CONG` được trigger tự động cập nhật `DiTre`, `BuoiLamViec` và đồng bộ vào `BANG_LUONG` khi `GioRa` thay đổi.
- `GET /api/payroll/attendance/:date` và `GET /api/payroll/attendance/employee/:id` để đọc dữ liệu chấm công.
- FE có thể gọi thêm 2 API đọc để hiển thị bảng lương theo tháng và phiếu lương cá nhân.

### Cách dùng ở FE

#### 0) Check-in nhân viên

- **Method**: `POST`
- **Endpoint**: `/api/payroll/check-in`
- **Auth**: Bearer Token bắt buộc
- **Body**:
  - `maNV` (string, bắt buộc)

**Ví dụ request**

```http
POST /api/payroll/check-in
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "maNV": "NV001"
}
```

**Response thành công (200)**

```json
{
  "success": true,
  "message": "Check-in thành công!",
  "data": {
    "success": true,
    "result": 1,
    "message": "Check-in thành công!"
  }
}
```

**Response lỗi thường gặp**

- `400`: thiếu `maNV`, hoặc nhân viên đã check-in trong ngày
- `401`: thiếu token
- `403`: token không hợp lệ, hoặc nhân viên không có quyền thao tác cho mã NV khác
- `500`: lỗi hệ thống / lỗi stored procedure

#### 1) Check-out nhân viên

- **Method**: `POST`
- **Endpoint**: `/api/payroll/check-out`
- **Auth**: Bearer Token bắt buộc
- **Body**:
  - `maNV` (string, bắt buộc)

**Ví dụ request**

```http
POST /api/payroll/check-out
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "maNV": "NV001"
}
```

**Response thành công (200)**

```json
{
  "success": true,
  "message": "Check-out thành công!",
  "data": {
    "success": true,
    "result": 1,
    "message": "Check-out thành công!"
  }
}
```

**Response lỗi thường gặp**

- `400`: thiếu `maNV`, hoặc chưa có lượt check-in hợp lệ để check-out
- `401`: thiếu token
- `403`: token không hợp lệ, hoặc nhân viên không có quyền thao tác cho mã NV khác
- `500`: lỗi hệ thống / lỗi stored procedure

#### 2) Lấy danh sách chấm công theo ngày

- **Method**: `GET`
- **Endpoint**: `/api/payroll/attendance/:date`
- **Auth**: Bearer Token bắt buộc
- **Path params**:
  - `date` (string, bắt buộc): Ngày chấm công, format `YYYY-MM-DD`

**Ví dụ request**

```http
GET /api/payroll/attendance/2026-05-19
Authorization: Bearer <access_token>
```

**Response thành công (200)**

```json
{
  "success": true,
  "data": [
    {
      "MaCC": 1,
      "MaNV": "NV001",
      "HOTEN": "Nguyễn Văn A",
      "Ngay": "2026-05-19",
      "GioVao": "08:15:00",
      "GioRa": "17:30:00",
      "DiTre": "khong",
      "BuoiLamViec": "CaNgay",
      "TrangThai": "Hoàn thành"
    },
    {
      "MaCC": 2,
      "MaNV": "NV002",
      "HOTEN": "Trần Thị B",
      "Ngay": "2026-05-19",
      "GioVao": "08:45:00",
      "GioRa": "17:45:00",
      "DiTre": "Đi trễ 15 phút",
      "BuoiLamViec": "CaNgay",
      "TrangThai": "Hoàn thành"
    }
  ]
}
```

**Response lỗi thường gặp**

- `400`: thiếu hoặc định dạng sai ngày `date`
- `401`: thiếu token
- `500`: lỗi hệ thống

#### 3) Lấy chấm công của nhân viên

- **Method**: `GET`
- **Endpoint**: `/api/payroll/attendance/employee/:id`
- **Auth**: Bearer Token bắt buộc
- **Path params**:
  - `id` (string, bắt buộc): Mã nhân viên
- **Query params** (tùy chọn):
  - `fromDate` (string): Ngày bắt đầu, format `YYYY-MM-DD`
  - `toDate` (string): Ngày kết thúc, format `YYYY-MM-DD`

**Ví dụ request - toàn bộ lịch sử**

```http
GET /api/payroll/attendance/employee/NV001
Authorization: Bearer <access_token>
```

**Ví dụ request - lọc theo khoảng ngày**

```http
GET /api/payroll/attendance/employee/NV001?fromDate=2026-05-01&toDate=2026-05-31
Authorization: Bearer <access_token>
```

**Response thành công (200)**

```json
{
  "success": true,
  "data": [
    {
      "MaCC": 15,
      "MaNV": "NV001",
      "HOTEN": "Nguyễn Văn A",
      "Ngay": "2026-05-19",
      "GioVao": "08:15:00",
      "GioRa": "17:30:00",
      "DiTre": "khong",
      "BuoiLamViec": "CaNgay",
      "TrangThai": "Hoàn thành"
    },
    {
      "MaCC": 14,
      "MaNV": "NV001",
      "HOTEN": "Nguyễn Văn A",
      "Ngay": "2026-05-18",
      "GioVao": "08:20:00",
      "GioRa": "17:25:00",
      "DiTre": "khong",
      "BuoiLamViec": "CaNgay",
      "TrangThai": "Hoàn thành"
    }
  ]
}
```

**Response lỗi thường gặp**

- `400`: thiếu mã nhân viên `id`
- `401`: thiếu token
- `500`: lỗi hệ thống

#### 4) Lấy bảng lương theo tháng

- **Method**: `GET`
- **Endpoint**: `/api/payroll/:year/:month`
- **Auth**: Bearer Token bắt buộc
- **Path params**:
  - `year` (number, bắt buộc)
  - `month` (number, bắt buộc)

**Ví dụ request**

```http
GET /api/payroll/2026/3
Authorization: Bearer <access_token>
```

**Response thành công (200)**

```json
{
  "success": true,
  "data": [
    {
      "MaNV": "NV001",
      "Thang": 3,
      "Nam": 2026,
      "GiolamViec": 176.5,
      "Thuong": 500000,
      "BHXH": 1230000,
      "PhuCap": 300000,
      "ThueTNCN": 0,
      "ThucLanh": 18500000
    }
  ]
}
```

FE nên dùng route này cho màn hình danh sách lương của phòng ban/công ty, lọc theo tháng-năm, hoặc export báo cáo.

#### 5) Lấy phiếu lương cá nhân

- **Method**: `GET`
- **Endpoint**: `/api/payroll/employee/:id`
- **Auth**: Bearer Token bắt buộc
- **Path params**:
  - `id` (string, bắt buộc): Mã nhân viên
- **Query params**:
  - `month` (number, không bắt buộc)
  - `year` (number, không bắt buộc)

Nếu không truyền `month/year`, backend dùng tháng/năm hiện tại.

FE nên gọi route này khi mở trang chi tiết lương của một nhân viên.

### Cấu trúc dữ liệu chấm công

Nếu FE cần hiển thị trạng thái check-in/check-out, có thể dựa trên dữ liệu `BAN_CHAM_CONG` với các trường chính sau:

| Trường        | Mô tả                 |
| :------------ | :-------------------- |
| `MaCC`        | Mã chấm công          |
| `MaNV`        | Mã nhân viên          |
| `Ngay`        | Ngày chấm công        |
| `GioVao`      | Thời gian check-in    |
| `GioRa`       | Thời gian check-out   |
| `DiTre`       | Trạng thái đi trễ     |
| `BuoiLamViec` | Phân loại ca làm việc |

### Quy ước xử lý lỗi

- `400`: thiếu `year/month/id`, hoặc dữ liệu truyền lên không hợp lệ.
- `401`: thiếu token hoặc token không hợp lệ.
- `404`: không tìm thấy phiếu lương của nhân viên ở tháng đã chọn.
- `500`: lỗi hệ thống hoặc lỗi truy vấn SQL.

### Mẫu response lỗi

```json
{
  "success": false,
  "message": "Lỗi lấy phiếu lương cá nhân: ..."
}
```

---

## Định dạng Dữ liệu (Dự kiến)

### Đăng nhập thành công:

```json
{
  "success": true,
  "token": "...",
  "user": {
    "MANV": "NV001",
    "HOTEN": "Nguyen Van A",
    "EMAIL": "a@gmail.com",
    "ROLE": "Admin"
  }
}
```

### Lỗi trả về:

```json
{
  "success": false,
  "message": "Chi tiết lỗi ở đây"
}
```
