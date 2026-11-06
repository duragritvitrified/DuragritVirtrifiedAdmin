@echo off
echo ========================================================
echo   DuraGrit Vitrified Retail & QR Portal - APK Build
echo ========================================================
echo 1. Building React Production Bundle...
call npm run build

echo 2. Syncing Capacitor Android Assets...
call npx cap sync android

echo 3. Building Android Debug APK with Gradle...
cd android
if exist gradlew.bat (
    call gradlew.bat assembleDebug
    echo.
    echo [SUCCESS] APK compiled at: android\app\build\outputs\apk\debug\app-debug.apk
) else (
    echo Gradle wrapper not found. You can open 'android' folder in Android Studio to build APK.
)
cd ..
pause
