$content = [System.IO.File]::ReadAllText('repair_unicode_dict.ps1', [System.Text.Encoding]::UTF8)
$bom = [byte[]](0xEF,0xBB,0xBF)
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$fs = [System.IO.File]::OpenWrite('repair_unicode_dict.ps1')
$fs.Write($bom, 0, $bom.Length)
$fs.Write($bytes, 0, $bytes.Length)
$fs.Close()
Write-Host "Added BOM to repair_unicode_dict.ps1"
