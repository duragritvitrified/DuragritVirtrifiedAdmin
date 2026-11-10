Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\.."
$logoPath = "$root\public\logo-white.png"

if (-not (Test-Path $logoPath)) {
    throw "Logo not found at $logoPath"
}

function New-AppIconImage([string]$appType, [int]$size, [bool]$isRound = $false, [bool]$isForeground = $false) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    $isAdmin = ($appType -eq "Admin")

    # Background rendering (only for non-foreground launcher icons)
    if (-not $isForeground) {
        $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
        
        # Color palette
        $cTop = if ($isAdmin) { [System.Drawing.ColorTranslator]::FromHtml("#070B14") } else { [System.Drawing.ColorTranslator]::FromHtml("#140F0D") }
        $cBottom = if ($isAdmin) { [System.Drawing.ColorTranslator]::FromHtml("#0F172A") } else { [System.Drawing.ColorTranslator]::FromHtml("#261714") }
        $rimColor = if ($isAdmin) { [System.Drawing.ColorTranslator]::FromHtml("#BA3A24") } else { [System.Drawing.ColorTranslator]::FromHtml("#C84826") }
        $accentGold = [System.Drawing.ColorTranslator]::FromHtml("#F59E0B")

        $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $cTop, $cBottom, 45.0)

        if ($isRound) {
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $path.AddEllipse(2, 2, $size - 4, $size - 4)
            $g.FillPath($brush, $path)

            # Vitrified architectural cross lines
            $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(16, 255, 255, 255), 1.0)
            $step = [int]($size / 8)
            for ($i = $step; $i -lt $size; $i += $step) {
                $g.DrawLine($gridPen, $i, 0, $i, $size)
                $g.DrawLine($gridPen, 0, $i, $size, $i)
            }
            $gridPen.Dispose()

            # Center glow
            $glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
            $glowBrush.CenterColor = if ($isAdmin) { [System.Drawing.Color]::FromArgb(45, 186, 58, 36) } else { [System.Drawing.Color]::FromArgb(45, 200, 72, 38) }
            $glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 7, 11, 20))
            $g.FillPath($glowBrush, $path)
            $glowBrush.Dispose()

            # Rim
            $rimPen = New-Object System.Drawing.Pen($rimColor, [float][Math]::Max(2.5, $size * 0.026))
            $g.DrawPath($rimPen, $path)
            $rimPen.Dispose()

            $innerPath = New-Object System.Drawing.Drawing2D.GraphicsPath
            $offset = [Math]::Max(3, [int]($size * 0.038))
            $innerPath.AddEllipse($offset, $offset, $size - ($offset * 2), $size - ($offset * 2))
            $innerPen = New-Object System.Drawing.Pen($accentGold, 1.0)
            $g.DrawPath($innerPen, $innerPath)
            $innerPen.Dispose()
            $innerPath.Dispose()
            $path.Dispose()
        } else {
            # Squircle
            $r = [int]($size * 0.22)
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $d = $r * 2
            $path.AddArc(0, 0, $d, $d, 180, 90)
            $path.AddArc($size - $d, 0, $d, $d, 270, 90)
            $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
            $path.AddArc(0, $size - $d, $d, $d, 90, 90)
            $path.CloseFigure()

            $g.FillPath($brush, $path)

            # Vitrified architectural cross lines
            $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(16, 255, 255, 255), 1.0)
            $step = [int]($size / 8)
            for ($i = $step; $i -lt $size; $i += $step) {
                $g.DrawLine($gridPen, $i, 0, $i, $size)
                $g.DrawLine($gridPen, 0, $i, $size, $i)
            }
            $gridPen.Dispose()

            # Center glow
            $glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
            $glowBrush.CenterColor = if ($isAdmin) { [System.Drawing.Color]::FromArgb(45, 186, 58, 36) } else { [System.Drawing.Color]::FromArgb(45, 200, 72, 38) }
            $glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 7, 11, 20))
            $g.FillPath($glowBrush, $path)
            $glowBrush.Dispose()

            # Rim
            $rimPen = New-Object System.Drawing.Pen($rimColor, [float][Math]::Max(2.5, $size * 0.026))
            $g.DrawPath($rimPen, $path)
            $rimPen.Dispose()
            $path.Dispose()
        }
        $brush.Dispose()
    }

    # Load and render official DuraGrit Vitrified logo
    $logoImg = [System.Drawing.Image]::FromFile($logoPath)
    $logoW = [int]($size * 0.54)
    $logoH = [int]($logoW * ($logoImg.Height / [float]$logoImg.Width))
    $logoX = [int](($size - $logoW) / 2)
    $logoY = [int](($size / 2) - $logoH - ($size * 0.015))

    $g.DrawImage($logoImg, $logoX, $logoY, $logoW, $logoH)
    $logoImg.Dispose()

    # Draw clean, legible text label directly below logo mark
    $labelText = if ($isAdmin) { "ADMIN" } else { "VENDOR" }
    $badgeW = [int]($size * 0.44)
    $badgeH = [int]($size * 0.13)
    $badgeX = [int](($size - $badgeW) / 2)
    $badgeY = [int]($logoY + $logoH + ($size * 0.045))

    # Pill shape for label
    $br = [int]($badgeH * 0.48)
    $bd = $br * 2
    $badgePath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $badgePath.AddArc($badgeX, $badgeY, $bd, $bd, 180, 90)
    $badgePath.AddArc($badgeX + $badgeW - $bd, $badgeY, $bd, $bd, 270, 90)
    $badgePath.AddArc($badgeX + $badgeW - $bd, $badgeY + $badgeH - $bd, $bd, $bd, 0, 90)
    $badgePath.AddArc($badgeX, $badgeY + $badgeH - $bd, $bd, $bd, 90, 90)
    $badgePath.CloseFigure()

    $badgeColor1 = if ($isAdmin) { [System.Drawing.ColorTranslator]::FromHtml("#BA3A24") } else { [System.Drawing.ColorTranslator]::FromHtml("#C84826") }
    $badgeColor2 = if ($isAdmin) { [System.Drawing.ColorTranslator]::FromHtml("#8E2513") } else { [System.Drawing.ColorTranslator]::FromHtml("#962B16") }
    
    $badgeBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle($badgeX, $badgeY, $badgeW, $badgeH)),
        $badgeColor1,
        $badgeColor2,
        90.0
    )
    $g.FillPath($badgeBrush, $badgePath)
    $badgeBrush.Dispose()

    $borderPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#FCD34D"), [float][Math]::Max(1.2, $size * 0.012))
    $g.DrawPath($borderPen, $badgePath)
    $borderPen.Dispose()
    $badgePath.Dispose()

    # Text inside pill
    $fontSize = [float]($badgeH * 0.58)
    $font = New-Object System.Drawing.Font("Arial Black", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = [System.Drawing.StringAlignment]::Center
    $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
    $textY = $badgeY + ($badgeH / 2.0) + 0.5
    $g.DrawString($labelText, $font, $textBrush, ($size / 2.0), $textY, $fmt)
    $textBrush.Dispose()
    $font.Dispose()
    $fmt.Dispose()

    $g.Dispose()
    return $bmp
}

# Densities for Android
$densities = @(
    @{ Name="mdpi"; Launcher=48; Round=48; Fore=108 },
    @{ Name="hdpi"; Launcher=72; Round=72; Fore=162 },
    @{ Name="xhdpi"; Launcher=96; Round=96; Fore=216 },
    @{ Name="xxhdpi"; Launcher=144; Round=144; Fore=324 },
    @{ Name="xxxhdpi"; Launcher=192; Round=192; Fore=432 }
)

Write-Host "--- Generating Android Admin Launcher Mipmaps ---"
$adminRes = "$root\android\app\src\main\res"
if (Test-Path $adminRes) {
    foreach ($d in $densities) {
        $folder = "$adminRes\mipmap-$($d.Name)"
        if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Path $folder -Force | Out-Null }

        $launcherBmp = New-AppIconImage "Admin" $d.Launcher $false $false
        $launcherBmp.Save("$folder\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $launcherBmp.Dispose()

        $roundBmp = New-AppIconImage "Admin" $d.Round $true $false
        $roundBmp.Save("$folder\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $roundBmp.Dispose()

        $foreBmp = New-AppIconImage "Admin" $d.Fore $false $true
        $foreBmp.Save("$folder\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $foreBmp.Dispose()

        Write-Host "Generated Admin mipmap-$($d.Name)"
    }

    $adminV26 = "$adminRes\mipmap-anydpi-v26"
    if (-not (Test-Path $adminV26)) { New-Item -ItemType Directory -Path $adminV26 -Force | Out-Null }
    $adaptiveAdminXml = @"
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
"@
    Set-Content -Path "$adminV26\ic_launcher.xml" -Value $adaptiveAdminXml -Encoding utf8
    Set-Content -Path "$adminV26\ic_launcher_round.xml" -Value $adaptiveAdminXml -Encoding utf8
}

Write-Host "--- Generating Android Vendor Launcher Mipmaps ---"
$vendorRes = "$root\app\android\app\src\main\res"
if (Test-Path $vendorRes) {
    foreach ($d in $densities) {
        $folder = "$vendorRes\mipmap-$($d.Name)"
        if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Path $folder -Force | Out-Null }

        $launcherBmp = New-AppIconImage "Vendor" $d.Launcher $false $false
        $launcherBmp.Save("$folder\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $launcherBmp.Dispose()

        $roundBmp = New-AppIconImage "Vendor" $d.Round $true $false
        $roundBmp.Save("$folder\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $roundBmp.Dispose()

        $foreBmp = New-AppIconImage "Vendor" $d.Fore $false $true
        $foreBmp.Save("$folder\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $foreBmp.Dispose()

        Write-Host "Generated Vendor mipmap-$($d.Name)"
    }

    # Ensure Vendor adaptive icon XMLs point to @mipmap/ic_launcher_foreground
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
}

Write-Host "--- Generating Web / PWA Launcher Icons ---"
$webTargets = @(
    "$root\public",
    "$root\web\public",
    "$root\app\public"
)

$admin512 = New-AppIconImage "Admin" 512 $false $false
$admin192 = New-AppIconImage "Admin" 192 $false $false
$vendor512 = New-AppIconImage "Vendor" 512 $false $false
$vendor192 = New-AppIconImage "Vendor" 192 $false $false

foreach ($t in $webTargets) {
    if (-not (Test-Path $t)) { New-Item -ItemType Directory -Path $t -Force | Out-Null }
    
    # Admin icons
    $admin512.Save("$t\icon-admin-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $admin192.Save("$t\icon-admin-192.png", [System.Drawing.Imaging.ImageFormat]::Png)

    # Vendor icons (default icon-192 / icon-512)
    $vendor512.Save("$t\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $vendor192.Save("$t\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    Write-Host "Updated web launcher icons in $t"
}

$admin512.Dispose()
$admin192.Dispose()
$vendor512.Dispose()
$vendor192.Dispose()

Write-Host "All Android & Web App Icons Generated Successfully!"

