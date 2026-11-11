# =====================================================================
# DuraGrit Vitrified - Apply Official Vendor App Launcher Icon
# Updates PWA icons (web, app, public) and Android APK mipmaps
# =====================================================================

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\.."
$sourceImage = "C:\Users\ADMIN\.gemini\antigravity\brain\0098997f-a210-4ac3-ba76-c919e7f81b44\.user_uploaded\media_1794380726868_692ea140.jpg"

if (-not (Test-Path $sourceImage)) {
    throw "Source vendor icon image not found at $sourceImage"
}

Write-Host "Loading source vendor icon image from $sourceImage..."
$srcBmp = [System.Drawing.Image]::FromFile($sourceImage)
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

# 1. Save master vendor icon in public directories
Write-Host "--- 1. Updating Master Web & PWA Icons ---"
$webDirs = @(
    "$root\public",
    "$root\app\public",
    "$root\web\public"
)

# Generate PWA 512x512 and 192x192
$pwa512 = Resize-Image -Image $srcBmp -TargetWidth 512 -TargetHeight 512
$pwa192 = Resize-Image -Image $srcBmp -TargetWidth 192 -TargetHeight 192
$pwa180 = Resize-Image -Image $srcBmp -TargetWidth 180 -TargetHeight 180
$fav32  = Resize-Image -Image $srcBmp -TargetWidth 32 -TargetHeight 32

foreach ($dir in $webDirs) {
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    
    # Standard PWA and Web Icons
    $pwa512.Save("$dir\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $pwa192.Save("$dir\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $fav32.Save("$dir\favicon-32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $pwa180.Save("$dir\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $pwa180.Save("$dir\apple-touch-icon-180x180.png", [System.Drawing.Imaging.ImageFormat]::Png)

    # Dedicated vendor-named icons
    $pwa512.Save("$dir\vendor-icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $pwa192.Save("$dir\vendor-icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $pwa512.Save("$dir\vendor-app-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

    # In site-assets
    $siteAssetsDir = "$dir\site-assets"
    if (Test-Path $siteAssetsDir) {
        $pwa512.Save("$siteAssetsDir\vendor-app-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $pwa192.Save("$siteAssetsDir\vendor-icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
    }

    Write-Host "Updated PWA icons in $dir"
}

# 2. Update Android APK Launcher Mipmaps for Vendor App
Write-Host "--- 2. Updating Android Vendor App APK Mipmaps ---"
$vendorRes = "$root\app\android\app\src\main\res"

$densities = @(
    @{ Name="mdpi"; Launcher=48; Round=48; Fore=108 },
    @{ Name="hdpi"; Launcher=72; Round=72; Fore=162 },
    @{ Name="xhdpi"; Launcher=96; Round=96; Fore=216 },
    @{ Name="xxhdpi"; Launcher=144; Round=144; Fore=324 },
    @{ Name="xxxhdpi"; Launcher=192; Round=192; Fore=432 }
)

if (Test-Path $vendorRes) {
    foreach ($d in $densities) {
        $folder = "$vendorRes\mipmap-$($d.Name)"
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
        # Scale to 74% inside the 108dp canvas so that Android's adaptive circle/squircle masks don't clip the icon
        $foreground = Resize-Image -Image $srcBmp -TargetWidth $d.Fore -TargetHeight $d.Fore -ScaleFactor 0.76
        $foreground.Save("$folder\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $foreground.Dispose()

        Write-Host "Generated Vendor mipmap-$($d.Name) (ic_launcher, ic_launcher_round, ic_launcher_foreground)"
    }

    # Ensure Vendor adaptive icon XMLs
    $v26Folder = "$vendorRes\mipmap-anydpi-v26"
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

    # Set background color to match icon navy tone (#0B0F19)
    $bgXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0B0F19</color>
</resources>
"@
    Set-Content -Path "$vendorRes\values\ic_launcher_background.xml" -Value $bgXml -Encoding utf8
    Write-Host "Configured adaptive icon XMLs and #0B0F19 background in $vendorRes"
}

# Clean up
$pwa512.Dispose()
$pwa192.Dispose()
$pwa180.Dispose()
$fav32.Dispose()
$srcBmp.Dispose()

Write-Host "SUCCESS: Official Vendor Mobile App Icons successfully generated for PWA and Android APK!"

