<#
  Recipe Finder - cài môi trường và thư viện trên Windows 10/11.

  Đặt file này ở GỐC repo (cạnh thư mục backend/ và mobile/), rồi mở PowerShell tại đó và chạy:
      powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1

  Tham số:
      -SkipTools   Bỏ qua bước cài Git / Node / VS Code (máy đã có sẵn).
      -Seed        Nạp dữ liệu mẫu (XOÁ SẠCH các bảng trước khi nạp).

  Chạy lại nhiều lần vẫn an toàn: cái gì đã có thì bỏ qua.
#>
param(
    [switch]$SkipTools,
    [switch]$Seed
)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Backend = Join-Path $Root 'backend'
$Mobile = Join-Path $Root 'mobile'

function Step($text) { Write-Host "`n=== $text ===" -ForegroundColor Cyan }
function Ok($text) { Write-Host "  [OK] $text" -ForegroundColor Green }
function Warn($text) { Write-Host "  [!]  $text" -ForegroundColor Yellow }

function Run($exe, [string[]]$argList) {
    Write-Host "  > $exe $($argList -join ' ')" -ForegroundColor DarkGray
    & $exe @argList
    if ($LASTEXITCODE -ne 0) { throw "Lệnh '$exe $($argList -join ' ')' lỗi (mã $LASTEXITCODE)." }
}

function Refresh-Path {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machine;$user"
}

function New-Secret {
    $bytes = New-Object byte[] 48
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    return ([Convert]::ToBase64String($bytes) -replace '[+/=]', '')
}

function Get-MissingPackages($packageJsonPath, [string[]]$wanted) {
    $pkg = Get-Content $packageJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $have = @()
    if ($pkg.dependencies) { $have += $pkg.dependencies.PSObject.Properties.Name }
    if ($pkg.devDependencies) { $have += $pkg.devDependencies.PSObject.Properties.Name }
    return @($wanted | Where-Object { $have -notcontains $_ })
}

function Write-Utf8NoBom($path, $text) {
    [System.IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding($false)))
}

if (-not (Test-Path $Backend) -or -not (Test-Path $Mobile)) {
    throw "Không thấy backend/ và mobile/ cạnh script. Hãy đặt setup-windows.ps1 ở gốc repo Recipie-App-Project."
}

# ---------------------------------------------------------------------------
# 1. Phần mềm nền
# ---------------------------------------------------------------------------
Step '1/6 Phần mềm nền (Git, Node.js LTS, VS Code)'
if ($SkipTools) {
    Warn 'Bỏ qua theo tham số -SkipTools.'
} else {
    $hasWinget = [bool](Get-Command winget -ErrorAction SilentlyContinue)
    $tools = @(
        @{ Cmd = 'git';  Id = 'Git.Git';                    Name = 'Git for Windows' },
        @{ Cmd = 'node'; Id = 'OpenJS.NodeJS.LTS';          Name = 'Node.js LTS' },
        @{ Cmd = 'code'; Id = 'Microsoft.VisualStudioCode'; Name = 'VS Code' }
    )
    foreach ($t in $tools) {
        if (Get-Command $t.Cmd -ErrorAction SilentlyContinue) {
            Ok "$($t.Name) đã có."
        } elseif ($hasWinget) {
            Run 'winget' @('install', '--id', $t.Id, '-e', '--accept-source-agreements', '--accept-package-agreements')
            Refresh-Path
        } else {
            throw "Thiếu $($t.Name) và máy không có winget. Cài tay rồi chạy lại script."
        }
    }
}

Refresh-Path
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Vừa cài Node nhưng terminal chưa nhận. Đóng PowerShell, mở lại rồi chạy script lần nữa.'
}

# Prisma 7 cần Node ^20.19 || ^22.12 || >=24; React Native 0.86 cần ^22.13 || ^24.3 || >=25.
$nodeVersion = [version]((& node -v).TrimStart('v'))
$nodeOk = ($nodeVersion.Major -eq 22 -and $nodeVersion.Minor -ge 13) -or
          ($nodeVersion.Major -eq 24 -and $nodeVersion.Minor -ge 3) -or
          ($nodeVersion.Major -ge 25)
if (-not $nodeOk) {
    throw "Node $nodeVersion quá cũ. Cần Node 22.13+ hoặc 24.3+. Gỡ bản cũ, cài Node LTS mới rồi chạy lại."
}
Ok "Node $nodeVersion"

# ---------------------------------------------------------------------------
# 2. Extension VS Code
# ---------------------------------------------------------------------------
Step '2/6 Extension VS Code'
$extensions = @(
    'anthropic.claude-code',        # Claude Code
    'expo.vscode-expo-tools',       # Expo (gợi ý app.json, debug)
    'Prisma.prisma',                # schema.prisma
    'oxc.oxc-vscode',               # oxlint - linter của backend
    'dbaeumer.vscode-eslint',       # ESLint - linter của mobile (npx expo lint)
    'esbenp.prettier-vscode',       # Prettier - format backend
    'cweijan.vscode-mysql-client2', # Xem bảng MySQL ngay trong VS Code
    'mikestead.dotenv'              # Tô màu file .env
)
if (Get-Command code -ErrorAction SilentlyContinue) {
    foreach ($ext in $extensions) {
        & code --install-extension $ext --force | Out-Null
        if ($LASTEXITCODE -eq 0) { Ok $ext } else { Warn "Không cài được $ext - cài tay trong tab Extensions." }
    }
} else {
    Warn 'Không thấy lệnh code. Mở VS Code > Ctrl+Shift+P > "Shell Command: Install code command in PATH", rồi chạy lại.'
}

# ---------------------------------------------------------------------------
# 3. MySQL
# ---------------------------------------------------------------------------
Step '3/6 MySQL'
$mysqlUp = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $async = $tcp.BeginConnect('127.0.0.1', 3306, $null, $null)
    $mysqlUp = $async.AsyncWaitHandle.WaitOne(2000) -and $tcp.Connected
    $tcp.Close()
} catch { $mysqlUp = $false }
if ($mysqlUp) {
    Ok 'Có MySQL/MariaDB đang chạy ở cổng 3306.'
} else {
    Warn 'Chưa có MySQL ở cổng 3306. Cài MySQL Server 8 (https://dev.mysql.com/downloads/installer/)'
    Warn 'hoặc bật MySQL trong XAMPP/Laragon, rồi chạy lại script. Các bước còn lại vẫn tiếp tục.'
}

# ---------------------------------------------------------------------------
# 4. Backend
# ---------------------------------------------------------------------------
Step '4/6 Backend (NestJS + Prisma)'
Push-Location $Backend
try {
    Run 'npm.cmd' @('install', '--no-fund')

    # Thư viện tài liệu v14 cần nhưng package.json chưa có.
    #   nodemailer      gửi OTP qua SMTP (UC-30)
    #   @nestjs/axios   gọi Spoonacular API (SpoonacularProvider)
    $deps = Get-MissingPackages 'package.json' @('nodemailer', '@nestjs/axios', 'axios')
    if ($deps.Count -gt 0) { Run 'npm.cmd' (@('install', '--no-fund') + $deps) } else { Ok 'Thư viện chính đã đủ.' }
    #   @types/multer   kiểu dữ liệu file upload cho POST /media/images
    $devDeps = Get-MissingPackages 'package.json' @('@types/nodemailer', '@types/multer')
    if ($devDeps.Count -gt 0) { Run 'npm.cmd' (@('install', '-D', '--no-fund') + $devDeps) } else { Ok 'Thư viện dev đã đủ.' }

    # tsconfig giới hạn "types" nên phải khai báo multer thì mới dùng được Express.Multer.File.
    $tsconfig = Get-Content 'tsconfig.json' -Raw -Encoding UTF8
    if ($tsconfig -notmatch '"multer"') {
        $tsconfig = $tsconfig -replace '"types": \["node", "jest"\]', '"types": ["node", "jest", "multer"]'
        Write-Utf8NoBom (Join-Path $Backend 'tsconfig.json') $tsconfig
        Ok 'Đã thêm "multer" vào types trong tsconfig.json.'
    }

    # File .env
    if (Test-Path '.env') {
        Ok 'backend/.env đã có - giữ nguyên.'
    } else {
        Write-Host '  Tạo backend/.env. Nhập thông tin MySQL (Enter để dùng giá trị trong ngoặc):'
        $dbUser = Read-Host '    User [root]'
        if (-not $dbUser) { $dbUser = 'root' }
        $secure = Read-Host '    Mật khẩu' -AsSecureString
        $dbPass = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
        $dbName = Read-Host '    Tên database [recipe_finder]'
        if (-not $dbName) { $dbName = 'recipe_finder' }

        $url = 'mysql://{0}:{1}@localhost:3306/{2}' -f [uri]::EscapeDataString($dbUser), [uri]::EscapeDataString($dbPass), $dbName
        $envText = @"
PORT=3000

DATABASE_URL="$url"
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=$dbUser
DATABASE_PASSWORD="$dbPass"
DATABASE_NAME=$dbName

JWT_SECRET=$(New-Secret)
JWT_EXPIRES_IN=30d
RESET_TOKEN_SECRET=$(New-Secret)

SPOONACULAR_API_KEY=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
"@
        Write-Utf8NoBom (Join-Path $Backend '.env') $envText
        Ok 'Đã tạo backend/.env (JWT_SECRET sinh ngẫu nhiên). Spoonacular và SMTP điền sau.'
    }

    Run 'npx.cmd' @('prisma', 'generate')

    if ($mysqlUp) {
        # migrate deploy chỉ chạy các migration chưa áp dụng, không xoá dữ liệu.
        & npx.cmd prisma migrate deploy
        if ($LASTEXITCODE -eq 0) {
            Ok 'Database đã có đủ bảng.'
            if ($Seed) { Run 'npx.cmd' @('prisma', 'db', 'seed') }
        } else {
            Warn 'migrate deploy lỗi. Kiểm tra mật khẩu trong backend/.env, hoặc tạo database bằng:'
            Warn '  CREATE DATABASE recipe_finder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
        }
    } else {
        Warn 'Bỏ qua tạo bảng vì chưa có MySQL.'
    }
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# 5. Mobile
# ---------------------------------------------------------------------------
Step '5/6 Mobile (Expo SDK 57)'
Push-Location $Mobile
try {
    Run 'npm.cmd' @('install', '--no-fund')

    # Thư viện tài liệu v14 cần. Dùng "expo install" để lấy đúng phiên bản hợp SDK 57.
    #   @react-native-async-storage/async-storage  lưu cài đặt đơn giản
    #   expo-sqlite                                cache công thức yêu thích để xem offline
    #   @react-native-community/netinfo            kiểm tra có mạng hay không
    #   react-native-youtube-iframe (+ webview)    video hướng dẫn nấu ăn
    #   expo-image-picker                          chọn ảnh đại diện / ảnh công thức
    $mobileDeps = Get-MissingPackages 'package.json' @(
        '@react-native-async-storage/async-storage',
        'expo-sqlite',
        '@react-native-community/netinfo',
        'react-native-webview',
        'react-native-youtube-iframe',
        'expo-image-picker'
    )
    if ($mobileDeps.Count -gt 0) { Run 'npx.cmd' (@('expo', 'install') + $mobileDeps) } else { Ok 'Thư viện mobile đã đủ.' }

    if (Test-Path '.env') {
        Ok 'mobile/.env đã có - giữ nguyên.'
    } else {
        $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
              Where-Object { $_.IPAddress -notmatch '^(127\.|169\.254\.)' -and $_.InterfaceAlias -match 'Wi-?Fi|Ethernet|WLAN' } |
              Select-Object -First 1 -ExpandProperty IPAddress
        if (-not $ip) { $ip = 'localhost'; Warn 'Không đoán được IP LAN - sửa EXPO_PUBLIC_API_URL trong mobile/.env bằng IP từ lệnh ipconfig.' }
        Write-Utf8NoBom (Join-Path $Mobile '.env') "EXPO_PUBLIC_API_URL=http://${ip}:3000`n"
        Ok "Đã tạo mobile/.env với EXPO_PUBLIC_API_URL=http://${ip}:3000"
    }
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# 6. Claude Code: skill Prisma
# ---------------------------------------------------------------------------
Step '6/6 Skill Prisma cho Claude Code'
$agentSkills = Join-Path $Backend '.agents\skills'
$claudeSkills = Join-Path $Root '.claude\skills'
if (Test-Path $agentSkills) {
    New-Item -ItemType Directory -Force -Path $claudeSkills | Out-Null
    $copied = 0
    Get-ChildItem $agentSkills -Directory | ForEach-Object {
        $dest = Join-Path $claudeSkills $_.Name
        if (-not (Test-Path $dest)) { Copy-Item $_.FullName $dest -Recurse; $copied++ }
    }
    Ok "Đã chép $copied skill sang .claude\skills (skill có sẵn được giữ nguyên)."
} else {
    Warn 'Không thấy backend/.agents/skills - bỏ qua.'
}

Step 'XONG'
Write-Host @"
  Chạy dự án (2 terminal trong VS Code):
    1) cd backend ; npm run start:dev
    2) cd mobile  ; npx expo start      -> quét QR bằng Expo Go
  Dữ liệu mẫu (xoá sạch bảng rồi nạp lại): chạy lại script với -SkipTools -Seed
  Nhớ commit: package.json, package-lock.json, tsconfig.json, app.json, .claude/skills, .vscode
  KHÔNG commit: backend/.env, mobile/.env
"@
