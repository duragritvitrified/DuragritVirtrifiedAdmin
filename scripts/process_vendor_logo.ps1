Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\ADMIN\.gemini\antigravity\brain\0098997f-a210-4ac3-ba76-c919e7f81b44\.user_uploaded\media_1794386311829_80612bba.jpg"
$srcImg = [System.Drawing.Bitmap]::FromFile($srcPath)

$w = $srcImg.Width
$h = $srcImg.Height
Write-Host "Original Dimensions: $w x $h"

# Create 32bpp ARGB bitmap with transparent background
$outBmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($outBmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# Inset slightly (2.5px) to remove the outer dark/black edge artifacts from the screenshot
$inset = 3.0
$radius = 76.0
$rect = New-Object System.Drawing.RectangleF $inset, $inset, ($w - 2 * $inset), ($h - 2 * $inset)

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc($rect.X, $rect.Y, $radius, $radius, 180, 90)
$path.AddArc($rect.Right - $radius, $rect.Y, $radius, $radius, 270, 90)
$path.AddArc($rect.Right - $radius, $rect.Bottom - $radius, $radius, $radius, 0, 90)
$path.AddArc($rect.X, $rect.Bottom - $radius, $radius, $radius, 90, 90)
$path.CloseFigure()

$g.SetClip($path)
$g.DrawImage($srcImg, 0, 0, $w, $h)

# Targets
$dest1 = "e:\AI Projects\Duragrit Vitrified\public\site-assets\vendor-signin-logo.png"
$dest2 = "e:\AI Projects\Duragrit Vitrified\web\public\site-assets\vendor-signin-logo.png"
$dest3 = "e:\AI Projects\Duragrit Vitrified\app\public\site-assets\vendor-signin-logo.png"

$dirs = @((Split-Path $dest1), (Split-Path $dest2), (Split-Path $dest3))
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Force $d | Out-Null
    }
}

$outBmp.Save($dest1, [System.Drawing.Imaging.ImageFormat]::Png)
$outBmp.Save($dest2, [System.Drawing.Imaging.ImageFormat]::Png)
$outBmp.Save($dest3, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$outBmp.Dispose()
$srcImg.Dispose()

Write-Host "Processed and saved vendor-signin-logo.png successfully!"

