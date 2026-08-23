$path = 'app.js'
$text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

function Fix-Mojibake($trueString) {
    $utf8Bytes = [System.Text.Encoding]::UTF8.GetBytes($trueString)
    $corruptedString = [System.Text.Encoding]::GetEncoding(1252).GetString($utf8Bytes)
    $script:text = $script:text.Replace($corruptedString, $trueString)
}

function U($code) { return [char]::ConvertFromUtf32($code) }

$emojis = @(
    (U 0x2713),                                 # ✓
    ((U 0x26A0) + (U 0xFE0F)),                  # ⚠️
    (U 0x1F4E6),                                # 📦
    ((U 0x1F5D1) + (U 0xFE0F)),                 # 🗑️
    ((U 0x270F) + (U 0xFE0F)),                  # ✏️
    ((U 0x1F3DB) + (U 0xFE0F)),                 # 🏛️
    (U 0x1F4C5),                                # 📅
    (U 0x1F4DD),                                # 📝
    (U 0x1F4E7),                                # 📧
    (U 0x1F512),                                # 🔒
    (U 0x26A1),                                 # ⚡
    (U 0x1F511),                                # 🔑
    ((U 0x2197) + (U 0xFE0F)),                  # ↗️
    (U 0x2197),                                 # ↗ (without variation selector)
    (U 0x2013),                                 # –
    (U 0x2014),                                 # —
    (U 0x1F310),                                # 🌐
    (U 0x1F393),                                # 🎓
    (U 0x1F451),                                # 👑
    (U 0x2705),                                 # ✅
    (U 0x274C),                                 # ❌
    (U 0x2192),                                 # →
    (U 0x00A3),                                 # £
    (U 0x20AC),                                 # €
    (U 0x1F4D1),                                # 📑
    (U 0x1F4D3),                                # 📓
    (U 0x1F4DA)                                 # 📚
)

foreach ($e in $emojis) {
    Fix-Mojibake -trueString $e
}

[System.IO.File]::WriteAllText($path, $text, [System.Text.Encoding]::UTF8)
Write-Host "Fixed Mojibake in $path"

# Now do the same for index.html (some parts of it were appended and corrupted)
$idxPath = 'index.html'
$idxText = [System.IO.File]::ReadAllText($idxPath, [System.Text.Encoding]::UTF8)
function Fix-Mojibake-Idx($trueString) {
    $utf8Bytes = [System.Text.Encoding]::UTF8.GetBytes($trueString)
    $corruptedString = [System.Text.Encoding]::GetEncoding(1252).GetString($utf8Bytes)
    $script:idxText = $script:idxText.Replace($corruptedString, $trueString)
}
foreach ($e in $emojis) {
    Fix-Mojibake-Idx -trueString $e
}
[System.IO.File]::WriteAllText($idxPath, $idxText, [System.Text.Encoding]::UTF8)
Write-Host "Fixed Mojibake in $idxPath"
