# =====================================================================
# DuraGrit Vitrified - Apply Official Admin App Launcher Icon
# Updates PWA icons (web, app, public) and Android Admin APK mipmaps
# =====================================================================

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\.."
$sourceImage = "C:\Users\ADMIN\.gemini\antigravity\brain\0098997f-a210-4ac3-ba76-c919e7f81b44\.user_uploaded\media_1794380816194_2347d7fc.jpg"

if (-not (Test-Path $sourceImage)) {
    throw "Source admin icon image not found at $sourceImage"
}

Write-Host "Loading source admin icon image from $sourceImage..."
$rawBytes = [System.IO.File]::ReadAllBytes($sourceImage)
$ms = New-Object System.IO.MemoryStream(,$rawBytes)
$srcBmp = [System.Drawing.Image]::FromStream($ms)
Write-Host "Source image dimensions: $($srcBmp.Width) x $($srcBmp.Height)"

# Helper function to resize image with maximum quality
function Resize-Image {
    param (
        [System.Drawing.Image]$Image,
        [int]$TargetWidth,
        [int]$TargetHeight,
        [bool]$IsRound = $false,
        [float]$ScaleFactor = 1.0,
        [System.Drawing.Color]$BgColor = [System.Drawing.Color]::Transparent
    )

    $dest = New-Object System.Drawing.Bitmap($TargetWidth, $TargetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($BgColor -ne [System.Drawing.Color]::Transparent) {
        $bgBrush = New-Object System.Drawing.SolidBrush($BgColor)
        $g.FillRectangle($bgBrush, 0, 0, $TargetWidth, $TargetHeight)
        $bgBrush.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    if ($IsRound) {
        $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
        $clipPath.AddEllipse(1, 1, $TargetWidth - 2, $TargetHeight - 2)
        $g.SetClip($clipPath)
    }

    $drawW = [int]($TargetWidth * $ScaleFactor)
    $drawH = [int]($TargetHeight * $ScaleFactor)
    $drawX = [int](($TargetWidth - $drawW) / 2)
    $drawY = [int](($TargetHeight - $drawH) / 2)

    $rect = New-Object System.Drawing.Rectangle($drawX, $drawY, $drawW, $drawH)
    $g.DrawImage($Image, $rect)

    if ($IsRound) {
        $g.ResetClip()
    }

    $g.Dispose()
    return $dest
}

# 1. Save master admin icon in public directories
Write-Host "--- 1. Updating Master Admin Web & PWA Icons ---"
$webDirs = @(
    "$root\public",
    "$root\app\public",
    "$root\web\public"
)

# Generate PWA 512x512 and 192x192 for Admin
$admin512 = Resize-Image -Image $srcBmp -TargetWidth 512 -TargetHeight 512
$admin192 = Resize-Image -Image $srcBmp -TargetWidth 192 -TargetHeight 192

foreach ($dir in $webDirs) {
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    
    # Standard Admin PWA and Web Icons
    $admin512.Save("$dir\icon-admin-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $admin192.Save("$dir\icon-admin-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $admin512.Save("$dir\admin-app-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

    # In site-assets
    $siteAssetsDir = "$dir\site-assets"
    if (Test-Path $siteAssetsDir) {
        $admin512.Save("$siteAssetsDir\admin-app-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $admin192.Save("$siteAssetsDir\icon-admin-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
    }

    Write-Host "Updated Admin PWA icons in $dir"
}

# 2. Update Android APK Launcher Mipmaps for Admin App
Write-Host "--- 2. Updating Android Admin App APK Mipmaps ---"
$adminRes = "$root\android\app\src\main\res"

$densities = @(
    @{ Name="mdpi"; Launcher=48; Round=48; Fore=108 },
    @{ Name="hdpi"; Launcher=72; Round=72; Fore=162 },
    @{ Name="xhdpi"; Launcher=96; Round=96; Fore=216 },
    @{ Name="xxhdpi"; Launcher=144; Round=144; Fore=324 },
    @{ Name="xxxhdpi"; Launcher=192; Round=192; Fore=432 }
)

if (Test-Path $adminRes) {
    foreach ($d in $densities) {
        $folder = "$adminRes\mipmap-$($d.Name)"
        if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Path $folder -Force | Out-Null }

        # Legacy Square Icon
        $launcher = Resize-Image -Image $srcBmp -TargetWidth $d.Launcher -TargetHeight $d.Launcher
        $launcher.Save("$folder\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $launcher.Dispose()

        # Legacy Round Icon
        $round = Resize-Image -Image $srcBmp -TargetWidth $d.Round -TargetHeight $d.Round -IsRound $true
        $round.Save("$folder\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $round.Dispose()

        # Android Adaptive Icon Foreground:
        # Scale to 76% inside the 108dp canvas so that Android's adaptive circle/squircle masks don't clip the gold border
        $foreground = Resize-Image -Image $srcBmp -TargetWidth $d.Fore -TargetHeight $d.Fore -ScaleFactor 0.76
        $foreground.Save("$folder\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $foreground.Dispose()

        Write-Host "Generated Admin mipmap-$($d.Name) (ic_launcher, ic_launcher_round, ic_launcher_foreground)"
    }

    # Ensure Admin adaptive icon XMLs
    $v26Folder = "$adminRes\mipmap-anydpi-v26"
    if (-not (Test-Path $v26Folder)) { New-Item -ItemType Directory -Path $v26Folder -Force | Out-Null }
    $adaptiveXml = @"
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
"@
    Set-Content -Path "$v26Folder\ic_launcher.xml" -Value $adaptiveXml -Encoding utf8
    Set-Content -Path "$v26Folder\ic_launcher_round.xml" -Value $adaptiveXml -Encoding utf8

    # Set background color to match icon deep navy tone (#070B14)
    $bgXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#070B14</color>
</resources>
"@
    Set-Content -Path "$adminRes\values\ic_launcher_background.xml" -Value $bgXml -Encoding utf8
    Write-Host "Configured adaptive icon XMLs and #070B14 background in $adminRes"
}

# Clean up
$admin512.Dispose()
$admin192.Dispose()
$srcBmp.Dispose()
$ms.Dispose()

Write-Host "SUCCESS: Official Admin Mobile App Icons successfully generated for PWA and Android APK!"

