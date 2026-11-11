Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\ADMIN\.gemini\antigravity\brain\0098997f-a210-4ac3-ba76-c919e7f81b44\.user_uploaded\media_1794403417676_901d438a.jpg"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

$cropX = 11
$cropY = 11
$cropW = 350
$cropH = 346

$dst = New-Object System.Drawing.Bitmap $cropW, $cropH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($dst)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# Inset 2px and radius ~70
$inset = 2.0
$radius = 70.0
$rect = New-Object System.Drawing.RectangleF $inset, $inset, ($cropW - 2 * $inset), ($cropH - 2 * $inset)

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc($rect.X, $rect.Y, $radius, $radius, 180, 90)
$path.AddArc($rect.Right - $radius, $rect.Y, $radius, $radius, 270, 90)
$path.AddArc($rect.Right - $radius, $rect.Bottom - $radius, $radius, $radius, 0, 90)
$path.AddArc($rect.X, $rect.Bottom - $radius, $radius, $radius, 90, 90)
$path.CloseFigure()

$g.SetClip($path)
$srcRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropW, $cropH
$dstRect = New-Object System.Drawing.Rectangle 0, 0, $cropW, $cropH
$g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$destinations = @(
    "e:\AI Projects\Duragrit Vitrified\public\site-assets\admin-mobile-signin-logo.png",
    "e:\AI Projects\Duragrit Vitrified\web\public\site-assets\admin-mobile-signin-logo.png",
    "e:\AI Projects\Duragrit Vitrified\app\public\site-assets\admin-mobile-signin-logo.png"
)

foreach ($d in $destinations) {
    $dir = Split-Path $d
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
    $dst.Save($d, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Saved: $d"
}

$g.Dispose()
$dst.Dispose()
$src.Dispose()

