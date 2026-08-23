$path = "app.js"
$text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# Because the file was corrupted by reading UTF-8 as ANSI (Windows-1252) and saving as UTF-8,
# the string in memory right now contains characters like 'â' (U+00E2).
# If we convert this corrupted string into bytes using Windows-1252, we get back the original UTF-8 bytes!
$windows1252 = [System.Text.Encoding]::GetEncoding(1252)
$utf8 = [System.Text.Encoding]::UTF8

# Try to decode the whole file
try {
    $bytes = $windows1252.GetBytes($text)
    $restoredText = $utf8.GetString($bytes)
    
    # Check if a known emoji is restored
    if ($restoredText -match '✏️') {
        Write-Host "SUCCESS: Decoded successfully. Saving..."
        [System.IO.File]::WriteAllText("app.js.fixed", $restoredText, $utf8)
    } else {
        Write-Host "FAILED: Did not find restored emoji."
    }
} catch {
    Write-Host "Error decoding: $_"
}
