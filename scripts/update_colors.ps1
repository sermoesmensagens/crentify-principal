$ErrorActionPreference = "Stop"

$basePath = $PSScriptRoot | Split-Path -Parent

$files = Get-ChildItem -Path (Join-Path $basePath "components") -Filter "*.tsx" -File

foreach ($file in $files) {
    # Skip files we already manually rewrote
    if ($file.Name -in @("Sidebar.tsx","Dashboard.tsx","Auth.tsx","Layout.tsx")) {
        Write-Host "SKIP (already done): $($file.Name)"
        continue
    }
    
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $original = $content
    
    # Background colors
    $content = $content -replace 'bg-\[#0b0e14\]', 'bg-brand-bg'
    $content = $content -replace 'bg-\[#161b22\]', 'bg-brand-card'
    
    # Border colors  
    $content = $content -replace 'border-\[#161b22\]', 'border-brand-card'
    $content = $content -replace 'border-\[6px\] border-brand-card', 'border-[6px] border-brand-card'
    
    # Gradient from references
    $content = $content -replace 'from-\[#0b0e14\]', 'from-brand-bg'
    $content = $content -replace 'from-\[#161b22\]', 'from-brand-card'
    $content = $content -replace 'to-\[#161b22\]', 'to-brand-card'
    $content = $content -replace 'to-\[#0b0e14\]', 'to-brand-bg'
    
    # Text colors
    $content = $content -replace 'text-gray-500', 'text-c-text-secondary'
    $content = $content -replace 'text-gray-700', 'text-c-text-muted'
    $content = $content -replace 'text-gray-400', 'text-c-text-secondary'
    $content = $content -replace 'text-gray-600', 'text-c-text-muted'
    $content = $content -replace 'placeholder-gray-500', 'placeholder-c-text-muted'
    $content = $content -replace 'placeholder:text-gray-700', 'placeholder:text-c-text-muted'
    $content = $content -replace 'placeholder:text-gray-500', 'placeholder:text-c-text-muted'
    
    # Hardcoded brand purple references
    $content = $content -replace '#8743f2', '#6C3BFF'
    
    # font-black to font-extrabold (Sora is heavier than Inter)
    $content = $content -replace 'font-black', 'font-extrabold'
    
    # Update rounded values for more professional look
    $content = $content -replace 'rounded-\[56px\]', 'rounded-3xl'
    $content = $content -replace 'rounded-\[40px\]', 'rounded-3xl'
    $content = $content -replace 'rounded-\[32px\]', 'rounded-2xl'
    $content = $content -replace 'rounded-\[28px\]', 'rounded-2xl'
    $content = $content -replace 'rounded-\[24px\]', 'rounded-2xl'
    $content = $content -replace 'rounded-\[22px\]', 'rounded-2xl'
    $content = $content -replace 'rounded-\[20px\]', 'rounded-xl'
    $content = $content -replace 'rounded-\[18px\]', 'rounded-xl'
    
    # orange-500 -> brand-accent
    $content = $content -replace 'text-orange-500', 'text-brand-accent'
    $content = $content -replace 'bg-orange-500', 'bg-brand-accent'
    $content = $content -replace 'border-orange-500', 'border-brand-accent'
    $content = $content -replace 'shadow-orange-500', 'shadow-brand-accent'
    
    # Scrollbar custom hardcoded color
    $content = $content -replace 'rgba\(135, 67, 242,', 'rgba(108, 59, 255,'
    $content = $content -replace 'rgba\(135,67,242,', 'rgba(108,59,255,'
    
    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content, (New-Object System.Text.UTF8Encoding $false))
        Write-Host "UPDATED: $($file.Name)"
    } else {
        Write-Host "NO CHANGES: $($file.Name)"
    }
}

Write-Host "`nAll done!"
