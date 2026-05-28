param(
    [string]$SourceImage = ''
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$sourcePath = $null

if ($SourceImage) {
    $candidate = Join-Path $projectRoot $SourceImage
    if (Test-Path $candidate) {
        $sourcePath = $candidate
    }
}

if (-not $sourcePath) {
    $preferredCandidates = @(
        (Join-Path $projectRoot 'tmp_apk_icons\ic_launcher.png'),
        (Join-Path $projectRoot 'icon.png')
    )

    foreach ($candidate in $preferredCandidates) {
        if (Test-Path $candidate) {
            $sourcePath = $candidate
            break
        }
    }
}

if (-not $sourcePath) {
    throw "Icon source not found. Checked SourceImage='$SourceImage', tmp_apk_icons\\ic_launcher.png, and icon.png"
}

$sourcePath = Resolve-Path $sourcePath
$resRoot = Join-Path $projectRoot 'android\app\src\main\res'

if (-not (Test-Path $sourcePath)) {
    throw "Icon source not found: $sourcePath"
}

$specs = @(
    @{ Density = 'mdpi'; Launcher = 48; Foreground = 108 },
    @{ Density = 'hdpi'; Launcher = 72; Foreground = 162 },
    @{ Density = 'xhdpi'; Launcher = 96; Foreground = 216 },
    @{ Density = 'xxhdpi'; Launcher = 144; Foreground = 324 },
    @{ Density = 'xxxhdpi'; Launcher = 192; Foreground = 432 }
)

$source = [System.Drawing.Image]::FromFile($sourcePath)

function Save-ResizedPng {
    param(
        [System.Drawing.Image]$InputImage,
        [int]$Size,
        [string]$OutputPath
    )

    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)

    # Keep aspect ratio by center-cropping to a square before resizing.
    $cropSize = [Math]::Min($InputImage.Width, $InputImage.Height)
    $srcX = [int][Math]::Floor(($InputImage.Width - $cropSize) / 2)
    $srcY = [int][Math]::Floor(($InputImage.Height - $cropSize) / 2)
    $srcRect = New-Object System.Drawing.Rectangle($srcX, $srcY, $cropSize, $cropSize)
    $dstRect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
    $graphics.DrawImage($InputImage, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $graphics.Dispose()
    $bitmap.Dispose()
}

try {
    foreach ($spec in $specs) {
        $dir = Join-Path $resRoot ("mipmap-" + $spec.Density)
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir | Out-Null
        }

        Save-ResizedPng -InputImage $source -Size $spec.Launcher -OutputPath (Join-Path $dir 'ic_launcher.png')
        Save-ResizedPng -InputImage $source -Size $spec.Launcher -OutputPath (Join-Path $dir 'ic_launcher_round.png')
        Save-ResizedPng -InputImage $source -Size $spec.Foreground -OutputPath (Join-Path $dir 'ic_launcher_foreground.png')
        Save-ResizedPng -InputImage $source -Size $spec.Foreground -OutputPath (Join-Path $dir 'ic_launcher_monochrome.png')
    }
}
finally {
    $source.Dispose()
}

Write-Output "Updated Android launcher icons from $sourcePath"
