# SKILL: Authentication & Authorization Module

**Scope**: Authentication, JWT tokens, OTP, password hashing, user registration flow, role-based access control

**Apply to**: Any work on `authController.ts`, `authService.ts`, `authMiddleware.ts`, `authRoutes.ts`

**Files**: `controllers/authController.ts`, `services/authService.ts`, `repositories/userRepository.ts`, `middleware/authMiddleware.ts`, `utils/jwtHelper.ts`, `utils/authHelper.ts`, `utils/mailHelper.ts`

---

## 🔐 Authentication Flow

### **1. Registration (Multi-step)**

```
1. Register: POST /api/auth/register
   - Email, Password, MANV
   - Hash password with bcryptjs
   - Save to database
   - Send OTP email via Nodemailer

2. Verify OTP: POST /api/auth/verify-otp
   - Verify 6-digit OTP
   - Check if within 15 minutes
   - Mark email as verified
   - Await admin approval

3. Admin Approval (Manual)
   - Admin approves in system
   - Account status = ACTIVE

4. Can Now Login
```

### **2. Login Flow**

```
POST /api/auth/login
├─ Validate email & password format
├─ Get user from database
├─ Verify password with bcryptjs.compare()
├─ Check account status (ACTIVE, APPROVED)
├─ Generate JWT token (3-hour expiry)
├─ Generate refresh token (7-day expiry)
├─ Create dynamic Azure SQL user for this login
└─ Return { accessToken, refreshToken, user }
```

### **3. Subsequent Requests**

```
Every Protected Request:
├─ Extract JWT from Authorization header
├─ Verify JWT signature & expiry
├─ Extract userId from token
├─ Create per-user database connection
└─ Proceed with request (req.userId, req.connection available)
```

### **4. Token Refresh**

```
POST /api/auth/refresh-token
├─ Validate refresh token
├─ Check expiry (7 days)
├─ Generate new JWT (3-hour expiry)
├─ Return new { accessToken, refreshToken }
└─ Old tokens invalidated
```

---

## 🔑 JWT Token Structure

### **Token Payload (Inside JWT)**

```json
{
  "userId": "NV001",
  "email": "employee@huit.edu.vn",
  "manv": "NV001",
  "iat": 1715369000,
  "exp": 1715380800
}
```

### **Token Generation**

```typescript
// jwtHelper.ts
const generateJWT = (userId: string, email: string, manv: string) => {
  return jwt.sign(
    { userId, email, manv },
    process.env.JWT_SECRET, // Secret key
    { expiresIn: "3h" }, // 3-hour expiry
  );
};

// Generated token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **Token Verification**

```typescript
const verifyJWT = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
```

---

## 🛡️ Middleware: `withUserConnection`

### **What It Does**

1. Extract JWT from `Authorization: Bearer <token>` header
2. Verify token signature and expiry
3. Create per-user database connection
4. Attach user info to request object

### **Usage in Routes**

```typescript
// ✅ Protect endpoint
router.get(
  "/api/protected-resource",
  withUserConnection, // Middleware
  controllerMethod, // Handler receives req.userId, req.connection
);

// ❌ Don't forget middleware
// router.get("/api/endpoint", controllerMethod); // WRONG - no auth!
```

### **In Controller**

```typescript
const myMethod = async (req, res) => {
  // ✅ Access user from request
  const userId = req.userId; // From JWT token
  const connection = req.connection; // Per-user DB connection

  // ✅ Now use connection for database operations
  const result = await connection
    .request()
    .input("MaNV", sql.VarChar, userId)
    .query("SELECT * FROM NHAN_VIEN WHERE MANV = @MaNV");

  res.json({ success: true, data: result.recordset[0] });
};
```

---

## 🔐 Password Security

### **Hashing**

```typescript
// When user registers/changes password
import bcrypt from "bcryptjs";

const hashedPassword = await bcrypt.hash(plainPassword, 10);
// ✅ Store hashedPassword in database, NEVER plain password
```

### **Verification**

```typescript
// When user logs in
const isValid = await bcrypt.compare(inputPassword, storedHashedPassword);
if (!isValid) {
  throw new Error("Invalid password");
}
```

### **Never**

```typescript
// ❌ WRONG - storing plain password
database.password = plainPassword;

// ❌ WRONG - comparing plain passwords
if (inputPassword === storedPassword) {
}

// ❌ WRONG - custom encryption
const encrypted = inputPassword.split("").reverse().join("");
```

---

## 📧 OTP Generation & Verification

### **Generate OTP**

```typescript
// Random 6-digit code
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
// Result: "342891"
```

### **Send via Email**

```typescript
import mailHelper from "../utils/mailHelper";

const sendOTPEmail = async (email: string, otp: string) => {
  await mailHelper.sendOTP(email, otp);
  // Email sent with OTP code
};
```

### **Verify OTP**

```typescript
const verifyOTP = async (email: string, inputOTP: string) => {
  // 1. Get stored OTP and createdAt time
  const record = await userRepository.getOTPByEmail(email);

  if (!record) {
    throw new Error("No OTP found for this email");
  }

  // 2. Check if within 15-minute window
  const now = new Date();
  const createdAt = new Date(record.otp_created_at);
  const minutesPassed = (now.getTime() - createdAt.getTime()) / 60000;

  if (minutesPassed > 15) {
    throw new Error("OTP expired");
  }

  // 3. Verify OTP matches
  if (record.otp_code !== inputOTP) {
    throw new Error("Invalid OTP");
  }

  // 4. Clear OTP after verification
  await userRepository.clearOTP(email);

  return true;
};
```

---

## 👤 User Creation (Per-User Database Connection)

### **Azure SQL Dynamic User**

After login, the system creates a database user unique to that employee:

```typescript
// authHelper.ts
const createDatabaseUser = async (manv: string, password: string) => {
  const createUserSQL = `
    CREATE USER [${manv}] WITH PASSWORD = '${password}'
    ALTER ROLE db_datareader ADD MEMBER [${manv}]
    ALTER ROLE db_datawriter ADD MEMBER [${manv}]
  `;

  // Execute to create user in Azure SQL
  await appPool.request().query(createUserSQL);
};
```

This allows:

- Each employee only sees their own data
- Database-level access control
- Secure data isolation

---

## 📋 Standard Service Methods

```typescript
authService = {
  // Register new employee
  register: async (email: string, password: string, manv: string) => {
    // 1. Validate inputs
    // 2. Check if email already registered
    // 3. Hash password
    // 4. Save to database
    // 5. Generate OTP
    // 6. Send OTP email
    return { success: true, message: "OTP sent to email" };
  },

  // Verify OTP
  verifyOTP: async (email: string, otp: string) => {
    // 1. Validate OTP (format, expiry)
    // 2. Mark user as verified
    // 3. Await admin approval
    return { success: true, message: "Awaiting admin approval" };
  },

  // Login
  login: async (email: string, password: string) => {
    // 1. Get user from database
    // 2. Verify password
    // 3. Check account is ACTIVE
    // 4. Generate tokens
    // 5. Create DB user
    return { accessToken, refreshToken, user };
  },

  // Refresh token
  refreshToken: async (refreshTokenString: string) => {
    // 1. Verify refresh token
    // 2. Generate new JWT
    // 3. Generate new refresh token
    return { accessToken, refreshToken };
  },

  // Change password
  changePassword: async (
    manv: string,
    oldPassword: string,
    newPassword: string,
  ) => {
    // 1. Get user
    // 2. Verify old password
    // 3. Hash new password
    // 4. Update database
    return { success: true, message: "Password changed" };
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    // 1. Check email exists
    // 2. Generate reset token
    // 3. Send reset email with link
    return { success: true, message: "Reset link sent to email" };
  },
};
```

---

## 🚫 Authorization: Role-Based Access Control

### **Admin-Only Routes**

```typescript
// ✅ Use requireAdmin middleware
router.post(
  "/api/admin/employees",
  withUserConnection,
  requireAdmin, // Only admins pass through
  adminController.createEmployee,
);

// Middleware checks if user is admin
const requireAdmin = (req, res, next) => {
  if (req.userRole !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only administrators can access this resource",
    });
  }
  next();
};
```

### **User-Specific Routes**

```typescript
// ✅ Users can only see their own data
router.get("/api/employees/my-info", withUserConnection, async (req, res) => {
  // Only return current user's data
  const userId = req.userId; // From JWT
  const employee = await employeeRepository.getByMaNV(userId);
  res.json({ success: true, data: employee });
});
```

---

## 🔄 Complete Login Example

```typescript
// authController.ts
const login = async (req, res) => {
  try {
    // 1. Extract data
    const { email, password } = req.body;

    // 2. Call service
    const result = await authService.login(email, password);

    // 3. Return tokens
    res.json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

// authService.ts
const login = async (email: string, password: string) => {
  // 1. Validate format
  if (!email || !password) {
    throw new Error("Email and password required");
  }

  // 2. Find user
  const user = await userRepository.getByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  // 3. Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error("Invalid password");
  }

  // 4. Check account status
  if (user.trang_thai !== "ACTIVE") {
    throw new Error("Account not active");
  }

  // 5. Generate tokens
  const accessToken = jwtHelper.generateJWT(user.manv, user.email, user.manv);
  const refreshToken = jwtHelper.generateRefreshToken(user.manv);

  // 6. Create DB user
  await authHelper.createDatabaseUser(user.manv, password);

  return {
    accessToken,
    refreshToken,
    user: {
      manv: user.manv,
      email: user.email,
      hoten: user.hoten,
    },
  };
};

// userRepository.ts
const getByEmail = async (email: string) => {
  const result = await appPool
    .request()
    .input("Email", sql.NVarChar, email)
    .query("SELECT * FROM NHAN_VIEN WHERE Email = @Email");
  return result.recordset[0] || null;
};
```

---

## 🎯 Common Mistakes to Avoid

- ❌ Storing plain passwords (always hash with bcryptjs)
- ❌ Weak JWT secrets (use strong, random secrets)
- ❌ No token expiry (always set expiry times)
- ❌ Leaking sensitive data in error messages (sanitize responses)
- ❌ Forgetting `withUserConnection` middleware on protected routes
- ❌ Not verifying token before using req.userId
- ❌ Hardcoding JWT secret in code (use environment variables)
- ❌ Allowing unlimited OTP attempts (implement rate limiting)
- ❌ Not invalidating old tokens on refresh
- ❌ Exposing database errors to client (catch and sanitize)
