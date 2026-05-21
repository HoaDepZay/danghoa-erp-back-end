# SKILL: General Architecture & Patterns

**Scope**: Fundamental patterns, 3-layer architecture, TypeScript best practices, database connection, error handling

**Apply to**: Any backend change that affects architecture, layer separation, code structure

---

## 🏗️ 3-Layer Architecture (MANDATORY)

```
Request → Router → Controller → Service → Repository → Database
```

### **Layer Responsibilities**

| Layer          | Responsibility                             | Example                                                                    |
| -------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| **Router**     | Define endpoints, apply middleware         | `router.get("/api/employees/:id", withUserConnection, controller.getById)` |
| **Controller** | Extract request, validate, format response | Check query params, call service, return JSON                              |
| **Service**    | Business logic, validation, transformation | Validate required fields, calculate values, check business rules           |
| **Repository** | Data access ONLY                           | Execute SQL, call stored procedures, return raw data                       |

### ✅ **CORRECT Flow**

```typescript
// Router
router.post("/api/employees", withUserConnection, employeeController.create);

// Controller
const create = async (req, res) => {
  try {
    const data = await employeeService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Service (Business Logic)
const create = async (data) => {
  // ✅ VALIDATE
  if (!data.manv) throw new Error("MANV required");
  if (data.manv.length > 10) throw new Error("MANV max 10 chars");

  // ✅ BUSINESS RULE
  const existing = await repository.getByMaNV(data.manv);
  if (existing) throw new Error("MANV already exists");

  // ✅ TRANSFORM
  const processed = {
    ...data,
    ngay_tao: new Date(),
    trang_thai: "ACTIVE",
  };

  // ✅ PERSIST
  return await repository.create(processed);
};

// Repository (Data Access Only)
const create = async (data) => {
  await appPool
    .request()
    .input("MaNV", sql.VarChar, data.manv)
    .input("HoTen", sql.NVarChar, data.hoten)
    .execute("sp_createEmployee");
};
```

### ❌ **WRONG - Business Logic in Repository**

```typescript
// ❌ DON'T: Logic in repository
payrollRepository.createPayroll = async (data) => {
  // ❌ This is business logic, not data access!
  const thucLanh = data.luong + data.phucap - data.khauthru;
  await appPool.execute("sp_create");
};

// ✅ DO: Logic in service
payrollService.createPayroll = async (data) => {
  const thucLanh = data.luong + data.phucap - data.khauthru; // Here!
  return await repository.createPayroll({ ...data, thucLanh });
};
```

---

## 📝 TypeScript Best Practices

### **1. Always Define Types**

```typescript
// ✅ Define interface
interface CreateEmployeeDTO {
  manv: string;
  hoten: string;
  chucvu: string;
  luong: number;
  maphg: string;
}

// ✅ Use type in function signature
const createEmployee = async (data: CreateEmployeeDTO): Promise<Employee> => {
  // ...
};

// ❌ DON'T USE ANY
const createEmployee = async (data: any) => {
  // ❌ Never do this
  // ...
};
```

### **2. Error Handling with Try-Catch**

```typescript
try {
  const data = await repository.getData();
  if (!data) throw new Error("Not found");
  return data;
} catch (error) {
  // ✅ Add context to error
  if (error.message.includes("Violation")) {
    throw new Error("Duplicate record");
  }
  throw new Error(`Service error: ${error.message}`);
}
```

### **3. Async/Await (Never Callbacks)**

```typescript
// ✅ Use async/await
const getEmployees = async () => {
  const result = await appPool.request().query("SELECT * FROM NHAN_VIEN");
  return result.recordset;
};

// ❌ DON'T use callbacks
const getEmployees = (callback) => {
  appPool.request().query("SELECT * FROM NHAN_VIEN", (err, result) => {
    callback(result);
  });
};
```

---

## 🔒 SQL Security - Parameterized Queries ONLY

### **✅ CORRECT - Prevents SQL Injection**

```typescript
const result = await appPool
  .request()
  .input("MaNV", sql.VarChar, manv)
  .input("Email", sql.NVarChar, email)
  .query("SELECT * FROM NHAN_VIEN WHERE MANV = @MaNV AND Email = @Email");
```

### **❌ WRONG - SQL Injection Vulnerability**

```typescript
// ❌ String concatenation - NEVER DO THIS
const result = await appPool
  .request()
  .query(`SELECT * FROM NHAN_VIEN WHERE MANV = '${manv}'`);

// Attacker input: manv = "'; DROP TABLE NHAN_VIEN; --"
// Executed query becomes: SELECT * FROM NHAN_VIEN WHERE MANV = ''; DROP TABLE NHAN_VIEN; --'
```

---

## 🔑 Naming Conventions

### **Database Objects** (Vietnamese)

```sql
-- Tables
NHAN_VIEN, PHONG_BAN, DU_AN, BAN_CHAM_CONG, BAN_LUONG

-- Columns
MANV, HOTEN, CHUCVU, LUONG_CO_BAN, NGAY_TUYEN_DUNG, TRANG_THAI

-- Stored Procedures (sp_<action><entity>)
sp_createEmployee
sp_getPayrollByMonth
sp_updateDepartment
sp_deleteChatMessage

-- Functions (fn_<name>)
fn_TinhSoGioLamViec
fn_TinhLuongThucLanh
```

### **TypeScript/JavaScript Code** (English)

```typescript
// Variables & functions: camelCase
const employeeData = {...};
const getEmployeeById = (id) => {...};

// Classes/Interfaces: PascalCase
class EmployeeService {}
interface IEmployee {}

// Constants: UPPER_SNAKE_CASE
const DEFAULT_PAGE_SIZE = 10;
const JWT_EXPIRY_HOURS = 3;

// Private methods: prefix _
const _validateEmail = (email) => {...};
const _formatResponse = (data) => {...};
```

### **File Naming**

```
controllers/      employeeController.ts
services/         employeeService.ts
repositories/     employeeRepository.ts
routers/          employeeRoutes.ts
types/            employee.ts
```

---

## 📋 Input Validation Pattern

### **Validate FIRST in Service Layer**

```typescript
const createEmployee = async (data: CreateEmployeeDTO) => {
  // 1️⃣ Check required fields
  if (!data.manv?.trim()) {
    throw new Error("MANV is required");
  }
  if (!data.hoten?.trim()) {
    throw new Error("HoTen is required");
  }

  // 2️⃣ Validate format/length
  if (data.manv.length > 10) {
    throw new Error("MANV max 10 characters");
  }
  if (data.luong < 0) {
    throw new Error("Salary must be positive");
  }

  // 3️⃣ Check business rules
  const existing = await employeeRepository.getByMaNV(data.manv);
  if (existing) {
    throw new Error("MANV already exists");
  }

  // 4️⃣ Then persist
  return await employeeRepository.create(data);
};
```

---

## 🔐 Error Response Format

### **Consistent Error Response**

```typescript
// ✅ In Controller
try {
  const data = await service.operation();
  res.json({ success: true, data, message: "Operation successful" });
} catch (error) {
  const statusCode = error.message.includes("not found") ? 404 : 400;
  res.status(statusCode).json({
    success: false,
    message: error.message,
    // ❌ DON'T expose stack trace in production
    // stack: error.stack
  });
}
```

### **Standard Response Format**

```json
{
  "success": true/false,
  "data": {...} or null,
  "message": "Human readable message"
}
```

---

## ⚙️ Configuration & Environment

### **Never Hardcode Config Values**

```typescript
// ❌ WRONG
const dbConnection = "Server=myserver.database.windows.net";

// ✅ CORRECT - Use environment variables
const dbConnection = process.env.SQL_CONNECTION_STRING;
const jwtSecret = process.env.JWT_SECRET;
const emailHost = process.env.EMAIL_HOST;
```

---

## 📊 Pagination Pattern

### **Standard Pagination in All List Endpoints**

```typescript
// Repository
const getPage = async (offset: number, pageSize: number) => {
  const result = await appPool
    .request()
    .input("Offset", sql.Int, offset)
    .input("PageSize", sql.Int, pageSize).query(`
      SELECT * FROM NHAN_VIEN 
      ORDER BY MANV 
      OFFSET @Offset ROWS 
      FETCH NEXT @PageSize ROWS ONLY
    `);
  return result.recordset;
};

// Service
const getAll = async (page: number = 1, pageSize: number = 10) => {
  if (page < 1) throw new Error("Page must be >= 1");
  if (pageSize < 1 || pageSize > 100) throw new Error("PageSize 1-100");

  const offset = (page - 1) * pageSize;
  return await repository.getPage(offset, pageSize);
};

// Controller
const getAll = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(req.query.pageSize) || 10),
    );

    const data = await employeeService.getAll(page, pageSize);
    res.json({ success: true, data, page, pageSize });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

---

## 🎯 Code Review Checklist

Before finalizing any code change:

- [ ] **Architecture**: Follows 3-layer pattern exactly
- [ ] **Types**: All variables/params have types (no `any`)
- [ ] **Validation**: Input validated in service layer
- [ ] **SQL**: Uses parameterized queries ONLY
- [ ] **Errors**: Try-catch with meaningful messages
- [ ] **Names**: Follow conventions (camelCase code, snake_case DB)
- [ ] **Async**: Uses async/await, no callbacks
- [ ] **Config**: No hardcoded values
- [ ] **Response**: Uses standard { success, data, message } format
- [ ] **Edge cases**: Handles null, empty, duplicates
