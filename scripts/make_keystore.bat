@echo off
set "PATH=C:\Java\jdk-21.0.13+9\bin;%PATH%"
cd /d "e:\AI Projects\Duragrit Vitrified\app\android"
if exist duragrit-release.jks del /f /q duragrit-release.jks
keytool -genkeypair -v -keystore duragrit-release.jks -alias duragrit -keyalg RSA -keysize 2048 -validity 10000 -storepass duragritpassword -keypass duragritpassword -dname "CN=DuraGrit Vitrified, OU=Mobile Security, O=DuraGrit Vitrified Pvt Ltd, L=Morbi, ST=Gujarat, C=IN"
if exist duragrit-release.jks (
    echo SUCCESS: Release keystore created!
) else (
    echo ERROR: Failed to create keystore
)
