$bom = [byte[]](0xEF, 0xBB, 0xBF)
$script = @"
`$path = 'app.js'
`$text = [System.IO.File]::ReadAllText(`$path, [System.Text.Encoding]::UTF8)

function Fix-Mojibake(`$trueString) {
    global `$text
    `$utf8Bytes = [System.Text.Encoding]::UTF8.GetBytes(`$trueString)
    `$corruptedString = [System.Text.Encoding]::GetEncoding(1252).GetString(`$utf8Bytes)
    `$text = `$text.Replace(`$corruptedString, `$trueString)
}

`$emojis = @(
    "✓", "⚠️", "📦", "🗑️", "✏️", "🏛️", "📅", "📝", "📧", "🔒", "⚡", "🔑", "↗️", "–", "—", "🌐", "🎓", "👑", "✅", "❌", "→", "£", "€", "↗", "🔒", "📚"
)

foreach (`$e in `$emojis) {
    Fix-Mojibake -trueString `$e
}

[System.IO.File]::WriteAllText(`$path, `$text, [System.Text.Encoding]::UTF8)
Write-Host "Fixed Mojibake in `$path"
"@

$scriptBytes = [System.Text.Encoding]::UTF8.GetBytes($script)

$file = [System.IO.File]::OpenWrite("C:\Users\Farjana Sumi\Downloads\Projects-2\Applican&Scholarships\Professors_list\All lists\actual_fixer.ps1")
$file.Write($bom, 0, $bom.Length)
$file.Write($scriptBytes, 0, $scriptBytes.Length)
$file.Close()

Write-Host "Created actual_fixer.ps1 with BOM"
