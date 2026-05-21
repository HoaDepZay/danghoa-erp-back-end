# SKILL: Payroll & Attendance Module

**Scope**: Payroll calculations, salary processing, working hours, check-in/check-out, attendance tracking

**Apply to**: Any work on `payrollController.ts`, `payrollService.ts`, `payrollRepository.ts`, `payrollRoutes.ts`

**Files**: `controllers/payrollController.ts`, `services/payrollService.ts`, `repositories/payrollRepository.ts`, `routers/payrollRoutes.ts`

---

## 💰 Payroll Data Model

### **BAN_LUONG Table (Monthly Payroll)**

```sql
MABL          -- Payroll record ID (PK)
MANV          -- Employee ID (FK)
THANG         -- Month (1-12)
NAM           -- Year
SO_NGAY_CONG  -- Working days
LUONG_CO_BAN  -- Base salary
PHU_CAP       -- Allowances
THUONG        -- Bonus
KHAUTHRU_BHXH -- Health insurance deduction
THUC_LANH     -- Take-home pay
NGAY_TAO      -- Created date
```

### **Salary Calculation Formula**

```
THUC_LANH = LUONG_CO_BAN + PHU_CAP + THUONG - KHAUTHRU_BHXH
```

### **BAN_CHAM_CONG Table (Attendance)**

```sql
MACCG         -- Attendance record ID (PK)
MANV          -- Employee ID (FK)
NGAY          -- Date
GIO_CHECKIN   -- Check-in time
GIO_CHECKOUT  -- Check-out time
TRANG_THAI    -- Status (PRESENT, ABSENT, LEAVE, HALF_DAY)
```

---

## 📊 Core Payroll Operations

### **1. Generate Monthly Payroll (Bulk)**

```typescript
// payrollService.ts
const generatePayroll = async (month: number, year: number) => {
  // 1. Validate month/year
  if (month < 1 || month > 12) throw new Error("Invalid month");
  if (year < 2020 || year > 2030) throw new Error("Invalid year");

  // 2. Check if already generated
  const existing = await payrollRepository.getPayrollByMonth(month, year);
  if (existing.length > 0) {
    throw new Error(`Payroll already generated for ${month}/${year}`);
  }

  // 3. Get raw data
  const rawData = await payrollRepository.getRawDataForPayroll(month, year);
  if (rawData.length === 0) {
    throw new Error("No employees found for payroll");
  }

  // 4. Calculate for each employee
  const processedData = rawData.map((emp) => {
    const workingHours = emp.SO_GIO_LAM_VIEC || 160; // Default 160 hours per month
    const baseSalary = emp.LUONG_CO_BAN || 0;
    const allowances = emp.PHU_CAP || 0;
    const bonus = emp.THUONG || 0;
    const deduction = emp.KHAUTHRU_BHXH || 0;

    // Calculate take-home
    const takehome = baseSalary + allowances + bonus - deduction;

    return {
      manv: emp.MANV,
      thang: month,
      nam: year,
      songaycong: workingHours,
      luongcoban: baseSalary,
      phucap: allowances,
      thuong: bonus,
      khautru: deduction,
      thuclanh: takehome,
    };
  });

  // 5. Bulk insert
  const transaction = await appPool.transaction();
  try {
    for (const record of processedData) {
      await payrollRepository.createPayrollRecord(record, transaction);
    }
    await transaction.commit();
    return { success: true, count: processedData.length };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// payrollRepository.ts
const getRawDataForPayroll = async (month: number, year: number) => {
  const result = await appPool
    .request()
    .input("Thang", sql.Int, month)
    .input("Nam", sql.Int, year)
    .execute("sp_getRawDataForPayroll");
  return result.recordset;
};

const createPayrollRecord = async (data, transactionRequest = null) => {
  const request = transactionRequest || appPool.request();
  await request
    .input("MaNV", sql.VarChar, data.manv)
    .input("Thang", sql.Int, data.thang)
    .input("Nam", sql.Int, data.nam)
    .input("SoNgayCong", sql.Float, data.songaycong)
    .input("LuongCoBan", sql.Decimal(18, 2), data.luongcoban)
    .input("PhuCap", sql.Decimal(18, 2), data.phucap)
    .input("Thuong", sql.Decimal(18, 2), data.thuong || 0)
    .input("KhauTruBHXH", sql.Decimal(18, 2), data.khautru || 0)
    .input("ThucLanh", sql.Decimal(18, 2), data.thuclanh)
    .execute("sp_createPayrollRecord");
};

// payrollController.ts
const generate = async (req, res) => {
  try {
    const { month, year } = req.body;
    const result = await payrollService.generatePayroll(month, year);
    res.json({
      success: true,
      message: `Generated payroll for ${result.count} employees`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### **2. Get Monthly Payroll**

```typescript
// payrollService.ts
const getPayrollByMonth = async (month: number, year: number) => {
  if (month < 1 || month > 12) throw new Error("Invalid month");
  if (year < 2020 || year > 2030) throw new Error("Invalid year");

  const data = await payrollRepository.getPayrollByMonth(month, year);
  if (data.length === 0) {
    throw new Error(`No payroll found for ${month}/${year}`);
  }

  // Calculate summary statistics
  const summary = {
    totalEmployees: data.length,
    totalSalary: data.reduce((sum, e) => sum + (e.LUONG_CO_BAN || 0), 0),
    totalAllowances: data.reduce((sum, e) => sum + (e.PHU_CAP || 0), 0),
    totalBonus: data.reduce((sum, e) => sum + (e.THUONG || 0), 0),
    totalDeductions: data.reduce((sum, e) => sum + (e.KHAUTHRU_BHXH || 0), 0),
    totalTakehome: data.reduce((sum, e) => sum + (e.THUC_LANH || 0), 0),
    averageSalary: Math.round(
      data.reduce((sum, e) => sum + (e.LUONG_CO_BAN || 0), 0) / data.length,
    ),
  };

  return { data, summary };
};

// payrollRepository.ts
const getPayrollByMonth = async (month: number, year: number) => {
  const result = await appPool
    .request()
    .input("Thang", sql.Int, month)
    .input("Nam", sql.Int, year)
    .execute("sp_getPayrollByMonth");
  return result.recordset;
};

// payrollController.ts
const getByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;
    const result = await payrollService.getPayrollByMonth(
      parseInt(month),
      parseInt(year),
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### **3. Get Employee Payslip (Individual)**

```typescript
// payrollService.ts
const getEmployeePayslip = async (
  manv: string,
  month: number,
  year: number,
) => {
  if (!manv?.trim()) throw new Error("MANV required");
  if (month < 1 || month > 12) throw new Error("Invalid month");

  const payslip = await payrollRepository.getEmployeePayslip(manv, month, year);
  if (!payslip) {
    throw new Error(`No payslip found for ${manv} in ${month}/${year}`);
  }

  // Format for display
  return {
    manv: payslip.MANV,
    hoten: payslip.HOTEN,
    chucvu: payslip.CHUCVU,
    month: payslip.THANG,
    year: payslip.NAM,
    earnings: {
      baseSalary: payslip.LUONG_CO_BAN,
      allowances: payslip.PHU_CAP,
      bonus: payslip.THUONG,
      total: payslip.LUONG_CO_BAN + payslip.PHU_CAP + payslip.THUONG,
    },
    deductions: {
      healthInsurance: payslip.KHAUTHRU_BHXH,
      tax: payslip.THUE || 0,
      total: (payslip.KHAUTHRU_BHXH || 0) + (payslip.THUE || 0),
    },
    takehome: payslip.THUC_LANH,
  };
};

// payrollRepository.ts
const getEmployeePayslip = async (
  manv: string,
  month: number,
  year: number,
) => {
  const result = await appPool
    .request()
    .input("MaNV", sql.VarChar, manv)
    .input("Thang", sql.Int, month)
    .input("Nam", sql.Int, year)
    .execute("sp_getEmployeePayslip");
  return result.recordset[0] || null;
};
```

### **4. Update Payroll Record**

```typescript
// payrollService.ts
const updatePayroll = async (mabl: number, data: UpdatePayrollDTO) => {
  // Get existing record
  const existing = await payrollRepository.getPayrollById(mabl);
  if (!existing) {
    throw new Error("Payroll record not found");
  }

  // Validate updates
  if (data.thuong !== undefined && data.thuong < 0) {
    throw new Error("Bonus cannot be negative");
  }
  if (data.khautrubhxh !== undefined && data.khautrubhxh < 0) {
    throw new Error("Deduction cannot be negative");
  }

  // Recalculate take-home if needed
  if (data.thuong !== undefined || data.khautrubhxh !== undefined) {
    const bonus = data.thuong ?? existing.THUONG;
    const deduction = data.khautrubhxh ?? existing.KHAUTHRU_BHXH;

    data.thuclanh =
      existing.LUONG_CO_BAN + existing.PHU_CAP + bonus - deduction;
  }

  return await payrollRepository.updatePayrollRecord(mabl, data);
};

// payrollRepository.ts
const updatePayrollRecord = async (
  mabl: number,
  data: Partial<PayrollRecord>,
) => {
  const request = appPool.request().input("MaBL", sql.Int, mabl);

  if (data.thuong !== undefined) {
    request.input("Thuong", sql.Decimal(18, 2), data.thuong);
  }
  if (data.khautrubhxh !== undefined) {
    request.input("KhauTruBHXH", sql.Decimal(18, 2), data.khautrubhxh);
  }
  if (data.thuclanh !== undefined) {
    request.input("ThucLanh", sql.Decimal(18, 2), data.thuclanh);
  }

  await request.execute("sp_updatePayrollRecord");
};
```

### **5. Close Payroll for Employee**

```typescript
// payrollService.ts
const closePayrollForEmployee = async (manv: string, bonus: number = 0) => {
  // Validate
  if (!manv?.trim()) throw new Error("MANV required");
  if (bonus < 0) throw new Error("Bonus cannot be negative");

  // Check employee exists
  const employee = await employeeRepository.getByMaNV(manv);
  if (!employee) throw new Error("Employee not found");

  // Close payroll (locks it)
  await payrollRepository.closePayrollForSpecifiedEmployee(manv, bonus);
  return { success: true, message: `Payroll closed for ${manv}` };
};

// payrollRepository.ts
const closePayrollForSpecifiedEmployee = async (
  manv: string,
  thuong: number = 0,
) => {
  await appPool
    .request()
    .input("MaNV", sql.VarChar, manv)
    .input("Thuong", sql.Decimal(18, 2), thuong)
    .execute("sp_ChotLuongNhanVienChiDinh");
};
```

---

## ⏱️ Attendance & Check-in/Check-out

### **Check-in**

```typescript
// payrollService.ts
const checkIn = async (manv: string) => {
  if (!manv?.trim()) throw new Error("MANV required");

  // Verify employee exists and is active
  const employee = await employeeRepository.getByMaNV(manv);
  if (!employee) throw new Error("Employee not found");
  if (employee.trang_thai !== "ACTIVE") {
    throw new Error("Employee is not active");
  }

  // Check if already checked in today
  const checkedIn = await payrollRepository.getAttendanceByEmployeeToday(manv);
  if (checkedIn.length > 0 && checkedIn[0].GIO_CHECKIN) {
    throw new Error("Already checked in today");
  }

  // Execute check-in
  return await payrollRepository.checkIn(manv);
};

// payrollRepository.ts
const checkIn = async (manv: string) => {
  const result = await appPool
    .request()
    .input("MaNV", sql.VarChar, manv)
    .output("Result", sql.Int)
    .output("ErrorDetail", sql.NVarChar(500))
    .execute("sp_CheckIn");

  return {
    success: result.output.Result === 1,
    result: result.output.Result,
    message: result.output.ErrorDetail,
  };
};
```

### **Check-out**

```typescript
// payrollService.ts
const checkOut = async (manv: string) => {
  if (!manv?.trim()) throw new Error("MANV required");

  // Check if checked in
  const attendance = await payrollRepository.getAttendanceByEmployeeToday(manv);
  if (attendance.length === 0 || !attendance[0].GIO_CHECKIN) {
    throw new Error("No check-in record found for today");
  }

  // Execute check-out
  return await payrollRepository.checkOut(manv);
};

// payrollRepository.ts
const checkOut = async (manv: string) => {
  const result = await appPool
    .request()
    .input("MaNV", sql.VarChar, manv)
    .output("Result", sql.Int)
    .output("ErrorDetail", sql.NVarChar(500))
    .execute("sp_CheckOut");

  return {
    success: result.output.Result === 1,
    result: result.output.Result,
    message: result.output.ErrorDetail,
  };
};
```

### **Get Attendance Records**

```typescript
// payrollRepository.ts
const getAttendanceByEmployeeDay = async (manv: string, ngay: string) => {
  const result = await appPool
    .request()
    .input("MaNV", sql.VarChar, manv)
    .input("Ngay", sql.Date, new Date(ngay))
    .execute("sp_GetAttendanceByEmployeeDay");
  return result.recordset;
};

const getAttendanceByEmployeeMonth = async (manv: string) => {
  const result = await appPool
    .request()
    .input("MaNV", sql.VarChar, manv)
    .execute("sp_GetAttendanceByEmployeeMonth");
  return result.recordset;
};

const getAttendanceByEmployeeYear = async (manv: string) => {
  const result = await appPool
    .request()
    .input("MaNV", sql.VarChar, manv)
    .execute("sp_GetAttendanceByEmployeeYear");
  return result.recordset;
};
```

---

## 📈 Payroll Statistics

### **Get Payroll Statistics**

```typescript
// payrollService.ts
const getStatistics = async (month: number, year: number) => {
  return await payrollRepository.getPayrollStatistics(month, year);
};

// payrollRepository.ts
const getPayrollStatistics = async (month: number, year: number) => {
  const result = await appPool
    .request()
    .input("Thang", sql.Int, month)
    .input("Nam", sql.Int, year)
    .execute("sp_getPayrollStatistics");
  return result.recordset[0];
};
```

---

## 🎯 Common Mistakes to Avoid

- ❌ Not validating month/year before processing payroll
- ❌ Generating payroll twice for same month (check for existing records)
- ❌ Not recalculating take-home when bonus/deductions change
- ❌ Assuming all employees have worked full month (calculate based on attendance)
- ❌ Not checking employee status (ACTIVE vs INACTIVE) before check-in
- ❌ Allowing negative values for salary, bonus, or deductions
- ❌ Not using transactions for bulk payroll generation (can cause partial data)
- ❌ Not checking today's check-in before allowing checkout
- ❌ Using wrong date format for SQL Server (use `new Date()`)
- ❌ Not handling check-in failures (DB might reject duplicates)
