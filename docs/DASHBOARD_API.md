# 📊 Dashboard API Documentation

## Tổng Quan

Tính năng Dashboard cung cấp các endpoint để lấy thống kê và báo cáo từ các phòng ban, nhân viên, dự án, và lương.

---

## 🔗 Các Endpoint Dashboard

### 1. **GET** `/api/dashboard/summary`

**Mô tả:** Lấy tóm tắt dashboard (tổng nhân viên, phòng ban, dự án, v.v.)

**Response:**

```json
{
  "success": true,
  "message": "Lấy tóm tắt dashboard thành công",
  "data": [
    { "TieuChi": "Tổng nhân viên", "SoLuong": 50, "IconType": "employee" },
    { "TieuChi": "Nhân viên tạm", "SoLuong": 5, "IconType": "employee" },
    { "TieuChi": "Tổng phòng ban", "SoLuong": 8, "IconType": "department" },
    { "TieuChi": "Tổng dự án", "SoLuong": 20, "IconType": "project" },
    { "TieuChi": "Dự án đang chạy", "SoLuong": 12, "IconType": "project" },
    { "TieuChi": "Dự án hoàn thành", "SoLuong": 8, "IconType": "project" }
  ]
}
```

---

### 2. **GET** `/api/dashboard/main`

**Mô tả:** Lấy dashboard chính với tất cả thông tin quan trọng

**Response:**

```json
{
  "success": true,
  "message": "Lấy dashboard chính thành công",
  "data": {
    "quickStats": {
      "TongNhanVien": 50,
      "DuAnDangChay": 12,
      "DuAnHoanThanh": 8,
      "TongPhongBan": 8,
      "LuongTrungBinh": 12500000,
      "TongLuongThang": 625000000
    },
    "departmentStats": [
      {
        "MAPHG": 1,
        "TENPB": "Phòng IT",
        "TongNhanVien": 15,
        "NhanVienChinhThuc": 13,
        "NhanVienTam": 2,
        "LuongTrungBinh": 15000000,
        "TongLuong": 225000000,
        "TenTruongPhong": "Nguyễn Văn A"
      }
    ],
    "projectStats": [
      {
        "MADA": 1,
        "TENDA": "Dự án A",
        "TrangThai": "Đang thực hiện",
        "NgayBatDau": "2026-01-15",
        "NgayKetThuc": "2026-06-30",
        "SoThanhVien": 5,
        "TrangThaiThangHan": "Còn thời hạn"
      }
    ],
    "recentActivities": [
      {
        "LoaiHoatDong": "Nhân viên mới",
        "TenDoiTuong": "Trần Văn B",
        "ThoiGian": "2026-03-20T10:30:00.000Z",
        "Loai": "Nhân viên"
      }
    ]
  }
}
```

---

### 3. **GET** `/api/dashboard/employees-by-department`

**Mô tả:** Lấy thống kê nhân viên theo phòng ban

**Response:**

```json
{
  "success": true,
  "message": "Lấy thống kê nhân viên theo phòng ban thành công",
  "data": [
    {
      "MAPHG": 1,
      "TENPB": "Phòng IT",
      "TongNhanVien": 15,
      "NhanVienChinhThuc": 13,
      "NhanVienTam": 2,
      "LuongTrungBinh": 15000000,
      "TongLuong": 225000000,
      "TenTruongPhong": "Nguyễn Văn A"
    },
    {
      "MAPHG": 2,
      "TENPB": "Phòng Nhân Sự",
      "TongNhanVien": 8,
      "NhanVienChinhThuc": 8,
      "NhanVienTam": 0,
      "LuongTrungBinh": 11000000,
      "TongLuong": 88000000,
      "TenTruongPhong": "Lê Thị C"
    }
  ]
}
```

---

### 4. **GET** `/api/dashboard/employees-by-position`

**Mô tả:** Lấy thống kê nhân viên theo chức danh

**Response:**

```json
{
  "success": true,
  "message": "Lấy thống kê nhân viên theo chức danh thành công",
  "data": [
    {
      "MaChucDanh": 1,
      "TenChucDanh": "Trưởng phòng",
      "SoNhanVien": 8,
      "LuongTrungBinh": 18000000
    },
    {
      "MaChucDanh": 2,
      "TenChucDanh": "Phó phòng",
      "SoNhanVien": 12,
      "LuongTrungBinh": 14000000
    }
  ]
}
```

---

### 5. **GET** `/api/dashboard/projects`

**Mô tả:** Lấy thống kê dự án (tất cả dự án với thông tin chi tiết)

**Response:**

```json
{
  "success": true,
  "message": "Lấy thống kê dự án thành công",
  "data": [
    {
      "MADA": 1,
      "TENDA": "Dự án A",
      "TrangThai": "Đang thực hiện",
      "NgayBatDau": "2026-01-15",
      "NgayKetThuc": "2026-06-30",
      "SoThanhVien": 5,
      "TrangThaiThangHan": "Còn thời hạn"
    }
  ]
}
```

---

### 6. **GET** `/api/dashboard/projects-near-deadline`

**Mô tả:** Lấy 5 dự án gần deadline nhất

**Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách dự án gần deadline thành công",
  "data": [
    {
      "MADA": 5,
      "TENDA": "Dự án gần hạn",
      "NgayKetThuc": "2026-04-15",
      "SoNgayConLai": 16,
      "TrangThai": "Đang thực hiện",
      "MucDoDoUuTien": "Sắp hết hạn"
    }
  ]
}
```

---

### 7. **GET** `/api/dashboard/payroll-statistics`

**Mô tả:** Lấy thống kê lương theo tháng

**Query Parameters:**

- `thang` (optional) - Tháng (1-12)
- `nam` (optional) - Năm

**Response:**

```json
{
  "success": true,
  "message": "Lấy thống kê lương thành công",
  "data": [
    {
      "Thang": 3,
      "Nam": 2026,
      "SoNhanVienTinhLuong": 50,
      "TongLuongCoBan": 625000000,
      "TongPhuCap": 50000000,
      "TongThuong": 25000000,
      "TongKhauTruBHXH": 31250000,
      "TongThucLanh": 668750000,
      "LuongTrungBinh": 13375000
    }
  ]
}
```

---

### 8. **GET** `/api/dashboard/payroll-trendline`

**Mô tả:** Lấy trendline lương 6 tháng gần nhất

**Response:**

```json
{
  "success": true,
  "message": "Lấy trendline lương thành công",
  "data": [
    {
      "Thang": 10,
      "Nam": 2025,
      "TongThucLanh": 600000000,
      "LuongTrungBinh": 12000000,
      "SoNhanVienTinhLuong": 50
    },
    {
      "Thang": 11,
      "Nam": 2025,
      "TongThucLanh": 620000000,
      "LuongTrungBinh": 12400000,
      "SoNhanVienTinhLuong": 50
    }
  ]
}
```

---

### 12. **GET** `/api/dashboard/realtime`

**Mô tả:** Dashboard nhân sự realtime (dùng CTE/bảng ảo SQL), trả nhanh các số liệu tổng hợp hiện tại.

**Response:**

```json
{
  "success": true,
  "message": "Lấy dashboard nhân sự realtime thành công",
  "data": {
    "quickStats": {
      "TotalEmployees": 50,
      "OfficialEmployees": 42,
      "NonOfficialEmployees": 8,
      "AvgSalary": 12500000,
      "TotalSalary": 625000000,
      "TotalProjects": 20,
      "ActiveProjects": 12,
      "CompletedProjects": 8,
      "PendingLeaves": 3,
      "ApprovedLeaves": 18,
      "TotalDepartments": 8,
      "GeneratedAt": "2026-03-30T14:10:00.000Z"
    },
    "departmentHeadcount": [
      {
        "MAPHG": 1,
        "TENPB": "Phòng IT",
        "EmployeeCount": 15,
        "AvgSalary": 15000000
      }
    ],
    "projectStatus": [
      {
        "TrangThai": "Đang thực hiện",
        "SoLuong": 12
      }
    ],
    "attendanceToday": {
      "CheckedInToday": 41,
      "TotalEmployees": 50,
      "AttendanceRate": 82.0
    }
  }
}
```

---

### 9. **GET** `/api/dashboard/project-trendline`

**Mô tả:** Lấy trendline dự án (số dự án theo trạng thái)

**Response:**

```json
{
  "success": true,
  "message": "Lấy trendline dự án thành công",
  "data": [
    {
      "TrangThai": "Đang thực hiện",
      "SoDuAn": 12,
      "DoUuTien": 1
    },
    {
      "TrangThai": "Hoàn thành",
      "SoDuAn": 8,
      "DoUuTien": 2
    }
  ]
}
```

---

### 10. **GET** `/api/dashboard/recent-activities`

**Mô tả:** Lấy hoạt động gần đây (nhân viên mới, dự án mới, v.v.)

**Response:**

```json
{
  "success": true,
  "message": "Lấy hoạt động gần đây thành công",
  "data": [
    {
      "DoUuTien": 1,
      "LoaiHoatDong": "Nhân viên mới",
      "MaDoiTuong": "NV001",
      "TenDoiTuong": "Trần Văn B",
      "ThoiGian": "2026-03-20T10:30:00.000Z",
      "Loai": "Nhân viên"
    },
    {
      "DoUuTien": 2,
      "LoaiHoatDong": "Dự án mới",
      "MaDoiTuong": "1",
      "TenDoiTuong": "Dự án mới",
      "ThoiGian": "2026-03-19T14:00:00.000Z",
      "Loai": "Dự án"
    }
  ]
}
```

---

### 11. **GET** `/api/dashboard/report`

**Mô tả:** Lấy báo cáo dashboard đầy đủ (dành cho Admin)

**Response:**

```json
{
  "success": true,
  "message": "Lấy báo cáo dashboard thành công",
  "data": {
    "summary": [...],
    "departmentStats": [...],
    "projectStats": [...],
    "payrollStats": [...],
    "positionStats": [...],
    "projectTrendline": [...],
    "generatedAt": "2026-03-30T10:00:00.000Z"
  }
}
```

---

## 📊 Ứng Dụng Thực Tế

### Dashboard Nhân Sự (HR Dashboard)

- Sử dụng: `/api/dashboard/summary`, `/api/dashboard/employees-by-department`, `/api/dashboard/employees-by-position`
- Hiển thị: Tổng số nhân viên, phân bố theo phòng ban, chức danh

### Dashboard Quản Lý Dự án (Project Manager)

- Sử dụng: `/api/dashboard/projects`, `/api/dashboard/projects-near-deadline`, `/api/dashboard/project-trendline`
- Hiển thị: Danh sách dự án, dự án gần deadline, trendline dự án

### Dashboard Tài Chính (Finance)

- Sử dụng: `/api/dashboard/payroll-statistics`, `/api/dashboard/payroll-trendline`
- Hiển thị: Thống kê lương, trendline lương 6 tháng

### Dashboard Admin (Báo cáo toàn hệ thống)

- Sử dụng: `/api/dashboard/report`
- Hiển thị: Tất cả thống kê, báo cáo chi tiết, export PDF

---

## 🔄 Công Nghệ Sử Dụng

### SQL Views (Bảng Ảo)

- `VW_DASHBOARD_SUMMARY` - Tóm tắt tổng quát
- `VW_NHANVIEN_THEO_PHONGBAN` - Thống kê theo phòng ban
- `VW_NHANVIEN_THEO_CHUCDANH` - Thống kê theo chức danh
- `VW_DUAN_THONGKE` - Thống kê dự án
- `VW_DUAN_GANNHAT_DEADLINE` - Dự án gần deadline
- `VW_THONGKE_LUONG_THANG` - Thống kê lương
- `VW_HOATDONG_GANDDAY` - Hoạt động gần đây

### Architecture

```
Router (dashboardRoutes.ts)
    ↓
Controller (dashboardController.ts)
    ↓
Service (dashboardService.ts)
    ↓
Repository (dashboardRepository.ts)
    ↓
Database (SQL Views + Tables)
```

---

## ✅ Cài Đặt

### 1. Tạo SQL Views

Chạy file `database/create-dashboard-views.sql` trong SQL Server

### 2. Khởi động Server

```bash
npm start
```

### 3. Truy cập Dashboard API

```
http://localhost:5000/api/dashboard/main
```

---

## 📈 Lợi Ích

✅ Tối ưu hóa hiệu suất với SQL Views  
✅ Dễ dàng tích hợp với Frontend  
✅ Cấu trúc dễ mở rộng  
✅ Hỗ trợ báo cáo chi tiết  
✅ Dữ liệu real-time

---

## 🚀 Phát Triển Tiếp Theo

- [ ] Thêm Export PDF cho báo cáo
- [ ] Thêm Filter theo ngày tháng
- [ ] Thêm Chart visualization
- [ ] Thêm Email notification cho deadline gần
- [ ] Thêm Permission control cho từng role
