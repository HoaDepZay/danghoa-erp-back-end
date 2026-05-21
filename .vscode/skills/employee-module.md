# SKILL: Employee Management Module

**Scope**: Employee CRUD operations, working hours calculation, filtering, employee relationships

**Apply to**: Any work on `employeeController.ts`, `employeeService.ts`, `employeeRepository.ts`, `employeeRoutes.ts`

**Files**: `controllers/employeeController.ts`, `services/employeeService.ts`, `repositories/employeeRepository.ts`, `routers/employee.ts`

---

## 👥 Employee Data Model

### **Key Columns in NHAN_VIEN Table**

```sql
MANV          -- Employee ID (PK)
HOTEN         -- Full name
EMAIL         -- Email address
CHUCVU        -- Position/Title
LUONG_CO_BAN  -- Base salary
NGAY_TUYEN_DUNG -- Hire date
NGAY_SINH     -- Date of birth
GIOI_TINH     -- Gender (M/F)
DIA_CHI       -- Address
MAPHG         -- Department ID (FK)
TRANG_THAI    -- Status (ACTIVE, INACTIVE, ON_LEAVE)
PHUC_AP       -- Allowances/Benefits
NGAY_TAO      -- Created date
NGAY_CAP_NHAT -- Updated date
```

---

## 📋 Core Operations

### **1. Get All Employees (With Pagination)**

```typescript
// employeeService.ts
const getAll = async (page: number = 1, pageSize: number = 10) => {
  // Validate pagination
  if (page < 1) throw new Error("Page must be >= 1");
  if (pageSize < 1 || pageSize > 100) {
    throw new Error("PageSize must be 1-100");
  }

  const offset = (page - 1) * pageSize;
  const data = await employeeRepository.getPage(offset, pageSize);
  return data;
};

// employeeRepository.ts
const getPage = async (offset: number, pageSize: number) => {
  const result = await appPool
    .request()
    .input("Offset", sql.Int, offset)
    .input("PageSize", sql.Int, pageSize).query(`
      SELECT MANV, HOTEN, EMAIL, CHUCVU, LUONG_CO_BAN, NGAY_TUYEN_DUNG, MAPHG
      FROM NHAN_VIEN
      ORDER BY MANV
      OFFSET @Offset ROWS
      FETCH NEXT @PageSize ROWS ONLY
    `);
  return result.recordset;
};

// employeeController.ts
const getAll = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(req.query.pageSize) || 10),
    );

    const data = await employeeService.getAll(page, pageSize);
    res.json({
      success: true,
      data,
      page,
      pageSize,
      message: `Retrieved ${data.length} employees`,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### **2. Get Employee By ID**

```typescript
// employeeService.ts
const getById = async (manv: string) => {
  if (!manv?.trim()) {
    throw new Error("MANV is required");
  }

  const employee = await employeeRepository.getByMaNV(manv);
  if (!employee) {
    throw new Error(`Employee ${manv} not found`);
  }

  return employee;
};

// employeeRepository.ts
const getByMaNV = async (manv: string) => {
  const result = await appPool
    .request()
    .input("MaNV", sql.VarChar, manv)
    .query("SELECT * FROM NHAN_VIEN WHERE MANV = @MaNV");
  return result.recordset[0] || null;
};

// employeeController.ts
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await employeeService.getById(id);
    res.json({ success: true, data });
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};
```

### **3. Create Employee**

```typescript
// employeeService.ts
const create = async (data: CreateEmployeeDTO) => {
  // 1. Validate required fields
  if (!data.manv?.trim()) throw new Error("MANV required");
  if (!data.hoten?.trim()) throw new Error("HoTen required");
  if (!data.email?.trim()) throw new Error("Email required");
  if (data.luong_co_ban < 0) throw new Error("Salary must be positive");

  // 2. Validate format
  if (data.manv.length > 10) throw new Error("MANV max 10 characters");
  if (!data.email.includes("@")) throw new Error("Invalid email format");

  // 3. Check duplicates
  const existing = await employeeRepository.getByMaNV(data.manv);
  if (existing) throw new Error("MANV already exists");

  const existingEmail = await employeeRepository.getByEmail(data.email);
  if (existingEmail) throw new Error("Email already registered");

  // 4. Transform data
  const processed = {
    ...data,
    ngay_tao: new Date(),
    trang_thai: "ACTIVE",
  };

  // 5. Persist
  return await employeeRepository.create(processed);
};

// employeeRepository.ts
const create = async (data: CreateEmployeeDTO) => {
  await appPool
    .request()
    .input("MaNV", sql.VarChar, data.manv)
    .input("HoTen", sql.NVarChar, data.hoten)
    .input("Email", sql.NVarChar, data.email)
    .input("ChucVu", sql.NVarChar, data.chucvu)
    .input("LuongCoBan", sql.Decimal(18, 2), data.luong_co_ban)
    .input("MaPhg", sql.VarChar, data.maphg)
    .input("NgayTuyenDung", sql.Date, new Date(data.ngay_tuyen_dung))
    .execute("sp_createEmployee");
};

// employeeController.ts
const create = async (req, res) => {
  try {
    const data = await employeeService.create(req.body);
    res.status(201).json({
      success: true,
      data,
      message: "Employee created successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### **4. Update Employee**

```typescript
// employeeService.ts
const update = async (manv: string, data: UpdateEmployeeDTO) => {
  // 1. Check employee exists
  const existing = await employeeRepository.getByMaNV(manv);
  if (!existing) throw new Error("Employee not found");

  // 2. Validate update fields
  if (data.email) {
    const otherEmail = await employeeRepository.getByEmail(data.email);
    if (otherEmail && otherEmail.manv !== manv) {
      throw new Error("Email already used by another employee");
    }
  }

  if (data.luong_co_ban !== undefined && data.luong_co_ban < 0) {
    throw new Error("Salary must be positive");
  }

  // 3. Merge with existing
  const updated = { ...existing, ...data };

  // 4. Persist
  return await employeeRepository.update(manv, updated);
};

// employeeRepository.ts
const update = async (manv: string, data: Partial<Employee>) => {
  const request = appPool.request().input("MaNV", sql.VarChar, manv);

  if (data.hoten !== undefined) {
    request.input("HoTen", sql.NVarChar, data.hoten);
  }
  if (data.email !== undefined) {
    request.input("Email", sql.NVarChar, data.email);
  }
  if (data.luong_co_ban !== undefined) {
    request.input("LuongCoBan", sql.Decimal(18, 2), data.luong_co_ban);
  }
  // ... more fields

  await request.execute("sp_updateEmployee");
};

// employeeController.ts
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await employeeService.update(id, req.body);
    res.json({ success: true, data, message: "Employee updated" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### **5. Delete Employee**

```typescript
// employeeService.ts
const delete = async (manv: string) => {
  // 1. Check exists
  const existing = await employeeRepository.getByMaNV(manv);
  if (!existing) throw new Error("Employee not found");

  // 2. Check dependencies (projects, payroll)
  const projects = await projectRepository.getByEmployee(manv);
  if (projects.length > 0) {
    throw new Error("Cannot delete: Employee assigned to projects");
  }

  // 3. Soft delete (mark as INACTIVE) or hard delete
  // Soft delete is safer for HR systems
  return await employeeRepository.softDelete(manv);
};

// employeeRepository.ts
const softDelete = async (manv: string) => {
  await appPool
    .request()
    .input("MaNV", sql.VarChar, manv)
    .execute("sp_softDeleteEmployee"); // Sets TRANG_THAI = 'INACTIVE'
};

// employeeController.ts
const delete = async (req, res) => {
  try {
    const { id } = req.params;
    await employeeService.delete(id);
    res.json({ success: true, message: "Employee deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

---

## ⏱️ Working Hours Calculation

### **Using Database Function**

```typescript
// employeeService.ts
const getWorkingHours = async (manv: string, month: number, year: number) => {
  // Validate inputs
  if (!manv?.trim()) throw new Error("MANV required");
  if (month < 1 || month > 12) throw new Error("Month must be 1-12");
  if (year < 2020 || year > 2030) throw new Error("Invalid year");

  const hours = await employeeRepository.getWorkingHours(manv, month, year);
  return hours;
};

// employeeRepository.ts
const getWorkingHours = async (manv: string, month: number, year: number) => {
  const result = await appPool
    .request()
    .input("MaNV", sql.VarChar, manv)
    .input("Thang", sql.Int, month)
    .input("Nam", sql.Int, year)
    .query(
      "SELECT dbo.fn_TinhSoGioLamViec(@MaNV, @Thang, @Nam) AS TongGioLamViec",
    );

  return Number(result.recordset[0]?.TongGioLamViec || 0);
};
```

**Note**: The `fn_TinhSoGioLamViec` function is in the database. It calculates total working hours based on BAN_CHAM_CONG (attendance) records.

---

## 🔗 Employee Relationships

### **Get Employee's Projects**

```typescript
// employeeService.ts
const getProjects = async (manv: string) => {
  const employee = await employeeRepository.getByMaNV(manv);
  if (!employee) throw new Error("Employee not found");

  return await employeeRepository.getProjectsByEmployee(manv);
};

// employeeRepository.ts
const getProjectsByEmployee = async (manv: string) => {
  const result = await appPool.request().input("MaNV", sql.VarChar, manv)
    .query(`
      SELECT p.* FROM DU_AN p
      INNER JOIN THAM_GIA_DU_AN tg ON p.MADA = tg.MADA
      WHERE tg.MANV = @MaNV
      ORDER BY p.NGAY_BAT_DAU DESC
    `);
  return result.recordset;
};

// employeeController.ts
const getProjects = async (req, res) => {
  try {
    const { manv } = req.params;
    const data = await employeeService.getProjects(manv);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### **Get Coworkers in Same Department**

```typescript
// employeeService.ts
const getCoworkers = async (manv: string) => {
  const employee = await employeeRepository.getByMaNV(manv);
  if (!employee) throw new Error("Employee not found");

  return await employeeRepository.getByDepartment(employee.maphg);
};

// employeeRepository.ts
const getByDepartment = async (maphg: string) => {
  const result = await appPool
    .request()
    .input("MaPhg", sql.VarChar, maphg)
    .query(
      "SELECT * FROM NHAN_VIEN WHERE MAPHG = @MaPhg AND TRANG_THAI = 'ACTIVE'",
    );
  return result.recordset;
};
```

---

## 🔍 Filtering & Search

### **Filter by Department**

```typescript
// employeeRepository.ts
const getByDepartment = async (
  maphg: string,
  offset: number,
  pageSize: number,
) => {
  const result = await appPool
    .request()
    .input("MaPhg", sql.VarChar, maphg)
    .input("Offset", sql.Int, offset)
    .input("PageSize", sql.Int, pageSize).query(`
      SELECT * FROM NHAN_VIEN
      WHERE MAPHG = @MaPhg
      ORDER BY HOTEN
      OFFSET @Offset ROWS
      FETCH NEXT @PageSize ROWS ONLY
    `);
  return result.recordset;
};
```

### **Filter by Status**

```typescript
// employeeRepository.ts
const getByStatus = async (
  trangThai: string,
  offset: number,
  pageSize: number,
) => {
  const result = await appPool
    .request()
    .input("TrangThai", sql.NVarChar, trangThai)
    .input("Offset", sql.Int, offset)
    .input("PageSize", sql.Int, pageSize).query(`
      SELECT * FROM NHAN_VIEN
      WHERE TRANG_THAI = @TrangThai
      ORDER BY HOTEN
      OFFSET @Offset ROWS
      FETCH NEXT @PageSize ROWS ONLY
    `);
  return result.recordset;
};
```

---

## 📊 Employee Statistics

### **Get Department Headcount**

```typescript
const getHeadcount = async (maphg: string) => {
  const result = await appPool.request().input("MaPhg", sql.VarChar, maphg)
    .query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN TRANG_THAI = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN TRANG_THAI = 'ON_LEAVE' THEN 1 ELSE 0 END) as on_leave
      FROM NHAN_VIEN
      WHERE MAPHG = @MaPhg
    `);
  return result.recordset[0];
};
```

---

## 🎯 Common Mistakes to Avoid

- ❌ Not checking employee exists before update/delete
- ❌ Missing duplicate checks for MANV and Email
- ❌ Not paginating large employee lists (can be 1000+ records)
- ❌ Returning all columns (select only needed ones)
- ❌ Not validating salary is positive
- ❌ Hard deleting employees (use soft delete - mark as INACTIVE)
- ❌ Not checking dependencies before deleting
- ❌ Assuming date formats without validation
- ❌ Not handling MANV case sensitivity (should be uppercase)
- ❌ Forgetting to format dates for SQL Server (use `new Date()`)
