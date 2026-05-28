# 🚀 Dashboard Tính Năng - Hướng Dẫn Cài Đặt

## ✅ Những gì đã được tạo

### 1. **Database Layer** (`database/create-dashboard-views.sql`)

Đã tạo 7 SQL Views:

- `VW_DASHBOARD_SUMMARY` - Tóm tắt dashboard
- `VW_NHANVIEN_THEO_PHONGBAN` - Nhân viên theo phòng ban
- `VW_DUAN_THONGKE` - Thống kê dự án
- `VW_DUAN_GANNHAT_DEADLINE` - Dự án gần deadline
- `VW_THONGKE_LUONG_THANG` - Thống kê lương
- `VW_NHANVIEN_THEO_CHUCDANH` - Nhân viên theo chức danh
- `VW_HOATDONG_GANDDAY` - Hoạt động gần đây

### 2. **Repository Layer** (`repositories/dashboardRepository.ts`)

- 10 hàm để truy vấn dữ liệu từ views
- `getDashboardSummary()` - Lấy tóm tắt
- `getEmployeeByDepartment()` - Thống kê nhân viên theo phòng
- `getProjectStatistics()` - Thống kê dự án
- `getPayrollStatistics()` - Thống kê lương
- `getPayrollTrendline()` - Trendline lương
- `getProjectTrendline()` - Trendline dự án
- v.v.

### 3. **Service Layer** (`services/dashboardService.ts`)

- 11 hàm xử lý business logic
- Gọi Repository và format dữ liệu
- Xử lý lỗi và trả về response

### 4. **Controller Layer** (`controllers/dashboardController.ts`)

- 11 hàm xử lý HTTP requests
- Lấy query parameters
- Trả về JSON response

### 5. **Router** (`routers/dashboardRoutes.ts`)

- 11 routes đầy đủ API documentation
- GET endpoints cho tất cả features

### 6. **Server Integration** (`server.ts`)

- Thêm import: `import dashboardRoutes from "./routers/dashboardRoutes";`
- Thêm route: `app.use("/api/dashboard", dashboardRoutes);`

### 7. **Documentation** (`DASHBOARD_API.md`)

- API reference đầy đủ
- Response examples
- Hướng dẫn sử dụng

---

## 📋 Hướng Dẫn Cài Đặt

### Bước 1: Tạo SQL Views

**Mở SQL Server Management Studio và chạy:**

```sql
-- Copy nội dung từ database/create-dashboard-views.sql
-- Paste vào SQL Server
-- Chạy (F5)
```

**Hoặc dùng cmd:**

```bash
sqlcmd -S .\SQLEXPRESS -U sa -P YourPassword -d QuanTriNhanSu -i create-dashboard-views.sql
```

### Bước 2: Xác nhận Server.ts đã có Dashboard Route

**Kiểm tra `server.ts`** - phải có:

```typescript
import dashboardRoutes from "./routers/dashboardRoutes";
...
app.use("/api/dashboard", dashboardRoutes);
```

### Bước 3: Khởi động Server

```bash
npm start
```

### Bước 4: Test Endpoints

```bash
# Test Dashboard Summary
curl http://localhost:5000/api/dashboard/summary

# Test Main Dashboard
curl http://localhost:5000/api/dashboard/main

# Test Employees by Department
curl http://localhost:5000/api/dashboard/employees-by-department

# Test Projects
curl http://localhost:5000/api/dashboard/projects

# Test Payroll Statistics
curl "http://localhost:5000/api/dashboard/payroll-statistics?thang=3&nam=2026"
```

---

## 🎯 11 Endpoints Có Sẵn

| Endpoint                                     | Mô Tả                         |
| -------------------------------------------- | ----------------------------- |
| `GET /api/dashboard/summary`                 | Tóm tắt dashboard             |
| `GET /api/dashboard/main`                    | Dashboard chính (all-in-one)  |
| `GET /api/dashboard/employees-by-department` | Nhân viên theo phòng          |
| `GET /api/dashboard/employees-by-position`   | Nhân viên theo chức danh      |
| `GET /api/dashboard/projects`                | Thống kê dự án                |
| `GET /api/dashboard/projects-near-deadline`  | Dự án gần deadline (Top 5)    |
| `GET /api/dashboard/payroll-statistics`      | Thống kê lương                |
| `GET /api/dashboard/payroll-trendline`       | Trendline lương 6 tháng       |
| `GET /api/dashboard/project-trendline`       | Trendline dự án               |
| `GET /api/dashboard/recent-activities`       | Hoạt động gần đây             |
| `GET /api/dashboard/report`                  | Báo cáo toàn hệ thống (Admin) |

---

## 💡 Sử Dụng trên Frontend

### React Example:

```javascript
// Lấy Dashboard chính
const fetchDashboard = async () => {
  const response = await fetch("http://localhost:5000/api/dashboard/main");
  const data = await response.json();
  console.log(data.data.quickStats);
  console.log(data.data.departmentStats);
  console.log(data.data.projectStats);
};

// Lấy dự án gần deadline
const fetchDeadlineProjects = async () => {
  const response = await fetch(
    "http://localhost:5000/api/dashboard/projects-near-deadline",
  );
  const data = await response.json();
  return data.data;
};
```

### Vue Example:

```javascript
export default {
  data() {
    return {
      dashboard: null,
    };
  },
  methods: {
    async loadDashboard() {
      const response = await this.$http.get("/api/dashboard/main");
      this.dashboard = response.data.data;
    },
  },
  mounted() {
    this.loadDashboard();
  },
};
```

---

## 📊 Cấu Trúc File

```
BackEnd/
├── database/
│   └── create-dashboard-views.sql         ✅ NEW
├── repositories/
│   └── dashboardRepository.ts              ✅ NEW
├── services/
│   └── dashboardService.ts                 ✅ NEW
├── controllers/
│   └── dashboardController.ts              ✅ NEW
├── routers/
│   └── dashboardRoutes.ts                  ✅ NEW
├── server.ts                               ✏️ UPDATED
├── DASHBOARD_API.md                        ✅ NEW
└── DASHBOARD_SETUP.md                      ✅ NEW
```

---

## 🔍 Debug Tips

**Nếu endpoints không hoạt động:**

1. **Kiểm tra SQL Views đã tạo:**

```sql
SELECT * FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = 'dbo'
```

2. **Kiểm tra data trong views:**

```sql
SELECT * FROM VW_DASHBOARD_SUMMARY
SELECT * FROM VW_NHANVIEN_THEO_PHONGBAN
```

3. **Kiểm tra Database connection:**

```typescript
// Thêm vào dashboardRepository.ts
const result = await appPool.request().query("SELECT 1 AS test");
console.log("DB Connection OK:", result.recordset);
```

4. **Kiểm tra route registration:**

```bash
curl http://localhost:5000/api/dashboard/summary
# Nếu 404 -> Route chưa được register trong server.ts
```

---

## ⚡ Performance Tips

✅ Views được cache - không cần query logic phức tạp mỗi lần  
✅ Sử dụng JOIN tối ưu trong views  
✅ Có thể thêm indexes trên columns thường xuyên được sử dụng  
✅ Xem xét cache ở application layer cho dữ liệu không thay đổi thường xuyên

---

## 📈 Mở Rộng Tương Lai

### 1. Export PDF Report

```typescript
// Thêm vào dashboardController
exportPdfReport: async (req, res) => {
  // Sử dụng puppeteer hoặc pdfkit
};
```

### 2. Email Notification

```typescript
// Notify khi dự án gần deadline
const nearDeadline = await dashboardRepository.getProjectsNearDeadline();
nearDeadline.forEach((project) => {
  sendEmail(projectManager.email, `Alert: ${project.TENDA} sắp hết hạn`);
});
```

### 3. Real-time Updates (WebSocket)

```typescript
// Broadcast dashboard updates
io.emit("dashboard:updated", newData);
```

### 4. Advanced Filtering

```javascript
// Thêm query params
GET /api/dashboard/employees-by-department?sortBy=salary&order=desc
```

---

## ✅ Checklist Hoàn Thành

- [x] Tạo 7 SQL Views
- [x] Viết dashboardRepository.ts (10 functions)
- [x] Viết dashboardService.ts (11 functions)
- [x] Viết dashboardController.ts (11 endpoints)
- [x] Viết dashboardRoutes.ts (11 routes)
- [x] Update server.ts
- [x] Viết API documentation
- [x] Viết setup guide

---

## 🎉 Hoàn Tất!

**Dashboard feature đã sẵn sàng sử dụng. Hãy chạy setup và test endpoints ngay!**

Có câu hỏi? Xem `DASHBOARD_API.md` để biết chi tiết từng endpoint.
