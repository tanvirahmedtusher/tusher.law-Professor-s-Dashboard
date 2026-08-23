$path = 'app.js'
$text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$win1252 = [System.Text.Encoding]::GetEncoding(1252)
$utf8 = [System.Text.Encoding]::UTF8

$emojis = @(
    "🔖", "📑", "🛡️", "🛑", "🖨️", "✖️", "💳", "🍎", "📱", "🦉", "🚣", "🇧🇩", "💼", "⭐", "🏆", "🎯", "🚫", "📍", "✉️", "🔗", "🔬", "🆔", 
    "🚪", "⚙️", "🛠️", "💡", "🧠", "🏢", "🏫", "👤", "🧑‍🏫", "📩", "📞", "🌎", "📌", "🔑", "🔐", "🔓", "📖", "📝", "📅", 
    "🗓️", "⏰", "⏱️", "⚠️", "✅", "❌", "⬇️", "⬆️", "↗️", "📉", "📈", "🔄", "🔍", "📊", "🔔", "✨", "🌟", "✔️", "➕", 
    "➖", "🔥", "🚀", "🌍", "🌏", "🗺️", "🎓", "👩‍🎓", "👨‍🎓", "🧪", "🧬", "📁", "📂", "📚", "📕", "📗", "📘", "📙", 
    "📓", "📔", "📒", "📃", "📜", "📄", "📰", "🗞️", "🏷️", "🔒", "🔏", "🗝️", "🔨", "🪓", "⛏️", "▶️", "◀️", "🔼", "🔽", 
    "⏪", "⏩", "⏮️", "⏭️", "⏯️", "☑️", "✔", "❎", "➗", "✖️", "❓", "❔", "❕", "❗", "©", "®", "™", "–", "—", "‘", 
    "’", "“", "”", "•", "…", "£", "€", "¥", "₹", "₽", "₪", "₩", "₫", "₴", "₵", "✓", "✏️", "📦", "🗑️", "🏛️", "📧", 
    "⚡", "↗", "→", "←", "↑", "↓", "↔", "↕", "↖", "↘", "↙", "💯", "💬", "👀", "👍", "👎", "👏", "🙌", "🤝", "🙏", 
    "🎉", "🎊", "🎈", "🎂", "🎖️", "🎗️", "🎙️", "🎚️", "🎛️", "🎤", "🎧", "📻", "📺", "📼", "📹", "🎥", "🎬", "🎭", "🎫", 
    "🎟️", "🎨", "🖼️", "🧵", "🧶", "🛍️", "🛒", "🎁", "🎏", "🎀", "🪄", "🪆", "🧩", "🧸", "🪀", "🪁", "🔮", "🧿", "🎮", 
    "🕹️", "🎰", "🎲", "♟️", "🃏", "🀄", "🎴", "♥️", "♦️", "♠️", "♣️"
)

function Fix-Mojibake($trueString) {
    $utf8Bytes = $utf8.GetBytes($trueString)
    $corruptedString = $win1252.GetString($utf8Bytes)
    if ($corruptedString -ne $trueString) {
        $script:text = $script:text.Replace($corruptedString, $trueString)
    }
}

foreach ($e in $emojis) {
    Fix-Mojibake -trueString $e
}

[System.IO.File]::WriteAllText($path, $text, [System.Text.Encoding]::UTF8)
Write-Host "Fixed Mojibake in $path using extended Emoji dictionary."
