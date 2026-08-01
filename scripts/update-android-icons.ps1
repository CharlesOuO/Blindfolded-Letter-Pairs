param(
    [string]$SourceImage = '',
    [ValidateRange(1, 100)]
    [int]$AdaptiveForegroundPercent = 66,
    [ValidateRange(1, 100)]
    [int]$LegacyIconPercent = 88
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
        [string]$OutputPath,
        [int]$ContentPercent = 100
    )

    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)

    # Fit the full source image inside the icon canvas with optional padding.
    # This avoids clipping details (like cube edges) when launcher masks are applied.
    $contentSize = [Math]::Max(1, [int][Math]::Round($Size * ($ContentPercent / 100.0)))
    $sourceRatio = [double]$InputImage.Width / [double]$InputImage.Height

    if ($sourceRatio -ge 1.0) {
        $drawWidth = $contentSize
        $drawHeight = [Math]::Max(1, [int][Math]::Round($contentSize / $sourceRatio))
    }
    else {
        $drawHeight = $contentSize
        $drawWidth = [Math]::Max(1, [int][Math]::Round($contentSize * $sourceRatio))
    }

    $dstX = [int][Math]::Floor(($Size - $drawWidth) / 2)
    $dstY = [int][Math]::Floor(($Size - $drawHeight) / 2)
    $dstRect = New-Object System.Drawing.Rectangle($dstX, $dstY, $drawWidth, $drawHeight)
    $graphics.DrawImage($InputImage, $dstRect)

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

        Save-ResizedPng -InputImage $source -Size $spec.Launcher -OutputPath (Join-Path $dir 'ic_launcher.png') -ContentPercent $LegacyIconPercent
        Save-ResizedPng -InputImage $source -Size $spec.Launcher -OutputPath (Join-Path $dir 'ic_launcher_round.png') -ContentPercent $LegacyIconPercent
        Save-ResizedPng -InputImage $source -Size $spec.Foreground -OutputPath (Join-Path $dir 'ic_launcher_foreground.png') -ContentPercent $AdaptiveForegroundPercent
        Save-ResizedPng -InputImage $source -Size $spec.Foreground -OutputPath (Join-Path $dir 'ic_launcher_monochrome.png') -ContentPercent $AdaptiveForegroundPercent
    }
}
finally {
    $source.Dispose()
}

Write-Output "Updated Android launcher icons from $sourcePath (adaptive=$AdaptiveForegroundPercent%, legacy=$LegacyIconPercent%)"
