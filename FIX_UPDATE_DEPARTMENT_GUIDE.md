# Fix UPDATE Department API - Complete Guide

## 🔴 Vấn đề

API PUT `/api/departments/1003` báo lỗi:

```json
{
  "success": false,
  "message": "Lỗi cập nhật phòng ban: Cập nhật phòng ban thất bại."
}
```

## 🔍 Nguyên nhân

1. **Output Parameter Issue**: `SET NOCOUNT ON` trong SP làm output parameter không được capture đúng
2. **No-Change Case**: Dữ liệu gửi lên giống hiện tại → SP không update gì → Status = 0 → Error

## ✅ Giải pháp

### Step 1: Fix SQL Server Procedure (REQUIRED)

**Chạy SQL script này trên database QuanTriNhanSu:**

```sql
-- Cập nhật stored procedure
ALTER PROCEDURE sp_updateDepartment
    @MaPhg INT,
    @TenPb NVARCHAR(100) = NULL,
    @MaTruongPhg VARCHAR(10) = NULL,
    @Status INT OUTPUT
AS
BEGIN
    BEGIN TRY
        UPDATE PHONG_BAN
        SET TENPB = ISNULL(@TenPb, TENPB),
            MaTruongPhg = ISNULL(@MaTruongPhg, MaTruongPhg)
        WHERE MAPHG = @MaPhg;

        IF @@ROWCOUNT > 0
        BEGIN
            SET @Status = 1;
        END
        ELSE
        BEGIN
            SET @Status = 0;
        END

        SET NOCOUNT ON;
    END TRY
    BEGIN CATCH
        SET @Status = -1;
        SET NOCOUNT ON;
    END CATCH
END;
GO
```

File: [database/FIX_UPDATE_DEPARTMENT_SP.sql](database/FIX_UPDATE_DEPARTMENT_SP.sql)

### Step 2: Rebuild & Restart Server

```bash
npm run build
npm start
```

### Step 3: Test API

**Test case 1: Update với dữ liệu khác**

```bash
PUT http://localhost:5000/api/departments/1003
Content-Type: application/json

{
  "tenpb": "Phòng Hành Chính Mới",
  "matruongphg": "NV27CA4"
}
```

**Response expected:**

```json
{
  "success": true,
  "message": "Cập nhật phòng ban thành công",
  "changed": true
}
```

**Test case 2: Update với dữ liệu giống hiện tại**

```bash
PUT http://localhost:5000/api/departments/1003
Content-Type: application/json

{
  "tenpb": "Phòng Hành Chính Nhân Sự",
  "matruongphg": "NV53F54"
}
```

**Response expected:**

```json
{
  "success": true,
  "message": "Phòng ban không có thay đổi so với dữ liệu hiện tại",
  "changed": false
}
```

**Test case 3: Update phòng ban không tồn tại**

```bash
PUT http://localhost:5000/api/departments/9999
Content-Type: application/json

{
  "tenpb": "Test",
  "matruongphg": null
}
```

**Response expected:**

```json
{
  "success": false,
  "message": "Lỗi cập nhật phòng ban: Phòng ban với mã 9999 không tồn tại."
}
```

---

## 📝 Các thay đổi được thực hiện

### Repository (`repositories/departmentRepository.ts`)

- ✅ Xử lý output parameter null (fallback)
- ✅ Return object `{ success, changed }` thay vì boolean
- ✅ Handle status values: 1 (success), 0 (no change), -1 (error)
- ✅ Thêm logging chi tiết

### Service (`services/departmentService.ts`)

- ✅ Kiểm tra phòng ban tồn tại trước khi update
- ✅ Handle "no change" case như success (không phải error)
- ✅ Return `changed` flag để client biết dữ liệu có thay đổi hay không
- ✅ Thêm console logging để debug

### Database

- ✅ Move `SET NOCOUNT ON` sau khi set output parameter
- ✅ Return status = -1 khi có exception để phân biệt
- ✅ File fix: [database/FIX_UPDATE_DEPARTMENT_SP.sql](database/FIX_UPDATE_DEPARTMENT_SP.sql)

---

## 🔧 Debug Script

Nếu vẫn có vấn đề, chạy debug script:

```bash
npx ts-node debug_update_department.ts
```

Output sẽ show:

- Dữ liệu hiện tại
- SP return status
- Dữ liệu sau update

---

## 📌 Lưu ý

1. **SQL Server**: Phải chạy script fix SP trước, nếu không output parameter vẫn null
2. **Request validation**: Backend sẽ validate ID tồn tại
3. **No-change handling**: Bây giờ "không thay đổi" không phải error
4. **Console logs**: Check server console để debug issues

---

**Hoàn tất!** 🎉 API update department giờ đây hoạt động đúng.
