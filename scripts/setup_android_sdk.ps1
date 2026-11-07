$ErrorActionPreference = "Stop"

$sdkDir = "C:\Users\ADMIN\AppData\Local\Android\Sdk"
$zipPath = "$sdkDir\cmdline-tools.zip"
$cmdlineDir = "$sdkDir\cmdline-tools"
$latestDir = "$cmdlineDir\latest"

$env:JAVA_HOME = "C:\Java\jdk-21.0.13+9"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

if (-not (Test-Path "$latestDir\bin\sdkmanager.bat")) {
    Write-Output "Downloading Android command line tools..."
    $url = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $wc = New-Object System.Net.WebClient
    $wc.DownloadFile($url, $zipPath)
    Write-Output "Downloaded cmdline-tools.zip. Extracting..."

    # Extract to temporary folder
    $tempExtract = "$sdkDir\temp_cmdline"
    if (Test-Path $tempExtract) { Remove-Item -Path $tempExtract -Recurse -Force }
    Expand-Archive -Path $zipPath -DestinationPath $tempExtract -Force

    # Move cmdline-tools to $latestDir
    if (-not (Test-Path $cmdlineDir)) { New-Item -ItemType Directory -Path $cmdlineDir -Force | Out-Null }
    if (Test-Path $latestDir) { Remove-Item -Path $latestDir -Recurse -Force }
    Move-Item -Path "$tempExtract\cmdline-tools" -Destination $latestDir -Force

    Remove-Item -Path $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $zipPath -Force -ErrorAction SilentlyContinue
    Write-Output "Command line tools installed at $latestDir"
}

# Accept licenses and install platform-tools, platforms;android-34, build-tools;34.0.0
Write-Output "Installing Android SDK Platform 34 and Build Tools..."
$sdkManager = "$latestDir\bin\sdkmanager.bat"

# Auto-accept licenses
$licensesDir = "$sdkDir\licenses"
if (-not (Test-Path $licensesDir)) { New-Item -ItemType Directory -Path $licensesDir -Force | Out-Null }
# Known license hashes for Android SDK
$androidSdkLicense = "24333f8a63b6825ea9c5514f83c2829b004d1fee`nd56f5187479451eabf01fb78af6dfcb131a6481e`n24333f8a63b6825ea9c5514f83c2829b004d1fee"
Set-Content -Path "$licensesDir\android-sdk-license" -Value $androidSdkLicense
Set-Content -Path "$licensesDir\android-sdk-preview-license" -Value "84831b9409646a918e30573bab4c9c91346d8abd"

& cmd /c "echo y | `"$sdkManager`" --sdk_root=`"$sdkDir`" `"platforms;android-34`" `"build-tools;34.0.0`""

Write-Output "Android SDK setup complete!"
