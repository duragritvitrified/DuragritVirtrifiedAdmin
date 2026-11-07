@echo off
set "PATH=C:\Java\jdk-21.0.13+9\bin;%PATH%"
cd /d "e:\AI Projects\Duragrit Vitrified"
call "C:\Users\ADMIN\AppData\Local\Android\Sdk\build-tools\34.0.0\apksigner.bat" verify --verbose "app\android\app\build\outputs\apk\release\app-release.apk"
call "C:\Users\ADMIN\AppData\Local\Android\Sdk\build-tools\34.0.0\aapt.exe" dump badging "app\android\app\build\outputs\apk\release\app-release.apk" | findstr "package launchable-activity sdkVersion targetSdkVersion"
