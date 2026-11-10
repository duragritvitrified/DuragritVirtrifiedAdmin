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

# 1. Regenerate App Launcher Icons & Mipmaps
Write-Host "[1/6] Generating distinct Launcher Icons & Mipmaps..."
powershell -ExecutionPolicy Bypass -File "$PSScriptRoot\generate_app_icons.ps1"

# 2. Compile web bundle for Vendor
Write-Host "[2/6] Compiling @duragrit/app web bundle..."
npm --workspace=@duragrit/app run build

# 3. Sync to app/android/app/src/main/assets/public/
Write-Host "[3/6] Syncing dist to app/android assets..."
$vendorAssets = "$root\app\android\app\src\main\assets\public"
if (Test-Path $vendorAssets) {
    Remove-Item -Path "$vendorAssets\*" -Recurse -Force
} else {
    New-Item -ItemType Directory -Path $vendorAssets -Force | Out-Null
}
Copy-Item -Path "$root\app\dist\*" -Destination $vendorAssets -Recurse -Force

# 4. Inject strict vendor flag into index.html
Write-Host "[4/6] Injecting Vendor App Type into packaged index.html..."
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
        localStorage.removeItem('duragrit_ota_last_broadcast');
        localStorage.setItem('duragrit_client_installed_version', 'v4.9.5');
        localStorage.setItem('duragrit_client_installed_build', '165');
        ['v4.8.2', 'v4.8.3', 'v4.8.4', 'v4.8.5', 'v4.8.7', 'v4.8.8', 'v4.8.9', 'v4.9.0', 'v4.9.1', 'v4.9.2', 'v4.9.3', 'v4.9.4'].forEach(function(ver) {
          localStorage.setItem('duragrit_ota_applied_' + ver, 'true');
          localStorage.setItem('duragrit_ota_dismissed_' + ver, 'true');
          localStorage.setItem('duragrit_ota_applied_' + ver.replace('v',''), 'true');
          localStorage.setItem('duragrit_ota_dismissed_' + ver.replace('v',''), 'true');
        });
      } catch (_) {}
    </script>
"@
    if ($content -match "<head>") {
        $content = $content -replace "<head>", "<head>`n$vendorInject"
    }
    Set-Content -Path $indexHtml -Value $content -Encoding utf8
}

# 5. Compile with Gradle
Write-Host "[5/6] Running assembleRelease in app/android..."
Set-Location "$root\app\android"
.\gradlew.bat clean --no-daemon
.\gradlew.bat assembleRelease --no-daemon
Set-Location $root

# 6. Distribute APK
$vendorApk = "$root\app\android\app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $vendorApk)) {
    throw "Vendor Release APK not found at $vendorApk"
}

$apkItem = Get-Item $vendorApk
$apkMb = [math]::Round($apkItem.Length / 1MB, 2)
Write-Host "SUCCESS: Vendor Release APK Compiled! Size: $($apkItem.Length) bytes ($apkMb MB)"

Write-Host "[6/6] Mirroring Vendor APK to public download targets..."
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
