$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "C:\Java\jdk-21.0.13+9"
$env:ANDROID_HOME = "C:\Users\ADMIN\AppData\Local\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

$root = Resolve-Path "$PSScriptRoot\.."

Write-Host "=========================================="
Write-Host "BUILDING DURAGRIT ADMIN COMMAND CONSOLE APK"
Write-Host "=========================================="
Write-Host "JAVA_HOME: $env:JAVA_HOME"
Write-Host "ANDROID_HOME: $env:ANDROID_HOME"

# 1. Regenerate Admin Launcher Icons & Mipmaps
Write-Host "[1/6] Generating distinct Admin Launcher Icons & Mipmaps..."
powershell -ExecutionPolicy Bypass -File "$PSScriptRoot\generate_admin_icons.ps1"

# 2. Build Mobile App Web Assets
Write-Host "[2/6] Compiling @duragrit/app web bundle..."
npm --workspace=@duragrit/app run build

# 3. Synchronize Web Assets to Android project
Write-Host "[3/6] Syncing dist assets into android/app/src/main/assets/public/..."
$assetsPublic = "$root\android\app\src\main\assets\public"
if (-not (Test-Path $assetsPublic)) {
    New-Item -ItemType Directory -Path $assetsPublic -Force | Out-Null
}

Copy-Item -Path "$root\app\dist\*" -Destination $assetsPublic -Recurse -Force

# 4. Inject strict Admin flags into index.html
Write-Host "[4/6] Injecting Admin App Type into packaged index.html..."
$indexHtmlPath = "$assetsPublic\index.html"
if (Test-Path $indexHtmlPath) {
    $htmlContent = Get-Content -Path $indexHtmlPath -Raw
    $adminInjection = @"
    <meta name="duragrit-app-type" content="admin" />
    <meta name="apple-mobile-web-app-title" content="DuraGrit Admin" />
    <script>
      window.DURAGRIT_APP_TYPE = 'admin';
      try {
        localStorage.setItem('duragrit_preferred_portal', 'admin');
        localStorage.removeItem('duragrit_admin_app_releases_v1');
        var curVer = localStorage.getItem('duragrit_admin_installed_version');
        if (!curVer || curVer.indexOf('v3.') === 0 || curVer === 'v4.8.8' || curVer === 'v4.8.9') {
          localStorage.setItem('duragrit_admin_installed_version', 'v4.9.0');
          localStorage.setItem('duragrit_admin_installed_build', '160');
        }
      } catch (_) {}
    </script>
"@
    # Inject right after <head>
    if ($htmlContent -match "<head>") {
        $htmlContent = $htmlContent -replace "<head>", "<head>`n$adminInjection"
    }
    Set-Content -Path $indexHtmlPath -Value $htmlContent -Encoding utf8
}

# 5. Build signed Release APK using Gradle
Write-Host "[5/6] Running Gradle assembleRelease in android/..."
Set-Location "$root\android"
.\gradlew.bat clean --no-daemon
.\gradlew.bat assembleRelease --no-daemon
Set-Location $root

# 6. Verify and Distribute Admin APKs
$releaseApk = "$root\android\app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $releaseApk)) {
    throw "Release APK build failed. $releaseApk does not exist."
}

$apkItem = Get-Item $releaseApk
$apkMb = [math]::Round($apkItem.Length / 1MB, 2)
Write-Host "SUCCESS: Admin Release APK Compiled! Size: $($apkItem.Length) bytes ($apkMb MB)"

Write-Host "[6/6] Distributing Admin APK to public downloads..."
$targets = @(
    "$root\public\apk\duragrit-admin-command-v2.apk",
    "$root\public\apk\duragrit-admin-v2.apk",
    "$root\web\public\apk\duragrit-admin-command-v2.apk",
    "$root\web\public\apk\duragrit-admin-v2.apk",
    "$root\web\dist\apk\duragrit-admin-command-v2.apk",
    "$root\web\dist\apk\duragrit-admin-v2.apk"
)

foreach ($t in $targets) {
    $parent = Split-Path -Parent $t
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Copy-Item -Path $releaseApk -Destination $t -Force
    Write-Host "  -> Mirrored to $t"
}

Write-Host "=========================================="
Write-Host "DURAGRIT ADMIN APK BUILD FULLY COMPLETE!"
Write-Host "=========================================="

