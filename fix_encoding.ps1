$text = '2â€“3 weeks'
$bytes = [System.Text.Encoding]::GetEncoding(1252).GetBytes($text)
$fixed = [System.Text.Encoding]::UTF8.GetString($bytes)
Write-Host $fixed
