$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "C:\Java\jdk-21.0.13+9"
$env:ANDROID_HOME = "C:\Users\ADMIN\AppData\Local\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Using JAVA_HOME: $env:JAVA_HOME"
Write-Host "Using ANDROID_HOME: $env:ANDROID_HOME"

Set-Location "app/android"
# Clean previous builds
.\gradlew.bat clean --no-daemon
# Build signed release APK
.\gradlew.bat assembleRelease --no-daemon

if (Test-Path "app\build\outputs\apk\release\app-release.apk") {
    $apk = Get-Item "app\build\outputs\apk\release\app-release.apk"
    Write-Host "SUCCESS: Release APK built! Size: $($apk.Length) bytes ($([math]::Round($apk.Length / 1MB, 2)) MB)"
} else {
    Write-Error "Release APK not found after build."
}
