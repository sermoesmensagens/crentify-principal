$ErrorActionPreference = "Stop"

$basePath = $PSScriptRoot | Split-Path -Parent

$files = Get-ChildItem -Path (Join-Path $basePath "components") -Filter "*.tsx" -File

foreach ($file in $files) {
    # Skip files we'll handle manually or already have gradient
    if ($file.Name -in @("Sidebar.tsx","Auth.tsx","Layout.tsx","Dashboard.tsx")) {
        Write-Host "SKIP (manual): $($file.Name)"
        continue
    }
    
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $original = $content
    
    # ====== PRIMARY ACTION BUTTONS → accent-gradient ======
    # These are the big "SALVAR", "CRIAR", "ENVIAR" type buttons that should POP
    
    # Pattern: bg-brand text-white ... py-5+ ... (big buttons = CTAs)
    # Convert: bg-brand text-white font-extrabold py-5 rounded-2xl → accent-gradient text-white font-extrabold py-5 rounded-2xl accent-gradient-hover
    $content = $content -replace 'bg-brand text-white font-extrabold py-5 rounded-2xl uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-\[1\.01\]', 'accent-gradient text-white font-extrabold py-5 rounded-2xl uppercase tracking-widest shadow-lg shadow-brand-accent/20 hover:scale-[1.01] accent-gradient-hover'
    
    # bg-brand text-white font-extrabold py-6 rounded-2xl (big CTA)
    $content = $content -replace 'bg-brand text-white font-extrabold py-6 rounded-2xl', 'accent-gradient text-white font-extrabold py-6 rounded-2xl accent-gradient-hover'
    
    # bg-brand text-white py-6 rounded-2xl font-extrabold (CREATE buttons)
    $content = $content -replace 'bg-brand text-white py-6 rounded-2xl font-extrabold', 'accent-gradient text-white py-6 rounded-2xl font-extrabold accent-gradient-hover'
    
    # bg-brand text-white font-extrabold py-4 px-10 (medium action buttons)
    $content = $content -replace 'bg-brand text-white font-extrabold py-4 px-10', 'accent-gradient text-white font-extrabold py-4 px-10 accent-gradient-hover'
    
    # px-10 py-6 bg-brand text-white rounded-2xl (prayer CTA)
    $content = $content -replace 'px-10 py-6 bg-brand text-white rounded-2xl font-extrabold', 'px-10 py-6 accent-gradient text-white rounded-2xl font-extrabold accent-gradient-hover'
    
    # px-12 py-5 bg-brand text-white (large CTA buttons)
    $content = $content -replace 'px-12 py-5 bg-brand text-white', 'px-12 py-5 accent-gradient text-white accent-gradient-hover'
    
    # bg-brand text-white px-12 py-5 (diary save buttons)
    $content = $content -replace 'bg-brand text-white px-12 py-5 rounded-2xl', 'accent-gradient text-white px-12 py-5 rounded-2xl accent-gradient-hover'
    
    # bg-brand text-white px-10 py-5 (main CTA buttons)
    $content = $content -replace 'bg-brand text-white px-10 py-5 rounded-2xl', 'accent-gradient text-white px-10 py-5 rounded-2xl accent-gradient-hover'
    
    # bg-brand text-white px-10 py-4 (action buttons)
    $content = $content -replace 'bg-brand text-white px-10 py-4', 'accent-gradient text-white px-10 py-4 accent-gradient-hover'
    
    # flex-1 bg-brand text-white font-extrabold py-6 (cultos save)
    $content = $content -replace 'flex-1 bg-brand text-white font-extrabold py-6', 'flex-1 accent-gradient text-white font-extrabold py-6 accent-gradient-hover'
    
    # w-full bg-brand text-white py-6 (reading plans big button)
    $content = $content -replace 'w-full bg-brand text-white py-6', 'w-full accent-gradient text-white py-6 accent-gradient-hover'
    
    # bg-brand text-white w-16 h-16 (MentorAI send button)
    $content = $content -replace 'bg-brand text-white w-16 h-16 rounded-2xl', 'accent-gradient text-white w-16 h-16 rounded-2xl accent-gradient-hover'
    
    # bg-brand hover:scale-105 (add study button)
    $content = $content -replace 'bg-brand hover:scale-105 active:scale-95 text-white font-extrabold px-8 py-4', 'accent-gradient hover:scale-105 active:scale-95 text-white font-extrabold px-8 py-4 accent-gradient-hover'
    
    # ====== PROGRESS BARS → warm gradient ======
    # h-full bg-brand transition-all (progress bars should be warm)
    $content = $content -replace '"h-full bg-brand transition-all', '"h-full accent-gradient transition-all'
    
    # ====== shadow-brand references for CTAs → shadow-brand-accent ======
    $content = $content -replace 'shadow-brand/30 hover:scale-105', 'shadow-brand-accent/30 hover:scale-105'
    $content = $content -replace 'shadow-brand/30 hover:scale-\[1\.02\]', 'shadow-brand-accent/30 hover:scale-[1.02]'
    $content = $content -replace 'shadow-brand/20 hover:scale-105', 'shadow-brand-accent/20 hover:scale-105'
    $content = $content -replace 'shadow-brand/20 hover:scale-\[1\.01\]', 'shadow-brand-accent/20 hover:scale-[1.01]'
    
    # ====== LIDO button (BibleView) → accent gradient ======
    # bg-brand text-white shadow-lg shadow-brand/30 hover:scale-105
    $content = $content -replace "'bg-brand text-white shadow-lg shadow-brand/30 hover:scale-105'", "'accent-gradient text-white shadow-lg shadow-brand-accent/30 hover:scale-105 accent-gradient-hover'"
    
    # ====== Timer play button ======
    $content = $content -replace 'w-20 h-20 rounded-2xl bg-brand text-white', 'w-20 h-20 rounded-2xl accent-gradient text-white accent-gradient-hover'
    
    # ====== Reading time display (brand accent) ======
    $content = $content -replace 'px-6 py-2 bg-brand text-white rounded-2xl flex flex-col', 'px-6 py-2 accent-gradient text-white rounded-2xl flex flex-col'

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content, (New-Object System.Text.UTF8Encoding $false))
        Write-Host "UPDATED: $($file.Name)"
    } else {
        Write-Host "NO CHANGES: $($file.Name)"
    }
}

Write-Host "`nAll done!"
