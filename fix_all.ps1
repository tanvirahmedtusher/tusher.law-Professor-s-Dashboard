$appJsPath = 'app.js'
$indexHtmlPath = 'index.html'

$appContent = [System.IO.File]::ReadAllText($appJsPath, [System.Text.Encoding]::UTF8)
$indexContent = [System.IO.File]::ReadAllText($indexHtmlPath, [System.Text.Encoding]::UTF8)

# Replace common corrupted strings (using the exact corrupted strings)
$appContent = $appContent -replace 'âœ“', '✓'
$appContent = $appContent -replace 'âš ï¸', '⚠️'
$appContent = $appContent -replace 'ðŸ“¦', '📦'
$appContent = $appContent -replace 'ðŸ—‘ï¸ ', '🗑️'
$appContent = $appContent -replace 'âœ ï¸ ', '✏️'
$appContent = $appContent -replace 'ðŸ ›ï¸ ', '🏛️'
$appContent = $appContent -replace 'ðŸ“…', '📅'
$appContent = $appContent -replace 'ðŸ“ ', '📋'
$appContent = $appContent -replace 'âœ‰ï¸ ', '✉️'
$appContent = $appContent -replace 'ðŸ”’', '🔒'
$appContent = $appContent -replace 'âš¡', '⚡'
$appContent = $appContent -replace 'ðŸ” ', '🔑'
$appContent = $appContent -replace 'â†—', '↗️'
$appContent = $appContent -replace 'â€“', '–'
$appContent = $appContent -replace 'â€”', '—'
$appContent = $appContent -replace 'ðŸŒ ', '🌐'
$appContent = $appContent -replace 'ðŸŽ“', '🎓'
$appContent = $appContent -replace 'ðŸ‘‘', '👑'
$appContent = $appContent -replace 'âœ…', '✅'
$appContent = $appContent -replace 'âŒ', '❌'
$appContent = $appContent -replace 'â†’', '→'

$indexContent = $indexContent -replace 'âœ“', '✓'
$indexContent = $indexContent -replace 'âš ï¸', '⚠️'
$indexContent = $indexContent -replace 'ðŸ“¦', '📦'
$indexContent = $indexContent -replace 'ðŸ—‘ï¸ ', '🗑️'
$indexContent = $indexContent -replace 'âœ ï¸ ', '✏️'
$indexContent = $indexContent -replace 'ðŸ ›ï¸ ', '🏛️'
$indexContent = $indexContent -replace 'ðŸ“…', '📅'
$indexContent = $indexContent -replace 'ðŸ“ ', '📋'
$indexContent = $indexContent -replace 'âœ‰ï¸ ', '✉️'
$indexContent = $indexContent -replace 'ðŸ”’', '🔒'
$indexContent = $indexContent -replace 'âš¡', '⚡'
$indexContent = $indexContent -replace 'ðŸ” ', '🔑'
$indexContent = $indexContent -replace 'â†—', '↗️'
$indexContent = $indexContent -replace 'â€“', '–'
$indexContent = $indexContent -replace 'â€”', '—'
$indexContent = $indexContent -replace 'ðŸŒ ', '🌐'
$indexContent = $indexContent -replace 'ðŸŽ“', '🎓'
$indexContent = $indexContent -replace 'ðŸ‘‘', '👑'
$indexContent = $indexContent -replace 'âœ…', '✅'
$indexContent = $indexContent -replace 'âŒ', '❌'
$indexContent = $indexContent -replace 'â†’', '→'
$indexContent = $indexContent -replace 'Â£', '£'
$indexContent = $indexContent -replace 'Â€', '€'

[System.IO.File]::WriteAllText($appJsPath, $appContent, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($indexHtmlPath, $indexContent, [System.Text.Encoding]::UTF8)

Write-Host "Fixed file encodings."
