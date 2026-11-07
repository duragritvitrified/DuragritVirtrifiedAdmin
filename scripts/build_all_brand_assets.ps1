Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\.."
$logoWhiteFile = "$PSScriptRoot\downloaded_logo_white.png"
$logoColorFile = "$PSScriptRoot\downloaded_logo.png"

if (-not (Test-Path $logoWhiteFile)) {
    throw "Official logo white file missing at $logoWhiteFile"
}

$logoWhite = [System.Drawing.Bitmap]::FromFile($logoWhiteFile)
$logoColor = [System.Drawing.Bitmap]::FromFile($logoColorFile)

# Crop official DG emblem
$rectEmblem = New-Object System.Drawing.Rectangle(4, 0, 105, $logoWhite.Height)
$emblem = $logoWhite.Clone($rectEmblem, $logoWhite.PixelFormat)

# Crop official wordmark
$wordW = [int]$logoWhite.Width - 116
$rectWord = New-Object System.Drawing.Rectangle(116, 0, $wordW, [int]$logoWhite.Height)
$wordmark = $logoWhite.Clone($rectWord, $logoWhite.PixelFormat)

function New-IconImage([int]$size, [bool]$isRound = $false, [bool]$foregroundOnly = $false) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    if (-not $foregroundOnly) {
        $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
        $cTop = [System.Drawing.ColorTranslator]::FromHtml("#0B0F19")
        $cBottom = [System.Drawing.ColorTranslator]::FromHtml("#161F48")
        $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $cTop, $cBottom, 45.0)

        if ($isRound) {
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $path.AddEllipse(2, 2, $size - 4, $size - 4)
            $g.FillPath($brush, $path)

            # Vitrified Grid
            $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(14, 255, 255, 255), 1.0)
            $step = [int]($size / 8)
            for ($i = $step; $i -lt $size; $i += $step) {
                $g.DrawLine($gridPen, $i, 0, $i, $size)
                $g.DrawLine($gridPen, 0, $i, $size, $i)
            }
            $gridPen.Dispose()

            # Center terracotta aura
            $glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
            $glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(55, 200, 72, 38)
            $glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 11, 15, 25))
            $g.FillPath($glowBrush, $path)
            $glowBrush.Dispose()

            # Gold Rim
            $goldPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#FAA322"), [float][Math]::Max(2, $size * 0.025))
            $g.DrawPath($goldPen, $path)
            $goldPen.Dispose()
            $path.Dispose()
        } else {
            $r = [int]($size * 0.20)
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $d = $r * 2
            $path.AddArc(0, 0, $d, $d, 180, 90)
            $path.AddArc($size - $d, 0, $d, $d, 270, 90)
            $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
            $path.AddArc(0, $size - $d, $d, $d, 90, 90)
            $path.CloseFigure()

            $g.FillPath($brush, $path)

            $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(16, 255, 255, 255), 1.0)
            $step = [int]($size / 8)
            for ($i = $step; $i -lt $size; $i += $step) {
                $g.DrawLine($gridPen, $i, 0, $i, $size)
                $g.DrawLine($gridPen, 0, $i, $size, $i)
            }
            $gridPen.Dispose()

            # Center terracotta aura
            $glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
            $glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(55, 200, 72, 38)
            $glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 11, 15, 25))
            $g.FillPath($glowBrush, $path)
            $glowBrush.Dispose()

            # Gold Rim
            $goldPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#FAA322"), [float][Math]::Max(2, $size * 0.022))
            $g.DrawPath($goldPen, $path)
            $goldPen.Dispose()
            $path.Dispose()
        }
        $brush.Dispose()
    }

    if ($size -ge 192 -and -not $foregroundOnly) {
        # High resolution composite: Emblem + Wordmark + Tagline
        $scale = $size / 512.0
        $embW = [int](180 * $scale)
        $embH = [int](($emblem.Height / $emblem.Width) * $embW)
        $embX = [int](($size - $embW) / 2)
        $embY = [int](70 * $scale)
        $g.DrawImage($emblem, $embX, $embY, $embW, $embH)

        $targetW = [int](380 * $scale)
        $targetH = [int](($wordmark.Height / $wordmark.Width) * $targetW)
        $targetX = [int](($size - $targetW) / 2)
        $targetY = [int](285 * $scale)
        $g.DrawImage($wordmark, $targetX, $targetY, $targetW, $targetH)

        if ($size -ge 384) {
            $fontSub = New-Object System.Drawing.Font("Arial", [int](14 * $scale), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
            $brushGold = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#FAA322"))
            $format = New-Object System.Drawing.StringFormat
            $format.Alignment = [System.Drawing.StringAlignment]::Center
            $g.DrawString("KILN OPERATING NETWORK", $fontSub, $brushGold, ($size / 2), [int](420 * $scale), $format)
            $fontSub.Dispose()
            $brushGold.Dispose()
            $format.Dispose()
        }
    } else {
        # Medium & small sizes (or foreground): Official Emblem centered
        $scale = if ($foregroundOnly) { 0.58 } else { 0.68 }
        $embW = [int]($size * $scale)
        $embH = [int](($emblem.Height / $emblem.Width) * $embW)
        $embX = [int](($size - $embW) / 2)
        $embY = [int](($size - $embH) / 2)
        $g.DrawImage($emblem, $embX, $embY, $embW, $embH)
    }

    $g.Dispose()
    return $bmp
}

function New-SplashImage([int]$width, [int]$height) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Dark ceramic slate gradient
    $rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
    $cTop = [System.Drawing.ColorTranslator]::FromHtml("#090D17")
    $cBottom = [System.Drawing.ColorTranslator]::FromHtml("#141C44")
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $cTop, $cBottom, 90.0)
    $g.FillRectangle($brush, $rect)
    $brush.Dispose()

    # Subtle vitrified tile architectural cross-lines
    $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(12, 255, 255, 255), 1.0)
    $step = [int]([Math]::Min($width, $height) / 10)
    for ($x = 0; $x -lt $width; $x += $step) {
        $g.DrawLine($gridPen, $x, 0, $x, $height)
    }
    for ($y = 0; $y -lt $height; $y += $step) {
        $g.DrawLine($gridPen, 0, $y, $width, $y)
    }
    $gridPen.Dispose()

    # Radiant golden terracotta glow in center
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $glowW = [int]($width * 0.85)
    $glowH = [int]($height * 0.55)
    $path.AddEllipse([int](($width - $glowW)/2), [int](($height - $glowH)/2), $glowW, $glowH)
    $glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
    $glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(45, 200, 72, 38)
    $glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 9, 13, 23))
    $g.FillPath($glowBrush, $path)
    $glowBrush.Dispose()
    $path.Dispose()

    # Center official DuraGrit White Logo
    $targetW = [int]([Math]::Min($width * 0.75, 480))
    if ($targetW -lt 220) { $targetW = [int]($width * 0.85) }
    $targetH = [int](($logoWhite.Height / $logoWhite.Width) * $targetW)
    $targetX = [int](($width - $targetW) / 2)
    $targetY = [int](($height - $targetH) / 2 - ($height * 0.04))

    # Drop shadow
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 0, 0, 0))
    $g.FillEllipse($shadowBrush, $targetX - 10, $targetY + $targetH - 5, $targetW + 20, 24)
    $shadowBrush.Dispose()

    $g.DrawImage($logoWhite, $targetX, $targetY, $targetW, $targetH)

    # Subtitle badge: "OFFICIAL FIELD OPERATIONS & RETAIL NETWORK"
    $fontSize = [Math]::Max(10, [int]($width * 0.022))
    if ($fontSize -gt 15) { $fontSize = 15 }
    $fontSub = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $brushGold = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#FAA322"))
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString("OFFICIAL FIELD OPERATIONS & RETAIL NETWORK", $fontSub, $brushGold, ($width / 2), ($targetY + $targetH + 24), $format)

    $fontSub.Dispose()
    $brushGold.Dispose()
    $format.Dispose()

    $g.Dispose()
    return $bmp
}

Write-Output "--- Generating Web & PWA App Icons ---"
$targets = @(
    "$root\public",
    "$root\web\public",
    "$root\app\public"
)

$icon512 = New-IconImage 512 $false $false
$icon192 = New-IconImage 192 $false $false

foreach ($t in $targets) {
    if (-not (Test-Path $t)) { New-Item -ItemType Directory -Path $t -Force | Out-Null }
    $p512 = "$t\icon-512.png"
    $p192 = "$t\icon-192.png"
    $icon512.Save($p512, [System.Drawing.Imaging.ImageFormat]::Png)
    $icon192.Save($p192, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "Saved $p512 and $p192"
}

$icon512.Dispose()
$icon192.Dispose()

Write-Output "--- Generating Android Launcher Mipmaps ---"
$resDirs = @(
    "$root\app\android\app\src\main\res",
    "$root\android\app\src\main\res"
)

$densities = @(
    @{ Name="mdpi"; Launcher=48; Round=48; Fore=108 },
    @{ Name="hdpi"; Launcher=72; Round=72; Fore=162 },
    @{ Name="xhdpi"; Launcher=96; Round=96; Fore=216 },
    @{ Name="xxhdpi"; Launcher=144; Round=144; Fore=324 },
    @{ Name="xxxhdpi"; Launcher=192; Round=192; Fore=432 }
)

foreach ($res in $resDirs) {
    if (-not (Test-Path $res)) { continue }
    foreach ($d in $densities) {
        $folder = "$res\mipmap-$($d.Name)"
        if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Path $folder -Force | Out-Null }

        $launcherBmp = New-IconImage $d.Launcher $false $false
        $launcherBmp.Save("$folder\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $launcherBmp.Dispose()

        $roundBmp = New-IconImage $d.Round $true $false
        $roundBmp.Save("$folder\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $roundBmp.Dispose()

        $foreBmp = New-IconImage $d.Fore $false $true
        $foreBmp.Save("$folder\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $foreBmp.Dispose()

        Write-Output "Generated mipmap-$($d.Name) in $res"
    }
}

Write-Output "--- Generating Android Native Splash Drawables ---"
$splashSizes = @(
    @{ Folder="drawable"; W=480; H=320 },
    @{ Folder="drawable-land-mdpi"; W=480; H=320 },
    @{ Folder="drawable-land-hdpi"; W=800; H=480 },
    @{ Folder="drawable-land-xhdpi"; W=1280; H=720 },
    @{ Folder="drawable-land-xxhdpi"; W=1600; H=960 },
    @{ Folder="drawable-land-xxxhdpi"; W=1920; H=1280 },
    @{ Folder="drawable-port-mdpi"; W=320; H=480 },
    @{ Folder="drawable-port-hdpi"; W=480; H=800 },
    @{ Folder="drawable-port-xhdpi"; W=720; H=1280 },
    @{ Folder="drawable-port-xxhdpi"; W=960; H=1600 },
    @{ Folder="drawable-port-xxxhdpi"; W=1280; H=1920 }
)

foreach ($res in $resDirs) {
    if (-not (Test-Path $res)) { continue }
    foreach ($s in $splashSizes) {
        $folder = "$res\$($s.Folder)"
        if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Path $folder -Force | Out-Null }
        $splashBmp = New-SplashImage $s.W $s.H
        $splashPath = "$folder\splash.png"
        $splashBmp.Save($splashPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $splashBmp.Dispose()
        Write-Output "Generated splash: $splashPath ($($s.W)x$($s.H))"
    }
}

$emblem.Dispose()
$wordmark.Dispose()
$logoWhite.Dispose()
$logoColor.Dispose()

Write-Output "ALL BRAND ASSETS GENERATED SUCCESSFULLY!"

