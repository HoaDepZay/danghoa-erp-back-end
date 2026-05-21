# SKILL: Department Management Module

**Scope**: Department CRUD, organizational structure, department statistics

**Apply to**: Any work on `departmentController.ts`, `departmentService.ts`, `departmentRepository.ts`, `departmentRoutes.ts`

**Files**: `controllers/departmentController.ts`, `services/departmentService.ts`, `repositories/departmentRepository.ts`, `routers/departmentRoutes.ts`

---

## 🏢 Department Data Model

### **PHONG_BAN Table**

```sql
MAPHG         -- Department ID (PK)
TENPHG        -- Department name
DIADIEM       -- Location
MANV_TRUONG   -- Department head (FK to NHAN_VIEN)
NGAY_TAO      -- Created date
NGAY_CAP_NHAT -- Updated date
TRANG_THAI    -- Status (ACTIVE, INACTIVE)
```

---

## 📋 Core Operations

### **1. Get All Departments**

```typescript
// departmentService.ts
const getAll = async (page: number = 1, pageSize: number = 10) => {
  if (page < 1) throw new Error("Page must be >= 1");
  if (pageSize < 1 || pageSize > 100) throw new Error("PageSize 1-100");

  const offset = (page - 1) * pageSize;
  const data = await departmentRepository.getPage(offset, pageSize);

  // Get employee count for each department
  const withCounts = await Promise.all(
    data.map(async (dept) => {
      const count = await departmentRepository.getEmployeeCount(dept.maphg);
      return { ...dept, employeeCount: count };
    }),
  );

  return withCounts;
};

// departmentRepository.ts
const getPage = async (offset: number, pageSize: number) => {
  const result = await appPool
    .request()
    .input("Offset", sql.Int, offset)
    .input("PageSize", sql.Int, pageSize).query(`
      SELECT * FROM PHONG_BAN
      WHERE TRANG_THAI = 'ACTIVE'
      ORDER BY TENPHG
      OFFSET @Offset ROWS
      FETCH NEXT @PageSize ROWS ONLY
    `);
  return result.recordset;
};

const getEmployeeCount = async (maphg: string) => {
  const result = await appPool.request().input("MaPhg", sql.VarChar, maphg)
    .query(`
      SELECT COUNT(*) as cnt FROM NHAN_VIEN
      WHERE MAPHG = @MaPhg AND TRANG_THAI = 'ACTIVE'
    `);
  return result.recordset[0].cnt;
};

// departmentController.ts
const getAll = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(req.query.pageSize) || 10),
    );

    const data = await departmentService.getAll(page, pageSize);
    res.json({ success: true, data, page, pageSize });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### **2. Get Department By ID**

```typescript
// departmentService.ts
const getById = async (maphg: string) => {
  if (!maphg?.trim()) throw new Error("Department ID required");

  const dept = await departmentRepository.getByMaPhg(maphg);
  if (!dept) throw new Error("Department not found");

  // Get additional info
  const employees = await departmentRepository.getEmployeesByDepartment(maphg);
  const headInfo = dept.manv_truong
    ? await employeeRepository.getByMaNV(dept.manv_truong)
    : null;

  return {
    ...dept,
    employees,
    head: headInfo,
    employeeCount: employees.length,
  };
};

// departmentRepository.ts
const getByMaPhg = async (maphg: string) => {
  const result = await appPool
    .request()
    .input("MaPhg", sql.VarChar, maphg)
    .query("SELECT * FROM PHONG_BAN WHERE MAPHG = @MaPhg");
  return result.recordset[0] || null;
};

const getEmployeesByDepartment = async (maphg: string) => {
  const result = await appPool.request().input("MaPhg", sql.VarChar, maphg)
    .query(`
      SELECT MANV, HOTEN, CHUCVU, NGAY_TUYEN_DUNG
      FROM NHAN_VIEN
      WHERE MAPHG = @MaPhg AND TRANG_THAI = 'ACTIVE'
      ORDER BY HOTEN
    `);
  return result.recordset;
};
```

### **3. Create Department**

```typescript
// departmentService.ts
const create = async (data: CreateDepartmentDTO) => {
  // Validate
  if (!data.maphg?.trim()) throw new Error("Department ID required");
  if (!data.tenphg?.trim()) throw new Error("Department name required");
  if (data.maphg.length > 10) throw new Error("Department ID max 10 chars");

  // Check duplicate
  const existing = await departmentRepository.getByMaPhg(data.maphg);
  if (existing) throw new Error("Department ID already exists");

  // Validate department head if provided
  if (data.manv_truong) {
    const head = await employeeRepository.getByMaNV(data.manv_truong);
    if (!head) throw new Error("Department head not found");
  }

  // Create
  const processed = {
    ...data,
    ngay_tao: new Date(),
    trang_thai: "ACTIVE",
  };

  return await departmentRepository.create(processed);
};

// departmentRepository.ts
const create = async (data: CreateDepartmentDTO) => {
  await appPool
    .request()
    .input("MaPhg", sql.VarChar, data.maphg)
    .input("TenPhg", sql.NVarChar, data.tenphg)
    .input("DiaDiem", sql.NVarChar, data.diadiem || "")
    .input("ManvTruong", sql.VarChar, data.manv_truong || null)
    .execute("sp_createDepartment");
};

// departmentController.ts
const create = async (req, res) => {
  try {
    const data = await departmentService.create(req.body);
    res
      .status(201)
      .json({ success: true, data, message: "Department created" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### **4. Update Department**

```typescript
// departmentService.ts
const update = async (maphg: string, data: UpdateDepartmentDTO) => {
  // Check exists
  const existing = await departmentRepository.getByMaPhg(maphg);
  if (!existing) throw new Error("Department not found");

  // Validate new head if provided
  if (data.manv_truong && data.manv_truong !== existing.manv_truong) {
    const head = await employeeRepository.getByMaNV(data.manv_truong);
    if (!head) throw new Error("New department head not found");
  }

  // Update
  const updated = { ...existing, ...data };
  return await departmentRepository.update(maphg, updated);
};

// departmentRepository.ts
const update = async (maphg: string, data: Partial<Department>) => {
  const request = appPool.request().input("MaPhg", sql.VarChar, maphg);

  if (data.tenphg !== undefined) {
    request.input("TenPhg", sql.NVarChar, data.tenphg);
  }
  if (data.diadiem !== undefined) {
    request.input("DiaDiem", sql.NVarChar, data.diadiem);
  }
  if (data.manv_truong !== undefined) {
    request.input("ManvTruong", sql.VarChar, data.manv_truong || null);
  }
  if (data.trang_thai !== undefined) {
    request.input("TrangThai", sql.NVarChar, data.trang_thai);
  }

  await request.execute("sp_updateDepartment");
};

// departmentController.ts
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await departmentService.update(id, req.body);
    res.json({ success: true, data, message: "Department updated" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### **5. Delete Department**

```typescript
// departmentService.ts
const delete = async (maphg: string) => {
  // Check exists
  const existing = await departmentRepository.getByMaPhg(maphg);
  if (!existing) throw new Error("Department not found");

  // Check for employees
  const employees = await departmentRepository.getEmployeesByDepartment(maphg);
  if (employees.length > 0) {
    throw new Error("Cannot delete: Department has active employees");
  }

  // Check for projects
  const projects = await projectRepository.getByDepartment(maphg);
  if (projects.length > 0) {
    throw new Error("Cannot delete: Department has active projects");
  }

  // Soft delete
  return await departmentRepository.softDelete(maphg);
};

// departmentRepository.ts
const softDelete = async (maphg: string) => {
  await appPool
    .request()
    .input("MaPhg", sql.VarChar, maphg)
    .execute("sp_softDeleteDepartment"); // Sets TRANG_THAI = 'INACTIVE'
};

// departmentController.ts
const delete = async (req, res) => {
  try {
    const { id } = req.params;
    await departmentService.delete(id);
    res.json({ success: true, message: "Department deleted" });
  } catch (error) {
    const status = error.message.includes("Cannot delete") ? 409 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};
```

---

## 📊 Department Statistics

### **Get Department Summary**

```typescript
// departmentService.ts
const getSummary = async (maphg: string) => {
  const dept = await departmentRepository.getByMaPhg(maphg);
  if (!dept) throw new Error("Department not found");

  const employees = await departmentRepository.getEmployeesByDepartment(maphg);

  // Calculate statistics
  const totalSalary =
    await employeeRepository.getTotalSalaryByDepartment(maphg);
  const averageSalary =
    employees.length > 0 ? Math.round(totalSalary / employees.length) : 0;

  return {
    department: dept,
    employeeCount: employees.length,
    employees,
    totalSalary,
    averageSalary,
  };
};

// employeeRepository.ts
const getTotalSalaryByDepartment = async (maphg: string) => {
  const result = await appPool.request().input("MaPhg", sql.VarChar, maphg)
    .query(`
      SELECT SUM(LUONG_CO_BAN) as total FROM NHAN_VIEN
      WHERE MAPHG = @MaPhg AND TRANG_THAI = 'ACTIVE'
    `);
  return result.recordset[0].total || 0;
};
```

### **Get All Department Statistics**

```typescript
// departmentService.ts
const getAllStatistics = async () => {
  const departments = await departmentRepository.getAll();

  return await Promise.all(
    departments.map(async (dept) => {
      const employeeCount = await departmentRepository.getEmployeeCount(
        dept.maphg,
      );
      const totalSalary = await employeeRepository.getTotalSalaryByDepartment(
        dept.maphg,
      );

      return {
        maphg: dept.maphg,
        tenphg: dept.tenphg,
        diadiem: dept.diadiem,
        employeeCount,
        totalSalary,
        averageSalary:
          employeeCount > 0 ? Math.round(totalSalary / employeeCount) : 0,
      };
    }),
  );
};
```

---

## 🔗 Department Relationships

### **Get Department Head Info**

```typescript
// departmentRepository.ts
const getDepartmentWithHead = async (maphg: string) => {
  const result = await appPool.request().input("MaPhg", sql.VarChar, maphg)
    .query(`
      SELECT 
        p.*,
        nv.HOTEN, nv.EMAIL, nv.CHUCVU
      FROM PHONG_BAN p
      LEFT JOIN NHAN_VIEN nv ON p.MANV_TRUONG = nv.MANV
      WHERE p.MAPHG = @MaPhg
    `);
  return result.recordset[0] || null;
};
```

---

## 🎯 Common Mistakes to Avoid

- ❌ Not checking for employees before deleting department
- ❌ Not validating department head exists
- ❌ Allowing duplicate MAPHG values
- ❌ Not using soft delete (departments can be referenced historically)
- ❌ Not checking for projects assigned to department
- ❌ Hardcoding department locations without validation
- ❌ Not calculating accurate employee headcount (include status checks)
- ❌ Returning all columns unnecessarily
- ❌ Not validating department ID format
- ❌ Forgetting to mark as INACTIVE on deletion instead of hard delete
