# Create placeholder PNG icons for Chrome extension
# This creates minimal valid PNG files so the extension loads

$pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
[byte[]]$pngBytes = [Convert]::FromBase64String($pngBase64)

# Save to icon files
$iconDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $iconDir

$pngBytes | Set-Content -Path 'icon-16.png' -AsByteStream
$pngBytes | Set-Content -Path 'icon-48.png' -AsByteStream
$pngBytes | Set-Content -Path 'icon-128.png' -AsByteStream

Write-Host "✓ Placeholder PNG icons created in $iconDir"
Write-Host "  - icon-16.png (16x16)"
Write-Host "  - icon-48.png (48x48)"
Write-Host "  - icon-128.png (128x128)"
Write-Host ""
Write-Host "Extension should now load in Chrome!"
Write-Host "Later, replace these with proper icons using:"
Write-Host "  - Figma (free design tool)"
Write-Host "  - Photoshop or GIMP"
Write-Host "  - Online icon generators like icon-converter.com"
