# Create placeholder PNG icons for SiteReader extension
# This script creates simple gradient icons with "SR" text

# Check if ImageMagick or ffmpeg is available
$magickPath = (Get-Command convert -ErrorAction SilentlyContinue)?.Source
$ffmpegPath = (Get-Command ffmpeg -ErrorAction SilentlyContinue)?.Source

if ($magickPath) {
    Write-Host "Using ImageMagick to create icons..."
    
    # Create 128x128 icon
    & convert -size 128x128 xc:none `
        -fill "url(gradient:purple-to-blue)" `
        -draw "roundrectangle 0,0 128,128 20,20" `
        -gravity center -fill white -pointsize 60 -font Arial-Bold -annotate +0+0 "SR" `
        -gravity south -fill white -pointsize 20 -annotate +0+10 "▶" `
        "icon-128.png"
    
    # Create 48x48 icon
    & convert icon-128.png -resize 48x48 icon-48.png
    
    # Create 16x16 icon
    & convert icon-128.png -resize 16x16 icon-16.png
    
    Write-Host "Icons created successfully!"
} elseif ($ffmpegPath) {
    Write-Host "ImageMagick not found. Install it to create icons:"
    Write-Host "  choco install imagemagick"
    Write-Host "  or download from: https://imagemagick.org/script/download.php"
} else {
    Write-Host "Neither ImageMagick nor ffmpeg found."
    Write-Host "Please install ImageMagick: https://imagemagick.org/script/download.php"
    Write-Host "Or create the following PNG files manually:"
    Write-Host "  - icons/icon-16.png (16x16)"
    Write-Host "  - icons/icon-48.png (48x48)"
    Write-Host "  - icons/icon-128.png (128x128)"
}
