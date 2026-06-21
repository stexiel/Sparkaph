# Replace all hardcoded URLs with config imports
$files = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts -Exclude config.ts

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if file already imports config
    if ($content -notmatch "from ['""]\.\.?/config['""]") {
        # Determine correct path based on file location
        $relativePath = if ($file.DirectoryName -match "\\src\\pages|\\src\\components") { "../config" } else { "./config" }
        # Add import after other imports
        $content = $content -replace "(import.*?from.*?;[\r\n]+)([\r\n]+)(interface|const|export|function)", "`$1import { API_URL, APPS_URL, WS_URL } from '$relativePath';`$2`$3"
    }
    
    # Fix wrong paths
    $content = $content -replace "from ['""]\.\.\/config['""]", "from '../config'"
    $content = $content -replace "from ['""]\.\/config['""]", "from './config'"
    
    # Replace URLs
    $content = $content -replace '"http://localhost:3000"', 'API_URL'
    $content = $content -replace "'http://localhost:3000'", 'API_URL'
    $content = $content -replace '`http://localhost:3000', '`${API_URL}'
    $content = $content -replace '"http://localhost:5176"', 'APPS_URL'
    $content = $content -replace "'http://localhost:5176'", 'APPS_URL'
    $content = $content -replace '`http://localhost:5176', '`${APPS_URL}'
    
    Set-Content $file.FullName -Value $content -NoNewline
    Write-Host "Updated: $($file.Name)"
}

Write-Host "Done!"
