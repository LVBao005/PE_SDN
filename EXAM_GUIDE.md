# HƯỚNG DẪN THI THỰC HÀNH SDN302 - EXPENSETRAIL

Tài liệu này hướng dẫn chi tiết từng bước từ lúc bắt đầu thi đến khi nộp bài cho môn SDN302.

---

## BƯỚC 1: KHỞI TẠO DATABASE TRÊN SUPABASE (Mất khoảng 1-2 phút)

1. Đăng nhập vào [https://supabase.com](https://supabase.com).
2. Nhấn **New Project** (hoặc nếu đã có project cũ bị tạm dừng thì bấm **Restore**).
   - **Name:** `ExpenseTrail` (hoặc đặt theo mã sinh viên, ví dụ `SDN302_QE180206`)
   - **Database Password:** Đặt mật khẩu dễ nhớ, không chứa ký tự đặc biệt gây lỗi URL (ví dụ: `ExamPass2026!`)
   - **Region:** Chọn `Singapore` (ap-southeast-1) hoặc vùng gần nhất.
3. Khi Project khởi tạo xong, vào **Project Settings** (biểu tượng bánh răng ở thanh menu bên trái) -> Chọn mục **Database**.
4. Kéo xuống phần **Connection string**:
   - Chọn tab **URI**.
   - **DATABASE_URL (Transaction Pooler - port 6543):**
     - Chọn chế độ **Transaction** (Mode: Transaction, Port: 6543).
     - Copy chuỗi kết nối và thay `[YOUR-PASSWORD]` bằng mật khẩu đã đặt.
     - Đảm bảo có đuôi `?pgbouncer=true`.
     - *Ví dụ:* `postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - **DIRECT_URL (Session / Direct - port 5432):**
     - Chọn chế độ **Session** (Mode: Session, Port: 5432) hoặc Direct.
     - Copy chuỗi kết nối và thay `[YOUR-PASSWORD]`.
     - *Ví dụ:* `postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`

---

## BƯỚC 2: CẤU HÌNH FILE `.env` TẠI MÁY CỤC BỘ (LOCAL)

Tạo file `.env` ở thư mục gốc của dự án (cùng cấp với `package.json`) với nội dung:

```env
DATABASE_URL="postgresql://postgres.xxx:Password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:Password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
AUTH_SECRET="sdn302-secret-jwt-token-exam-2026-key"
```

---

## BƯỚC 3: CHẠY MIGRATION ĐẨY BẢNG LÊN SUPABASE

Mở terminal tại thư mục dự án và chạy:

```bash
npx prisma migrate dev --name init
```

*Lệnh này sẽ tự động kết nối Supabase, tạo các bảng `User` và `Expense`, và tạo thư mục `prisma/migrations`.*

---

## BƯỚC 4: KIỂM TRA BUILD CỤC BỘ

Chạy thử lệnh build để đảm bảo 100% không có lỗi TypeScript hay cú pháp:

```bash
npm run build
```

---

## BƯỚC 5: ĐẨY CODE LÊN GITHUB

Commit toàn bộ thay đổi và đẩy lên repository của bạn:

```bash
git add .
git commit -m "feat: complete expensetrail boilerplate with prisma, auth and testids"
git push -u origin main
```

*(Đảm bảo repository ở chế độ **Public** theo yêu cầu đề bài).*

---

## BƯỚC 6: TRIỂN KHAI LÊN VERCEL (DEPLOYMENT)

### Cách 1: Qua Vercel Dashboard (Khuyên dùng)
1. Đăng nhập [https://vercel.com](https://vercel.com).
2. Nhấn **Add New...** -> **Project**.
3. Chọn Repository vừa tạo trên GitHub và nhấn **Import**.
4. Tại phần **Environment Variables**, thêm đủ 3 biến:
   - `DATABASE_URL`: (Giá trị từ file .env)
   - `DIRECT_URL`: (Giá trị từ file .env)
   - `AUTH_SECRET`: (Giá trị từ file .env)
5. Nhấn **Deploy**.
6. Sau khi deploy thành công, vào **Settings** -> **Deployment Protection** -> Đảm bảo **Vercel Authentication** đang ở trạng thái **Disabled** (Đề bài yêu cầu không bật tính năng này để hệ thống grader tự động truy cập được).

### Cách 2: Qua Vercel CLI (Nhanh chóng)
```bash
vercel --prod
```
Thêm biến môi trường:
```bash
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add AUTH_SECRET production
vercel --prod
```

---

## BƯỚC 7: TẠO TÀI KHOẢN TEST TRÊN TRANG VERCEL PRODUCTION

1. Mở trang web đã deploy trên Vercel: `https://<ten-du-an>.vercel.app`.
2. Bấm vào nút **Register** (hoặc vào `/register`).
3. Đăng ký tài khoản kiểm tra theo đúng cú pháp đề yêu cầu:
   - **Email:** `grader.<ma_sinh_vien>@example.com` (ví dụ: `grader.qe180206@example.com`)
   - **Password:** `Test1234!`
   - **Confirm Password:** `Test1234!`
4. Đăng nhập thử bằng tài khoản này vào `/login` để kiểm tra cookie và chuyển hướng sang `/expenses`.
5. Tạo thử 1 khoản chi tiêu và đánh dấu sao để xác nhận database hoạt động ổn định.

---

## BƯỚC 8: NỘP BÀI (SUBMISSION)

Tạo thư mục tên theo **Mã số sinh viên** của bạn (ví dụ: `QE180206`), bên trong chứa đúng 2 file:

### 1. File Word: `<Ma_sinh_vien>.docx`
Mẫu nội dung (copy chính xác):
```text
Student Code: QE180206
Full Name: Nguyen Van A
GitHub Repository URL: https://github.com/LVBao005/PE_SDN
Vercel Production URL: https://your-project.vercel.app
Test account email: grader.qe180206@example.com
Test account password: Test1234!
```
*(Tuyệt đối KHÔNG ghi DATABASE_URL hay mật khẩu Supabase vào file Word).*

### 2. File Nén: `<Ma_sinh_vien>.zip`
Nén toàn bộ mã nguồn của dự án thành file zip:
- File `package.json` nằm ở tầng cao nhất của file zip.
- Bao gồm: `app/`, `components/`, `lib/`, `context/`, `prisma/` (kèm `prisma/migrations/`), `components.json`, `.env.example`, `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`.
- **TUYỆT ĐỐI KHÔNG NÉN:** `node_modules`, `.next`, `.git`, hoặc bất kỳ file `.env` nào.

