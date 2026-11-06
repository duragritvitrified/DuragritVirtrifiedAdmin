@echo off
echo ========================================================
echo   DuraGrit Vitrified - Native Flutter APK Build
echo ========================================================

echo 1. Checking Flutter installation...
where flutter >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [NOTICE] Flutter CLI is not currently found in your PATH.
    echo To compile this Flutter APK:
    echo  1. Download Flutter SDK from: https://docs.flutter.dev/get-started/install/windows
    echo  2. Add 'flutter\bin' to your system environment variables PATH.
    echo  3. Re-run this script: build-apk.bat
    echo.
    echo Note: The Capacitor Android APK is already built and available in ../app/android!
    pause
    exit /b
)

echo 2. Getting Flutter dependencies...
call flutter pub get

echo 3. Building Android Release APK...
call flutter build apk --release

echo.
echo [SUCCESS] Flutter APK compiled at:
echo build\app\outputs\flutter-apk\app-release.apk
pause
