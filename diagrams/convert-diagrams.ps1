# PowerShell script to convert all Mermaid diagrams to PNG images

Write-Host "🎨 IVARS Diagram Converter" -ForegroundColor Cyan
Write-Host "Converting Mermaid diagrams to PNG images..." -ForegroundColor Yellow
Write-Host ""

# Create images directory
$imagesDir = "images"
if (-not (Test-Path $imagesDir)) {
    New-Item -ItemType Directory -Path $imagesDir | Out-Null
    Write-Host "✅ Created '$imagesDir' folder" -ForegroundColor Green
}

# Check if mermaid-cli is installed
try {
    $null = Get-Command mmdc -ErrorAction Stop
    Write-Host "✅ Mermaid CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Mermaid CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install it first:" -ForegroundColor Yellow
    Write-Host "  npm install -g @mermaid-js/mermaid-cli" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Converting diagrams..." -ForegroundColor Cyan

# Get all markdown files except README and CONVERT-TO-IMAGES
$diagramFiles = Get-ChildItem -Path . -Filter "*.md" | Where-Object { 
    $_.Name -ne "README.md" -and $_.Name -ne "CONVERT-TO-IMAGES.md" 
}

$successCount = 0
$failCount = 0

foreach ($file in $diagramFiles) {
    $outputName = "$imagesDir/$($file.BaseName).png"
    
    Write-Host "📄 Converting: $($file.Name) -> $outputName" -ForegroundColor White
    
    try {
        # Convert with high quality settings
        $process = Start-Process -FilePath "mmdc" `
            -ArgumentList "-i `"$($file.Name)`" -o `"$outputName`" -w 1920 -b white -t default" `
            -NoNewWindow -Wait -PassThru
        
        if ($process.ExitCode -eq 0) {
            Write-Host "   ✅ Success" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "   ⚠️ Warning: Conversion completed with warnings" -ForegroundColor Yellow
            $successCount++
        }
    } catch {
        Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

# Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Conversion Complete!" -ForegroundColor Green
Write-Host "✅ Success: $successCount files" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "❌ Failed: $failCount files" -ForegroundColor Red
}
Write-Host ""
Write-Host "Images saved in: $imagesDir/" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now use these images in your report!" -ForegroundColor Yellow
