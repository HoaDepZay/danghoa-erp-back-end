# SKILL: Dashboard & Analytics Module

**Scope**: Dashboard data aggregation, statistics, KPIs, real-time metrics

**Apply to**: Any work on `dashboardController.ts`, `dashboardService.ts`, `dashboardRepository.ts`, `dashboardRoutes.ts`

**Files**: `controllers/dashboardController.ts`, `services/dashboardService.ts`, `repositories/dashboardRepository.ts`, `routers/dashboardRoutes.ts`

---

## 📊 Dashboard Overview

The dashboard displays real-time company metrics and KPIs:

- **Employee Statistics**: Total employees, by status, by department
- **Department Metrics**: Headcount per department
- **Project Status**: Active, completed, overdue projects
- **Payroll Data**: Monthly payroll totals, average salary
- **Attendance**: Check-in/out statistics, attendance rate

---

## 🎯 Core Dashboard Operations

### **1. Get Dashboard Summary (Quick Overview)**

```typescript
// dashboardService.ts
const getSummary = async () => {
  // Get summary from stored procedure
  const data = await dashboardRepository.getDashboardSummary();

  if (!data) {
    throw new Error("Failed to retrieve dashboard data");
  }

  return {
    totalEmployees: data.TongNhanVien || 0,
    activeEmployees: data.NhanVienHoatDong || 0,
    totalDepartments: data.TongPhongBan || 0,
    totalProjects: data.TongDuAn || 0,
    activeProjects: data.DuAnDangChay || 0,
    completedProjects: data.DuAnHoanThanh || 0,
    timestamp: new Date(),
  };
};

// dashboardRepository.ts
const getDashboardSummary = async () => {
  const result = await appPool.request().execute("sp_getDashboardSummary");
  return result.recordset[0] || null;
};

// dashboardController.ts
const getSummary = async (req, res) => {
  try {
    const data = await dashboardService.getSummary();
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### **2. Get Full Dashboard Data (All Metrics)**

```typescript
// dashboardService.ts
const getFullDashboard = async () => {
  // Call stored procedure that returns multiple result sets
  const result = await dashboardRepository.getRealtimeDashboard();

  // Parse multiple result sets
  const summary = result[0][0]; // Quick stats
  const departments = result[1]; // Department headcount
  const projects = result[2]; // Project status
  const attendance = result[3]; // Attendance today
  const payrollStats = result[4]; // Payroll summary

  return {
    summary: {
      totalEmployees: summary.TongNhanVien,
      activeEmployees: summary.NhanVienHoatDong,
      onLeave: summary.NhanVienNghiPhep,
      totalDepartments: summary.TongPhongBan,
      totalProjects: summary.TongDuAn,
      activeProjects: summary.DuAnDangChay,
    },
    departments: departments.map((d) => ({
      maphg: d.MAPHG,
      tenphg: d.TENPHG,
      headcount: d.SoLuongNhanVien,
      totalSalary: d.TongLuong,
    })),
    projects: {
      planning: projects.filter((p) => p.TRANG_THAI === "PLANNING").length,
      inProgress: projects.filter((p) => p.TRANG_THAI === "IN_PROGRESS").length,
      completed: projects.filter((p) => p.TRANG_THAI === "COMPLETED").length,
      onHold: projects.filter((p) => p.TRANG_THAI === "ON_HOLD").length,
    },
    attendance: {
      checkedIn: attendance.filter((a) => a.GIO_CHECKIN).length,
      checkedOut: attendance.filter((a) => a.GIO_CHECKOUT).length,
      absent: attendance.filter((a) => a.TRANG_THAI === "ABSENT").length,
      rate: Math.round(
        (attendance.filter((a) => a.TRANG_THAI === "PRESENT").length /
          attendance.length) *
          100,
      ),
    },
    payroll: {
      thisMonthEmployees: payrollStats.SoNhanVienThang,
      averageSalary: payrollStats.LuongTrungBinh,
      totalPayroll: payrollStats.TongLuong,
    },
    timestamp: new Date(),
  };
};

// dashboardRepository.ts
const getRealtimeDashboard = async () => {
  const result = await appPool.request().execute("sp_getRealtimeDashboard");

  // Multiple result sets returned
  return [
    result.recordsets[0], // Summary
    result.recordsets[1], // Departments
    result.recordsets[2], // Projects
    result.recordsets[3], // Attendance
    result.recordsets[4], // Payroll
  ];
};

// dashboardController.ts
const getFullDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getFullDashboard();
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### **3. Get Payroll Statistics**

```typescript
// dashboardService.ts
const getPayrollStatistics = async (month: number, year: number) => {
  // Validate
  if (month < 1 || month > 12) throw new Error("Invalid month");
  if (year < 2020 || year > 2030) throw new Error("Invalid year");

  // Get from stored procedure
  const stats = await dashboardRepository.getPayrollStatistics(month, year);

  if (!stats) {
    throw new Error(`No payroll data for ${month}/${year}`);
  }

  return {
    month,
    year,
    employeeCount: stats.SoNhanVien || 0,
    totalBaseSalary: stats.TongLuongCoBan || 0,
    totalAllowances: stats.TongPhuCap || 0,
    totalBonus: stats.TongThuong || 0,
    totalDeductions: stats.TongKhauTru || 0,
    totalTakehome: stats.TongThucLanh || 0,
    averageSalary: stats.LuongTrungBinh || 0,
    maxSalary: stats.LuongMax || 0,
    minSalary: stats.LuongMin || 0,
  };
};

// dashboardRepository.ts
const getPayrollStatistics = async (month: number, year: number) => {
  const result = await appPool
    .request()
    .input("Thang", sql.Int, month)
    .input("Nam", sql.Int, year)
    .execute("sp_getPayrollStatistics");

  return result.recordset[0] || null;
};

// dashboardController.ts
const getPayrollStatistics = async (req, res) => {
  try {
    const { month, year } = req.params;
    const data = await dashboardService.getPayrollStatistics(
      parseInt(month),
      parseInt(year),
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

---

## 📈 Department Analytics

### **Get Department Breakdown**

```typescript
// dashboardService.ts
const getDepartmentAnalytics = async () => {
  const departments = await dashboardRepository.getDepartmentStats();

  return departments.map((dept) => ({
    maphg: dept.MAPHG,
    tenphg: dept.TENPHG,
    headcount: dept.SO_LUONG_NHAN_VIEN,
    activeEmployees: dept.SO_LUONG_HOAT_DONG,
    onLeave: dept.SO_LUONG_NGHI_PHEP,
    totalSalary: dept.TONG_LUONG,
    averageSalary: Math.round(dept.TONG_LUONG / dept.SO_LUONG_HOAT_DONG),
    projects: dept.SO_DU_AN,
  }));
};

// dashboardRepository.ts
const getDepartmentStats = async () => {
  const result = await appPool.request().query(`
      SELECT 
        p.MAPHG, p.TENPHG,
        COUNT(DISTINCT nv.MANV) as SO_LUONG_NHAN_VIEN,
        COUNT(DISTINCT CASE WHEN nv.TRANG_THAI = 'ACTIVE' THEN nv.MANV END) as SO_LUONG_HOAT_DONG,
        COUNT(DISTINCT CASE WHEN nv.TRANG_THAI = 'ON_LEAVE' THEN nv.MANV END) as SO_LUONG_NGHI_PHEP,
        SUM(nv.LUONG_CO_BAN) as TONG_LUONG,
        COUNT(DISTINCT da.MADA) as SO_DU_AN
      FROM PHONG_BAN p
      LEFT JOIN NHAN_VIEN nv ON p.MAPHG = nv.MAPHG
      LEFT JOIN DU_AN da ON p.MAPHG = da.MAPHG
      GROUP BY p.MAPHG, p.TENPHG
      ORDER BY SO_LUONG_NHAN_VIEN DESC
    `);

  return result.recordset;
};
```

---

## 📊 Project Analytics

### **Get Project Status Breakdown**

```typescript
// dashboardService.ts
const getProjectAnalytics = async () => {
  const projects = await dashboardRepository.getProjectStats();

  const grouped = {
    planning: projects.filter((p) => p.TRANG_THAI === "PLANNING"),
    inProgress: projects.filter((p) => p.TRANG_THAI === "IN_PROGRESS"),
    completed: projects.filter((p) => p.TRANG_THAI === "COMPLETED"),
    onHold: projects.filter((p) => p.TRANG_THAI === "ON_HOLD"),
    cancelled: projects.filter((p) => p.TRANG_THAI === "CANCELLED"),
  };

  return {
    total: projects.length,
    planning: {
      count: grouped.planning.length,
      projects: grouped.planning,
    },
    inProgress: {
      count: grouped.inProgress.length,
      projects: grouped.inProgress,
      overdue: grouped.inProgress.filter(
        (p) => new Date(p.NGAY_KET_THUC) < new Date(),
      ).length,
    },
    completed: {
      count: grouped.completed.length,
    },
    onHold: {
      count: grouped.onHold.length,
    },
  };
};

// dashboardRepository.ts
const getProjectStats = async () => {
  const result = await appPool.request().query(`
      SELECT 
        MADA, TENDA, TRANG_THAI, NGAY_BAT_DAU, NGAY_KET_THUC, NGAN_SACH,
        (SELECT COUNT(*) FROM THAM_GIA_DU_AN WHERE MADA = DU_AN.MADA) as TEAM_SIZE
      FROM DU_AN
      WHERE TRANG_THAI != 'CANCELLED'
      ORDER BY NGAY_BAT_DAU DESC
    `);

  return result.recordset;
};
```

---

## 📅 Attendance Analytics

### **Get Attendance Report**

```typescript
// dashboardService.ts
const getAttendanceReport = async (date?: string) => {
  const reportDate = date ? new Date(date) : new Date();

  const attendance = await dashboardRepository.getAttendanceByDate(reportDate);

  const report = {
    date: reportDate.toISOString().split("T")[0],
    total: attendance.length,
    present: attendance.filter((a) => a.TRANG_THAI === "PRESENT").length,
    absent: attendance.filter((a) => a.TRANG_THAI === "ABSENT").length,
    leave: attendance.filter((a) => a.TRANG_THAI === "LEAVE").length,
    halfDay: attendance.filter((a) => a.TRANG_THAI === "HALF_DAY").length,
    checkedIn: attendance.filter((a) => a.GIO_CHECKIN).length,
    checkedOut: attendance.filter((a) => a.GIO_CHECKOUT).length,
    attendanceRate: Math.round(
      (attendance.filter((a) => a.TRANG_THAI === "PRESENT").length /
        attendance.length) *
        100,
    ),
  };

  return report;
};

// dashboardRepository.ts
const getAttendanceByDate = async (date: Date) => {
  const result = await appPool.request().input("Ngay", sql.Date, date).query(`
      SELECT * FROM BAN_CHAM_CONG
      WHERE CAST(NGAY AS DATE) = @Ngay
      ORDER BY NGAY DESC
    `);

  return result.recordset;
};
```

---

## 📌 Common Dashboard Queries

### **Get Recently Updated Data**

```typescript
// Get recently added employees
const getRecentEmployees = async (days: number = 7) => {
  const result = await appPool.request().input("Days", sql.Int, days).query(`
      SELECT TOP 5 MANV, HOTEN, EMAIL, NGAY_TUYEN_DUNG
      FROM NHAN_VIEN
      WHERE NGAY_TAO >= DATEADD(DAY, -@Days, GETDATE())
      ORDER BY NGAY_TAO DESC
    `);

  return result.recordset;
};

// Get active projects
const getActiveProjects = async () => {
  const result = await appPool.request().query(`
      SELECT MADA, TENDA, NGAY_BAT_DAU, NGAY_KET_THUC,
        (SELECT COUNT(*) FROM THAM_GIA_DU_AN WHERE MADA = DU_AN.MADA) as TEAM_SIZE
      FROM DU_AN
      WHERE TRANG_THAI = 'IN_PROGRESS'
      ORDER BY NGAY_BAT_DAU
    `);

  return result.recordset;
};
```

---

## 🎯 Common Mistakes to Avoid

- ❌ Not validating month/year parameters
- ❌ Missing error handling for stored procedures with multiple result sets
- ❌ Calculating statistics in application instead of using database aggregation
- ❌ Not caching frequently accessed dashboard data (refreshed every 5-10 minutes)
- ❌ Returning excessive data when summary is requested
- ❌ Not handling division by zero (e.g., when no employees exist)
- ❌ Using current timestamp instead of consistent calculation period
- ❌ Not validating date ranges for reports
- ❌ Hardcoding date formats without consideration for timezones
- ❌ Missing error messages when data is unavailable
