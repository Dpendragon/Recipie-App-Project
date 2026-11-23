# Recipe Finder App

Ứng dụng di động gợi ý công thức nấu ăn từ nguyên liệu có sẵn.

| Thư mục | Công nghệ | Chạy bằng |
| --- | --- | --- |
| `backend/` | NestJS 12, Prisma 7, MySQL 8, JWT | `npm run start:dev` → http://localhost:3000 |
| `mobile/` | Expo SDK 57, React Native, Expo Router | `npx expo start` → quét QR bằng Expo Go |

Tài liệu đặc tả (use case, database, API) nằm trong `docs/`.

---

## 1. Cài phần mềm

| Phần mềm | Bắt buộc | Link | Ghi chú |
| --- | --- | --- | --- |
| Node.js 22.13+ / 24 LTS | Có | https://nodejs.org/en/download | Script tự cài nếu máy chưa có |
| Git | Có | https://git-scm.com/downloads/win | Script tự cài nếu máy chưa có |
| VS Code | Có | https://code.visualstudio.com/download | Script tự cài nếu máy chưa có |
| MySQL Server 8 | Có | https://dev.mysql.com/downloads/installer/ | **Phải cài tay**. Ghi nhớ mật khẩu `root` đặt ở màn *Accounts and Roles* |
| MySQL Workbench | Không | https://dev.mysql.com/downloads/workbench/ | Xem bảng bằng giao diện |
| Expo Go **cho SDK 57** | Có | Android: https://expo.dev/go?sdkVersion=57&platform=android&device=true | Xem lưu ý bên dưới |
| Android Studio | Không | https://developer.android.com/studio | Chỉ khi muốn dùng máy ảo thay điện thoại thật |

> **Expo Go phải đúng SDK 57.** CH Play chỉ có bản mới nhất (SDK 58), mở dự án sẽ báo
> `Project is incompatible with this version of Expo Go`. Gỡ bản CH Play, mở link trên **bằng trình duyệt
> trên điện thoại**, tải APK và cài (cho phép "cài ứng dụng không rõ nguồn gốc"). Sau đó vào trang Expo Go
> trên CH Play → ⋮ → tắt **Bật tự động cập nhật**.

> **Đặt repo ở thư mục không dấu, không dấu cách**, ví dụ `D:\ChuyenDe\`. Đường dẫn có dấu cách
> hoặc tiếng Việt dễ gây lỗi khi build Android.

---

## 2. Clone repo

Mở **PowerShell** (không dùng terminal MSYS2/UCRT64):

```powershell
mkdir D:\ChuyenDe
cd D:\ChuyenDe
git clone https://github.com/Dpendragon/Recipie-App-Project.git
code Recipie-App-Project
```

Lần đầu dùng Git trên máy:

```powershell
git config --global user.name "Ten-GitHub-Cua-Ban"
git config --global user.email "email-github@example.com"
git config --global core.autocrlf true
```

---

## 3. Chạy script cài đặt `setup-windows.ps1`

### 3.1. Trước khi chạy

1. MySQL đang chạy: `Get-Service MySQL*` phải ra `Running`.
2. Biết mật khẩu `root` của MySQL. Kiểm tra bằng:

   ```powershell
   & (Get-ChildItem "C:\Program Files\MySQL\MySQL Server*\bin\mysql.exe").FullName -u root -p -e "SELECT VERSION();"
   ```

   In ra số phiên bản (ví dụ `8.0.46`) là đúng mật khẩu.

### 3.2. Chạy

Trong terminal PowerShell của VS Code, đứng ở **gốc repo** (cùng chỗ với `backend/` và `mobile/`):

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1 -SkipTools -Seed
```

| Tham số | Ý nghĩa |
| --- | --- |
| *(không có)* | Cài cả Git, Node.js, VS Code bằng winget nếu máy chưa có |
| `-SkipTools` | Bỏ qua bước cài phần mềm (máy đã có sẵn) |
| `-Seed` | Nạp dữ liệu mẫu. **Xoá sạch các bảng trước khi nạp** |

Script hỏi 3 câu khi tạo `backend/.env`:

| Câu hỏi | Trả lời |
| --- | --- |
| `User [root]:` | Nhấn **Enter** (dùng `root`) |
| `Mật khẩu:` | Gõ mật khẩu root MySQL (màn hình chỉ hiện `*`) |
| `Tên database [recipe_finder]:` | Nhấn **Enter** |

### 3.3. Script làm gì

| Bước | Việc |
| --- | --- |
| 1/6 | Cài Git, Node.js LTS, VS Code nếu thiếu; dừng nếu Node thấp hơn 22.13 |
| 2/6 | Cài 8 extension VS Code (Claude Code, Expo, Prisma, oxlint, ESLint, Prettier, MySQL, dotenv) |
| 3/6 | Kiểm tra MySQL ở cổng 3306 |
| 4/6 | Backend: `npm install`, thêm thư viện còn thiếu, tạo `backend/.env` (JWT_SECRET ngẫu nhiên), `prisma generate`, `prisma migrate deploy`, seed nếu có `-Seed` |
| 5/6 | Mobile: `npm install`, `npx expo install` thư viện còn thiếu, tạo `mobile/.env` với IP Wi-Fi của máy |
| 6/6 | Chép skill Prisma sang `.claude/skills/` cho Claude Code |

Chạy lại nhiều lần vẫn an toàn: phần nào đã có thì bỏ qua. Riêng `-Seed` mỗi lần chạy sẽ nạp lại dữ liệu mẫu từ đầu.

Thành công khi thấy các dòng:

```
  [OK] Database đã có đủ bảng.
  [OK] Đã tạo mobile/.env với EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
=== XONG ===
```

---

## 4. Chạy dự án

Mở 2 terminal trong VS Code (nút **+** ở khung Terminal).

**Terminal 1 — backend**

```powershell
cd backend
npm run start:dev
```

Chờ dòng `Nest application successfully started`. Windows Firewall hỏi thì chọn **Allow** cho mạng Private.

**Terminal 2 — mobile**

```powershell
cd mobile
npx expo start
```

Quét QR bằng Expo Go. Điện thoại và laptop phải **cùng Wi-Fi**.

**Tài khoản mẫu** (sau khi seed): `nguyenvana@gmail.com` / `password`

Thử API không cần app:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/login -ContentType "application/json" -Body '{"email":"nguyenvana@gmail.com","password":"password"}'
```

Trả về `accessToken` là backend đã nối được MySQL.

---

## 5. File `.env`

Không bao giờ commit `.env`. Mẫu nằm ở `backend/.env.example` và `mobile/.env.example`.

**`backend/.env`**

| Biến | Ý nghĩa |
| --- | --- |
| `DATABASE_URL` | Dùng cho lệnh Prisma. Mật khẩu có ký tự đặc biệt phải mã hoá: `@`→`%40`, `#`→`%23` |
| `DATABASE_HOST/PORT/USER/PASSWORD/NAME` | Dùng khi app chạy. Phải khớp với `DATABASE_URL` |
| `JWT_SECRET`, `RESET_TOKEN_SECRET` | Chuỗi ngẫu nhiên dài |
| `SPOONACULAR_API_KEY` | Lấy miễn phí tại https://spoonacular.com/food-api/console |
| `SMTP_*` | Gửi OTP quên mật khẩu. Gmail: `smtp.gmail.com`, cổng 587, `SMTP_PASS` là App Password (https://myaccount.google.com/apppasswords) |

**`mobile/.env`**

```
EXPO_PUBLIC_API_URL=http://<IP-LAN-cua-may>:3000
```

Lấy IP bằng `ipconfig` (dòng IPv4 của card Wi-Fi). Đổi mạng Wi-Fi thì IP đổi, phải sửa lại rồi chạy `npx expo start -c`.

---

## 6. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
| --- | --- | --- |
| `npm : The term 'npm' is not recognized` | Terminal mở trước khi cài Node | Tắt hẳn VS Code rồi mở lại, hoặc chạy dòng nạp PATH bên dưới |
| `npx.ps1 cannot be loaded because running scripts is disabled` | PowerShell chặn script | `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| `P1000: Authentication failed` | Sai user/mật khẩu MySQL | Xoá `backend\.env`, chạy lại script với `root` và đúng mật khẩu |
| `Unknown database` | Chưa có database | Workbench: `CREATE DATABASE recipe_finder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` |
| `npx prisma ...` hỏi cài `prisma@8...` | Đang đứng ở gốc repo | Nhấn `n`, `cd backend` rồi chạy lại |
| `Project is incompatible with this version of Expo Go` | Expo Go không phải bản SDK 57 | Cài Expo Go SDK 57 (mục 1) |
| `cd` báo `positional parameter cannot be found` | Đường dẫn có dấu cách | Bọc đường dẫn trong ngoặc kép: `cd "D:\Thu muc co dau cach"` |
| App báo lỗi mạng khi đăng nhập | Sai IP hoặc khác Wi-Fi | Sửa `mobile/.env`, cùng Wi-Fi, mở Firewall cho Node |

Dòng nạp lại PATH cho terminal hiện tại:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
```

Các dòng `vulnerabilities` khi `npm install` là cảnh báo của thư viện phụ, **không** chạy `npm audit fix --force`.

---

## 7. Làm việc với Git

```powershell
git checkout main
git pull origin main
git checkout -b ten-nhanh-cua-ban

# ... code ...

git status                      # kiểm tra không có file .env
git add .
git commit -m "feat(backend): mo ta ngan"
git push -u origin ten-nhanh-cua-ban
```

Sau đó lên GitHub tạo Pull Request vào `main`. Cập nhật code mới của nhóm vào nhánh mình: `git pull origin main`.

---

## 8. Code với Claude Code

- Mở khung **Claude Code** (biểu tượng tia lửa cam), không phải tab Chat của Copilot.
- Mỗi tính năng một phiên mới (**+ New session**), bắt đầu bằng `/plan`.
- Chỉ Claude tới đúng tài liệu bằng `@`, ví dụ `@docs/TaiLieuTongHop_v14.md`.
- Quy tắc riêng cho mobile nằm ở `mobile/AGENTS.md`; thư viện mobile mới chỉ cài bằng `npx expo install`.
- Thiết kế Figma: xuất frame ra PNG rồi kéo vào chat. Chỗ Figma khác tài liệu thì làm theo tài liệu
  (`docs/DoiChieu_Figma.md`).
