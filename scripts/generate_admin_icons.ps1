Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\.."

function New-AdminIconImage([int]$size, [bool]$isRound = $false, [bool]$isForeground = $false) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    if (-not $isForeground) {
        $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
        # Deep Obsidian & Midnight Navy Titanium Gradient
        $cTop = [System.Drawing.ColorTranslator]::FromHtml("#050812")
        $cBottom = [System.Drawing.ColorTranslator]::FromHtml("#0B132B")
        $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $cTop, $cBottom, 45.0)

        if ($isRound) {
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $path.AddEllipse(2, 2, $size - 4, $size - 4)
            $g.FillPath($brush, $path)

            # Vitrified architectural cross lines
            $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(18, 255, 255, 255), 1.0)
            $step = [int]($size / 8)
            for ($i = $step; $i -lt $size; $i += $step) {
                $g.DrawLine($gridPen, $i, 0, $i, $size)
                $g.DrawLine($gridPen, 0, $i, $size, $i)
            }
            $gridPen.Dispose()

            # Center royal blue / gold aura
            $glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
            $glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(60, 245, 158, 11)
            $glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 5, 8, 18))
            $g.FillPath($glowBrush, $path)
            $glowBrush.Dispose()

            # Double Gold Rim
            $goldPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#F59E0B"), [float][Math]::Max(2.5, $size * 0.03))
            $g.DrawPath($goldPen, $path)
            $goldPen.Dispose()

            $innerPath = New-Object System.Drawing.Drawing2D.GraphicsPath
            $offset = [Math]::Max(3, [int]($size * 0.04))
            $innerPath.AddEllipse($offset, $offset, $size - ($offset * 2), $size - ($offset * 2))
            $innerGoldPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#FEF08A"), 1.0)
            $g.DrawPath($innerGoldPen, $innerPath)
            $innerGoldPen.Dispose()
            $innerPath.Dispose()

            $path.Dispose()
        } else {
            # Squircle with 22% radius
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
            $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(18, 255, 255, 255), 1.0)
            $step = [int]($size / 8)
            for ($i = $step; $i -lt $size; $i += $step) {
                $g.DrawLine($gridPen, $i, 0, $i, $size)
                $g.DrawLine($gridPen, 0, $i, $size, $i)
            }
            $gridPen.Dispose()

            # Center royal gold aura
            $glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
            $glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(60, 245, 158, 11)
            $glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 5, 8, 18))
            $g.FillPath($glowBrush, $path)
            $glowBrush.Dispose()

            # Outer Gold Rim
            $goldPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#F59E0B"), [float][Math]::Max(2.5, $size * 0.028))
            $g.DrawPath($goldPen, $path)
            $goldPen.Dispose()
            $path.Dispose()
        }
        $brush.Dispose()
    }

    # Center Admin Shield
    $cx = $size / 2.0
    $cy = if ($isForeground) { $size / 2.0 - ($size * 0.02) } else { $size * 0.44 }
    $shieldR = if ($isForeground) { $size * 0.28 } else { $size * 0.26 }

    # Hexagonal points for shield
    $pts = @()
    for ($i = 0; $i -lt 6; $i++) {
        $angle = (60 * $i - 30) * [Math]::PI / 180.0
        $px = $cx + $shieldR * [Math]::Cos($angle)
        $py = $cy + $shieldR * [Math]::Sin($angle)
        $pts += New-Object System.Drawing.PointF($px, $py)
    }
    $shieldPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $shieldPath.AddPolygon($pts)

    # Fill Shield with Metallic Dark Navy
    $shieldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#0F1E3D"))
    $g.FillPath($shieldBrush, $shieldPath)
    $shieldBrush.Dispose()

    # Outer Shield Gold Border
    $shieldPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#FBBF24"), [float][Math]::Max(2.0, $size * 0.022))
    $g.DrawPath($shieldPen, $shieldPath)
    $shieldPen.Dispose()

    # Inner Shield Inset Line
    $innerPts = @()
    for ($i = 0; $i -lt 6; $i++) {
        $angle = (60 * $i - 30) * [Math]::PI / 180.0
        $px = $cx + ($shieldR * 0.85) * [Math]::Cos($angle)
        $py = $cy + ($shieldR * 0.85) * [Math]::Sin($angle)
        $innerPts += New-Object System.Drawing.PointF($px, $py)
    }
    $innerShieldPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $innerShieldPath.AddPolygon($innerPts)
    $innerShieldPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#D97706"), [float][Math]::Max(1.0, $size * 0.008))
    $g.DrawPath($innerShieldPen, $innerShieldPath)
    $innerShieldPen.Dispose()
    $innerShieldPath.Dispose()

    # Top Crown / Tri-Star Accent
    if ($size -ge 72) {
        $starBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#FEF08A"))
        $g.FillEllipse($starBrush, [float]($cx - ($size * 0.015)), [float]($cy - ($shieldR * 0.72)), [float]($size * 0.03), [float]($size * 0.03))
        $g.FillEllipse($starBrush, [float]($cx - ($shieldR * 0.45)), [float]($cy - ($shieldR * 0.58)), [float]($size * 0.022), [float]($size * 0.022))
        $g.FillEllipse($starBrush, [float]($cx + ($shieldR * 0.35)), [float]($cy - ($shieldR * 0.58)), [float]($size * 0.022), [float]($size * 0.022))
        $starBrush.Dispose()
    }

    # Inner D & G Monolith Monogram
    $monolithBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#F59E0B"))
    $monoFont = New-Object System.Drawing.Font("Arial Black", [float]($shieldR * 0.60), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = [System.Drawing.StringAlignment]::Center
    $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString("DG", $monoFont, $monolithBrush, $cx, $cy - ($shieldR * 0.03), $fmt)
    $monolithBrush.Dispose()
    $monoFont.Dispose()

    # Draw ADMIN Pill Badge at bottom of Shield
    $badgeW = [int]($size * 0.62)
    $badgeH = [int]($size * 0.175)
    $badgeX = [int](($size - $badgeW) / 2)
    $badgeY = [int]($cy + $shieldR + ($size * 0.025))

    if ($badgeY + $badgeH -gt $size * 0.94) {
        $badgeY = [int]($size * 0.76)
        $badgeH = [int]($size * 0.16)
    }

    # Rounded Badge Rect
    $br = [int]($badgeH * 0.45)
    $bd = $br * 2
    $badgePath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $badgePath.AddArc($badgeX, $badgeY, $bd, $bd, 180, 90)
    $badgePath.AddArc($badgeX + $badgeW - $bd, $badgeY, $bd, $bd, 270, 90)
    $badgePath.AddArc($badgeX + $badgeW - $bd, $badgeY + $badgeH - $bd, $bd, $bd, 0, 90)
    $badgePath.AddArc($badgeX, $badgeY + $badgeH - $bd, $bd, $bd, 90, 90)
    $badgePath.CloseFigure()

    $badgeFill = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.Rectangle($badgeX, $badgeY, $badgeW, $badgeH)),
        [System.Drawing.ColorTranslator]::FromHtml("#D97706"),
        [System.Drawing.ColorTranslator]::FromHtml("#F59E0B"),
        90.0
    )
    $g.FillPath($badgeFill, $badgePath)
    $badgeFill.Dispose()

    $badgeBorder = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#FEF08A"), [float][Math]::Max(1.5, $size * 0.016))
    $g.DrawPath($badgeBorder, $badgePath)
    $badgeBorder.Dispose()

    # ADMIN Text in Badge
    $adminFont = New-Object System.Drawing.Font("Arial Black", [float]($badgeH * 0.60), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#050812"))
    $g.DrawString("ADMIN", $adminFont, $textBrush, $cx, ($badgeY + ($badgeH / 2.0) + 1), $fmt)
    $textBrush.Dispose()
    $adminFont.Dispose()
    $badgePath.Dispose()
    $shieldPath.Dispose()
    $fmt.Dispose()

    $g.Dispose()
    return $bmp
}

Write-Host "--- Generating Android Admin Launcher Mipmaps ---"
$resDirs = @(
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

        $launcherBmp = New-AdminIconImage $d.Launcher $false $false
        $launcherBmp.Save("$folder\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $launcherBmp.Dispose()

        $roundBmp = New-AdminIconImage $d.Round $true $false
        $roundBmp.Save("$folder\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $roundBmp.Dispose()

        $foreBmp = New-AdminIconImage $d.Fore $false $true
        $foreBmp.Save("$folder\ic_launcher_foreground.png", [System.Drawing.Imaging.ImageFormat]::Png)
        $foreBmp.Dispose()

        Write-Host "Generated Admin mipmap-$($d.Name) in $res"
    }
}

Write-Host "--- Generating Web / PWA Admin Icons ---"
$webTargets = @(
    "$root\public",
    "$root\web\public",
    "$root\app\public"
)

$admin512 = New-AdminIconImage 512 $false $false
$admin192 = New-AdminIconImage 192 $false $false

foreach ($t in $webTargets) {
    if (-not (Test-Path $t)) { New-Item -ItemType Directory -Path $t -Force | Out-Null }
    $p512 = "$t\icon-admin-512.png"
    $p192 = "$t\icon-admin-192.png"
    $admin512.Save($p512, [System.Drawing.Imaging.ImageFormat]::Png)
    $admin192.Save($p192, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Saved $p512 and $p192"
}

$admin512.Dispose()
$admin192.Dispose()

Write-Host "Admin Icons Generated Successfully!"

