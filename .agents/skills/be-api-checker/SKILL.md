---
name: be-api-checker
description: |
  Kiểm tra (test) các API endpoint của dự án HUIT ERP hoặc bất kỳ backend nào.
  Gọi HTTP request thực tế, kiểm tra status code, validate dữ liệu trả về có
  đúng và đầy đủ không, báo cáo lỗi chi tiết. Tự động lấy token JWT nếu cần.
  Dùng khi nói: "test API", "check API", "kiểm tra API", "gọi thử API",
  "API có chạy không", "response có đúng không", "test endpoint", "check route",
  "kiểm tra các route", "API bị lỗi gì không", "thử gọi API", "check các API
  của router X", "test hết API cho tôi", "xem API trả về gì".
---

# Goal

Thực thi kiểm tra HTTP request thực tế đến từng API endpoint, đánh giá toàn diện
cả **status code** lẫn **chất lượng response data** (không rỗng, đúng cấu trúc,
có dữ liệu thật), sau đó trả về báo cáo tổng hợp rõ ràng.

---

# Instructions

## Bước 1 — Thu thập thông tin

1. Xác định **BASE_URL** (mặc định HUIT ERP: `http://localhost:5000`)
2. Xác định **danh sách endpoint** cần test:
   - Nếu user nói "check router X" → đọc file router tương ứng trong `BackEnd/routers/`
   - Nếu user cung cấp danh sách → dùng danh sách đó
3. Xác định **authentication**:
   - Kiểm tra xem endpoint có cần JWT token không
   - Nếu cần → dùng tài khoản test sẵn có (mặc định: `hoadang0869@gmail.com` / `Admin123*`)
   - Gọi endpoint đăng nhập trước để lấy token

## Bước 2 — Lấy JWT Token (nếu cần)

```powershell
$loginBody = '{"email":"hoadang0869@gmail.com","password":"Admin123*"}'
$loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST -ContentType "application/json" -Body $loginBody
$token = $loginRes.data.token  # Lưu token để dùng trong các request sau
```

## Bước 3 — Thực thi từng API call

Với mỗi endpoint, tạo PowerShell script và chạy:

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
try {
    $res = Invoke-RestMethod -Uri "$BASE_URL/api/..." -Method GET -Headers $headers
    # Kiểm tra response
} catch {
    # Ghi nhận lỗi
}
```

## Bước 4 — Đánh giá response theo 4 tiêu chí

| Tiêu chí | Mô tả | Cách check |
|----------|-------|-----------|
| **Status OK** | Status 200/201/204 | `$res.StatusCode` hoặc không có exception |
| **Không rỗng** | Data không phải null/empty | `$res.data -ne $null` và không phải array rỗng `[]` |
| **Đúng cấu trúc** | Response có field `success`, `data`, `message` | Kiểm tra từng key |
| **Dữ liệu hợp lệ** | Nếu là list → có ít nhất 1 phần tử; nếu là object → có các field quan trọng | Tùy từng API |

**Kết quả mỗi API được đánh dấu:**
- ✅ PASS — Tất cả 4 tiêu chí đều đạt
- ⚠️ WARN — Status OK nhưng data rỗng hoặc thiếu field
- ❌ FAIL — Bị lỗi (exception, 4xx, 5xx)

## Bước 5 — Sinh báo cáo

Trình bày bảng tổng hợp theo format:

```
📋 KẾT QUẢ KIỂM TRA API — [Tên Router]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| # | Method | Endpoint           | Status | Data  | Kết quả |
|---|--------|--------------------|--------|-------|---------|
| 1 | GET    | /api/users         | 200    | 5 rows| ✅ PASS |
| 2 | POST   | /api/users         | 201    | OK    | ✅ PASS |
| 3 | GET    | /api/users/invalid | 500    | Error | ❌ FAIL |

📊 TỔNG KẾT: X/Y PASS | Z WARN | W FAIL
⏱️ Thời gian: Xs

🔍 CHI TIẾT LỖI:
[3] GET /api/users/invalid
    → Error: Internal Server Error
    → Response: { "message": "..." }
```

## Bước 6 — Đề xuất fix (nếu có lỗi)

Với mỗi API bị ❌ FAIL hoặc ⚠️ WARN:
- Phân tích nguyên nhân (lỗi DB, thiếu data test, logic sai...)
- Đề xuất cách fix cụ thể
- Hỏi user có muốn fix ngay không

---

# Examples

## Ví dụ 1 — Check một router cụ thể

**User:** "check API các router dashboardRoutes"

**AI thực hiện:**
1. Đọc file `BackEnd/routers/dashboardRoutes.ts` → liệt kê 5 endpoints
2. Gọi login lấy token
3. Gọi tuần tự 5 endpoints, ghi nhận kết quả
4. Xuất bảng báo cáo

**Output mẫu:**
```
📋 KẾT QUẢ KIỂM TRA API — dashboardRoutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| # | Method | Endpoint                    | Status | Data      | Kết quả |
|---|--------|-----------------------------|--------|-----------|---------|
| 1 | GET    | /api/dashboard/stats        | 200    | 8 fields  | ✅ PASS |
| 2 | GET    | /api/dashboard/recent-leave | 200    | 3 records | ✅ PASS |
| 3 | GET    | /api/dashboard/chart        | 200    | []        | ⚠️ WARN |

📊 TỔNG KẾT: 2/3 PASS | 1 WARN | 0 FAIL

⚠️ CẢNH BÁO:
[3] GET /api/dashboard/chart → Data trả về rỗng []
    → Nguyên nhân có thể: Chưa có dữ liệu bảng lương trong DB
    → Không phải lỗi code, chỉ thiếu data test
```

## Ví dụ 2 — Test một endpoint cụ thể với body

**User:** "test API tạo nhân viên POST /api/employees"

**AI thực hiện:**
1. Tạo payload test hợp lệ
2. Gửi POST request với token
3. Kiểm tra response trả về có `MA_NV` mới không
4. Báo cáo kết quả + dọn dẹp data test nếu cần

## Ví dụ 3 — Check toàn bộ, tự phát hiện router

**User:** "kiểm tra hết tất cả API của dự án"

**AI thực hiện:**
1. Liệt kê tất cả file trong `BackEnd/routers/`
2. Parse từng file lấy danh sách endpoints
3. Nhóm theo router, test tuần tự
4. Báo cáo tổng hợp theo từng nhóm + grand total

---

# Constraints

- Chạy script PowerShell trực tiếp trên hệ thống để gọi HTTP thực tế (không mock)
- Với endpoint POST/PUT/DELETE tạo dữ liệu test → **luôn hỏi user** trước khi thực thi để tránh ghi dữ liệu rác vào DB production
- Nếu backend chưa chạy → thông báo rõ và hướng dẫn chạy `npm run dev`
- Token JWT mặc định dùng tài khoản `hoadang0869@gmail.com` — nếu không login được thì báo user kiểm tra lại tài khoản
- Không hardcode credentials vào file skill — chỉ dùng tài khoản test trong session hiện tại
- Giữ báo cáo súc tích: tối đa 1 dòng/endpoint trong bảng tổng hợp, chi tiết lỗi riêng phần bên dưới

<!-- Generated by Skill Creator Ultra v1.0 -->


