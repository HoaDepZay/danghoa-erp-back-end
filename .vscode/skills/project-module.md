# SKILL: Project Management Module

**Scope**: Project CRUD, team assignment, project statistics, employee-project relationships

**Apply to**: Any work on `projectController.ts`, `projectService.ts`, `projectRepository.ts`, `projectRoutes.ts`

**Files**: `controllers/projectController.ts`, `services/projectService.ts`, `repositories/projectRepository.ts`, `routers/projectRoutes.ts`

---

## 📋 Project Data Model

### **DU_AN Table (Projects)**

```sql
MADA          -- Project ID (PK)
TENDA         -- Project name
MO_TA         -- Description
NGAY_BAT_DAU  -- Start date
NGAY_KET_THUC -- End date
TRANG_THAI    -- Status (PLANNING, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED)
MAPHG         -- Department ID (FK)
NGAN_SACH     -- Budget
NGAY_TAO      -- Created date
NGAY_CAP_NHAT -- Updated date
```

### **THAM_GIA_DU_AN Table (Team Members)**

```sql
ID            -- Record ID (PK)
MADA          -- Project ID (FK)
MANV          -- Employee ID (FK)
CHUC_VU_DU_AN -- Role in project
NGAY_THAM_GIA -- Join date
NGAY_ROI_DI   -- Leave date (nullable)
```

---

## 📋 Core Operations

### **1. Get All Projects**

```typescript
// projectService.ts
const getAll = async (
  page: number = 1,
  pageSize: number = 10,
  filters?: any,
) => {
  if (page < 1) throw new Error("Page must be >= 1");
  if (pageSize < 1 || pageSize > 100) throw new Error("PageSize 1-100");

  const offset = (page - 1) * pageSize;
  const data = await projectRepository.getPage(offset, pageSize, filters);

  // Enrich with member count
  const withMembers = await Promise.all(
    data.map(async (proj) => {
      const members = await projectRepository.getProjectMembers(proj.mada);
      return { ...proj, memberCount: members.length };
    }),
  );

  return withMembers;
};

// projectRepository.ts
const getPage = async (offset: number, pageSize: number, filters?: any) => {
  let query = `
    SELECT * FROM DU_AN
    WHERE TRANG_THAI != 'CANCELLED'
  `;

  const request = appPool
    .request()
    .input("Offset", sql.Int, offset)
    .input("PageSize", sql.Int, pageSize);

  if (filters?.status) {
    query += " AND TRANG_THAI = @Status";
    request.input("Status", sql.NVarChar, filters.status);
  }

  query += `
    ORDER BY NGAY_BAT_DAU DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY
  `;

  const result = await request.query(query);
  return result.recordset;
};

// projectController.ts
const getAll = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(req.query.pageSize) || 10),
    );
    const filters = {
      status: req.query.status || null,
    };

    const data = await projectService.getAll(page, pageSize, filters);
    res.json({ success: true, data, page, pageSize });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
```

### **2. Get Project By ID**

```typescript
// projectService.ts
const getById = async (mada: string) => {
  if (!mada?.trim()) throw new Error("Project ID required");

  const project = await projectRepository.getByMaDA(mada);
  if (!project) throw new Error("Project not found");

  // Get team members
  const members = await projectRepository.getProjectMembers(mada);

  return {
    ...project,
    members,
    memberCount: members.length,
    budget: project.ngan_sach,
    daysActive: calculateDaysActive(
      project.ngay_bat_dau,
      project.ngay_ket_thuc,
    ),
  };
};

// projectRepository.ts
const getByMaDA = async (mada: string) => {
  const result = await appPool
    .request()
    .input("MaDA", sql.VarChar, mada)
    .query("SELECT * FROM DU_AN WHERE MADA = @MaDA");
  return result.recordset[0] || null;
};

const getProjectMembers = async (mada: string) => {
  const result = await appPool.request().input("MaDA", sql.VarChar, mada)
    .query(`
      SELECT 
        tg.ID, tg.MANV, nv.HOTEN, nv.EMAIL, nv.CHUCVU,
        tg.CHUC_VU_DU_AN, tg.NGAY_THAM_GIA, tg.NGAY_ROI_DI
      FROM THAM_GIA_DU_AN tg
      INNER JOIN NHAN_VIEN nv ON tg.MANV = nv.MANV
      WHERE tg.MADA = @MaDA
      ORDER BY tg.NGAY_THAM_GIA
    `);
  return result.recordset;
};
```

### **3. Create Project**

```typescript
// projectService.ts
const create = async (data: CreateProjectDTO) => {
  // Validate
  if (!data.mada?.trim()) throw new Error("Project ID required");
  if (!data.tenda?.trim()) throw new Error("Project name required");
  if (!data.ngay_bat_dau) throw new Error("Start date required");
  if (!data.ngay_ket_thuc) throw new Error("End date required");

  // Validate dates
  const startDate = new Date(data.ngay_bat_dau);
  const endDate = new Date(data.ngay_ket_thuc);
  if (startDate >= endDate) {
    throw new Error("End date must be after start date");
  }

  // Check duplicate
  const existing = await projectRepository.getByMaDA(data.mada);
  if (existing) throw new Error("Project ID already exists");

  // Validate department
  if (data.maphg) {
    const dept = await departmentRepository.getByMaPhg(data.maphg);
    if (!dept) throw new Error("Department not found");
  }

  // Create
  const processed = {
    ...data,
    ngay_tao: new Date(),
    trang_thai: "PLANNING",
  };

  return await projectRepository.create(processed);
};

// projectRepository.ts
const create = async (data: CreateProjectDTO) => {
  await appPool
    .request()
    .input("MaDA", sql.VarChar, data.mada)
    .input("TenDA", sql.NVarChar, data.tenda)
    .input("MoTa", sql.NVarChar, data.mo_ta || "")
    .input("NgayBatDau", sql.Date, new Date(data.ngay_bat_dau))
    .input("NgayKetThuc", sql.Date, new Date(data.ngay_ket_thuc))
    .input("MaPhg", sql.VarChar, data.maphg || null)
    .input("NgangSach", sql.Decimal(18, 2), data.ngan_sach || 0)
    .execute("sp_createProject");
};
```

### **4. Update Project**

```typescript
// projectService.ts
const update = async (mada: string, data: UpdateProjectDTO) => {
  // Check exists
  const existing = await projectRepository.getByMaDA(mada);
  if (!existing) throw new Error("Project not found");

  // Validate status transition
  if (
    data.trang_thai &&
    !isValidStatusTransition(existing.trang_thai, data.trang_thai)
  ) {
    throw new Error("Invalid status transition");
  }

  // Validate dates if provided
  if (data.ngay_bat_dau || data.ngay_ket_thuc) {
    const startDate = new Date(data.ngay_bat_dau || existing.ngay_bat_dau);
    const endDate = new Date(data.ngay_ket_thuc || existing.ngay_ket_thuc);
    if (startDate >= endDate) {
      throw new Error("End date must be after start date");
    }
  }

  // Update
  const updated = { ...existing, ...data };
  return await projectRepository.update(mada, updated);
};

const isValidStatusTransition = (from: string, to: string): boolean => {
  const validTransitions: Record<string, string[]> = {
    PLANNING: ["IN_PROGRESS", "ON_HOLD", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "ON_HOLD", "CANCELLED"],
    ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
    COMPLETED: [], // No transitions from completed
    CANCELLED: [], // No transitions from cancelled
  };
  return validTransitions[from]?.includes(to) || false;
};

// projectRepository.ts
const update = async (mada: string, data: Partial<Project>) => {
  const request = appPool.request().input("MaDA", sql.VarChar, mada);

  if (data.tenda !== undefined) {
    request.input("TenDA", sql.NVarChar, data.tenda);
  }
  if (data.mo_ta !== undefined) {
    request.input("MoTa", sql.NVarChar, data.mo_ta);
  }
  if (data.trang_thai !== undefined) {
    request.input("TrangThai", sql.NVarChar, data.trang_thai);
  }
  if (data.ngan_sach !== undefined) {
    request.input("NgangSach", sql.Decimal(18, 2), data.ngan_sach);
  }

  await request.execute("sp_updateProject");
};
```

---

## 👥 Team Management

### **Add Employee to Project**

```typescript
// projectService.ts
const addTeamMember = async (
  mada: string,
  manv: string,
  chucVuDuAn: string,
) => {
  // Validate project
  const project = await projectRepository.getByMaDA(mada);
  if (!project) throw new Error("Project not found");

  // Validate employee
  const employee = await employeeRepository.getByMaNV(manv);
  if (!employee) throw new Error("Employee not found");

  // Check if already assigned
  const existing = await projectRepository.getTeamMember(mada, manv);
  if (existing && !existing.ngay_roi_di) {
    throw new Error("Employee already assigned to this project");
  }

  // Add to project
  return await projectRepository.addTeamMember({
    mada,
    manv,
    chuc_vu_du_an: chucVuDuAn,
    ngay_tham_gia: new Date(),
  });
};

// projectRepository.ts
const addTeamMember = async (data) => {
  await appPool
    .request()
    .input("MaDA", sql.VarChar, data.mada)
    .input("MaNV", sql.VarChar, data.manv)
    .input("ChucVuDuAn", sql.NVarChar, data.chuc_vu_du_an)
    .input("NgayThamGia", sql.Date, data.ngay_tham_gia)
    .execute("sp_addTeamMember");
};

const getTeamMember = async (mada: string, manv: string) => {
  const result = await appPool
    .request()
    .input("MaDA", sql.VarChar, mada)
    .input("MaNV", sql.VarChar, manv).query(`
      SELECT * FROM THAM_GIA_DU_AN
      WHERE MADA = @MaDA AND MANV = @MaNV
    `);
  return result.recordset[0] || null;
};
```

### **Remove Employee from Project**

```typescript
// projectService.ts
const removeTeamMember = async (mada: string, manv: string) => {
  // Check exists
  const member = await projectRepository.getTeamMember(mada, manv);
  if (!member) throw new Error("Team member not found");

  if (member.ngay_roi_di) {
    throw new Error("Employee already left this project");
  }

  // Remove (soft delete - set leave date)
  return await projectRepository.removeTeamMember(mada, manv);
};

// projectRepository.ts
const removeTeamMember = async (mada: string, manv: string) => {
  await appPool
    .request()
    .input("MaDA", sql.VarChar, mada)
    .input("MaNV", sql.VarChar, manv)
    .input("NgayRoiDi", sql.Date, new Date())
    .execute("sp_removeTeamMember");
};
```

---

## 📊 Project Statistics

### **Get Project Summary**

```typescript
// projectService.ts
const getSummary = async () => {
  const projects = await projectRepository.getAll();

  const statistics = {
    total: projects.length,
    byStatus: {
      planning: projects.filter((p) => p.trang_thai === "PLANNING").length,
      inProgress: projects.filter((p) => p.trang_thai === "IN_PROGRESS").length,
      completed: projects.filter((p) => p.trang_thai === "COMPLETED").length,
      onHold: projects.filter((p) => p.trang_thai === "ON_HOLD").length,
    },
    totalBudget: projects.reduce((sum, p) => sum + (p.ngan_sach || 0), 0),
    avgBudget: Math.round(
      projects.reduce((sum, p) => sum + (p.ngan_sach || 0), 0) /
        projects.length,
    ),
  };

  return statistics;
};
```

---

## 🎯 Common Mistakes to Avoid

- ❌ Not validating end date is after start date
- ❌ Allowing duplicate project IDs
- ❌ Not checking employee exists before adding to project
- ❌ Allowing invalid status transitions (e.g., COMPLETED → IN_PROGRESS)
- ❌ Not validating project exists before adding members
- ❌ Hard deleting team members instead of soft delete (set leave date)
- ❌ Not checking employee isn't already assigned to project
- ❌ Returning all project data when only list needed (select fewer columns)
- ❌ Not validating department exists when assigning project
- ❌ Not tracking team member join/leave dates for historical data
