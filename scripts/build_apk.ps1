$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "C:\Java\jdk-21.0.13+9"
$env:ANDROID_HOME = "C:\Users\ADMIN\AppData\Local\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

$root = Resolve-Path "$PSScriptRoot\.."

Write-Host "=========================================="
Write-Host "BUILDING DURAGRIT VENDOR PARTNER APK"
Write-Host "=========================================="
Write-Host "JAVA_HOME: $env:JAVA_HOME"
Write-Host "ANDROID_HOME: $env:ANDROID_HOME"

# 1. Compile web bundle for Vendor
Write-Host "[1/5] Compiling @duragrit/app web bundle..."
npm --workspace=@duragrit/app run build

# 2. Sync to app/android/app/src/main/assets/public/
Write-Host "[2/5] Syncing dist to app/android assets..."
$vendorAssets = "$root\app\android\app\src\main\assets\public"
if (-not (Test-Path $vendorAssets)) {
    New-Item -ItemType Directory -Path $vendorAssets -Force | Out-Null
}
Copy-Item -Path "$root\app\dist\*" -Destination $vendorAssets -Recurse -Force

# 3. Inject strict vendor flag into index.html
Write-Host "[3/5] Injecting Vendor App Type into packaged index.html..."
$indexHtml = "$vendorAssets\index.html"
if (Test-Path $indexHtml) {
    $content = Get-Content -Path $indexHtml -Raw
    $vendorInject = @"
    <meta name="duragrit-app-type" content="vendor" />
    <meta name="apple-mobile-web-app-title" content="DuraGrit Vendor" />
    <script>
      window.DURAGRIT_APP_TYPE = 'vendor';
      try {
        localStorage.setItem('duragrit_preferred_portal', 'vendor');
        localStorage.removeItem('duragrit_app_releases_v1');
        var curVer = localStorage.getItem('duragrit_client_installed_version');
        if (!curVer || curVer.indexOf('v3.') === 0 || curVer === 'v4.8.8' || curVer === 'v4.8.9' || curVer === 'v4.9.0' || curVer === 'v4.9.1' || curVer === 'v4.9.2' || curVer === 'v4.9.3') {
          localStorage.setItem('duragrit_client_installed_version', 'v4.9.4');
          localStorage.setItem('duragrit_client_installed_build', '164');
        }
      } catch (_) {}
    </script>
"@
    if ($content -match "<head>") {
        $content = $content -replace "<head>", "<head>`n$vendorInject"
    }
    Set-Content -Path $indexHtml -Value $content -Encoding utf8
}

# 4. Compile with Gradle
Write-Host "[4/5] Running assembleRelease in app/android..."
Set-Location "$root\app\android"
.\gradlew.bat clean --no-daemon
.\gradlew.bat assembleRelease --no-daemon
Set-Location $root

# 5. Distribute APK
$vendorApk = "$root\app\android\app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $vendorApk)) {
    throw "Vendor Release APK not found at $vendorApk"
}

$apkItem = Get-Item $vendorApk
$apkMb = [math]::Round($apkItem.Length / 1MB, 2)
Write-Host "SUCCESS: Vendor Release APK Compiled! Size: $($apkItem.Length) bytes ($apkMb MB)"

Write-Host "[5/5] Mirroring Vendor APK to public download targets..."
$vendorTargets = @(
    "$root\public\apk\duragrit-vendor-v2.apk",
    "$root\public\apk\duragrit-vendor-v4.8.5.apk",
    "$root\public\apk\duragrit-vendor-v4.8.4.apk",
    "$root\public\apk\duragrit-vendor-v4.8.3.apk",
    "$root\public\apk\duragrit-vendor-v4.8.2.apk",
    "$root\web\public\apk\duragrit-vendor-v2.apk",
    "$root\web\public\apk\duragrit-vendor-v4.8.5.apk",
    "$root\web\public\apk\duragrit-vendor-v4.8.4.apk",
    "$root\web\public\apk\duragrit-vendor-v4.8.3.apk",
    "$root\web\public\apk\duragrit-vendor-v4.8.2.apk",
    "$root\web\dist\apk\duragrit-vendor-v2.apk",
    "$root\web\dist\apk\duragrit-vendor-v4.8.5.apk",
    "$root\web\dist\apk\duragrit-vendor-v4.8.4.apk",
    "$root\web\dist\apk\duragrit-vendor-v4.8.3.apk",
    "$root\web\dist\apk\duragrit-vendor-v4.8.2.apk"
)

foreach ($t in $vendorTargets) {
    $parent = Split-Path -Parent $t
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    Copy-Item -Path $vendorApk -Destination $t -Force
    Write-Host "  -> Mirrored to $t"
}

Write-Host "=========================================="
Write-Host "DURAGRIT VENDOR APK BUILD FULLY COMPLETE!"
Write-Host "=========================================="
