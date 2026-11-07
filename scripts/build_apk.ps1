$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "C:\Java\jdk-21.0.13+9"
$env:ANDROID_HOME = "C:\Users\ADMIN\AppData\Local\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Using JAVA_HOME: $env:JAVA_HOME"
Write-Host "Using ANDROID_HOME: $env:ANDROID_HOME"

Set-Location "app/android"
.\gradlew.bat assembleDebug --no-daemon

if (Test-Path "app\build\outputs\apk\debug\app-debug.apk") {
    $apk = Get-Item "app\build\outputs\apk\debug\app-debug.apk"
    Write-Host "SUCCESS: APK built successfully! Size: $($apk.Length) bytes ($([math]::Round($apk.Length / 1MB, 2)) MB)"
} else {
    Write-Error "APK file not found after build."
}
