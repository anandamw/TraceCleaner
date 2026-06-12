Add-Type -AssemblyName System.Drawing
$icon = [System.Drawing.Icon]::ExtractAssociatedIcon("C:\Windows\explorer.exe")
if ($icon -ne $null) {
    $ms = New-Object System.IO.MemoryStream
    $icon.ToBitmap().Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $b64 = [Convert]::ToBase64String($ms.ToArray())
    Write-Host $b64.Substring(0, 50)
} else {
    Write-Host "Failed"
}
