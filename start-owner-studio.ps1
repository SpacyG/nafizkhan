$ErrorActionPreference = 'Stop'
$dir = Join-Path $env:LOCALAPPDATA 'NafizPortfolio'
$keyFile = Join-Path $dir 'studio-key.dpapi'
if (!(Test-Path -LiteralPath $keyFile)) {
    $secret = Read-Host 'Choose your private Studio key (20 to 256 characters)' -AsSecureString
    if ($secret.Length -lt 20 -or $secret.Length -gt 256) { throw 'Use 20 to 256 characters.' }
    [void][IO.Directory]::CreateDirectory($dir)
    $encrypted = ConvertFrom-SecureString $secret
    [IO.File]::WriteAllText($keyFile, $encrypted)
} else {
    $secret = ConvertTo-SecureString ([IO.File]::ReadAllText($keyFile))
}
$info = [Diagnostics.ProcessStartInfo]::new()
$info.FileName = (Get-Command node.exe).Source
$info.Arguments = 'server.mjs'
$info.WorkingDirectory = $PSScriptRoot
$info.UseShellExecute = $false
$info.EnvironmentVariables.Remove('OWNER_PASSWORD_HASH')
$info.EnvironmentVariables['OWNER_PASSWORD'] = ([Net.NetworkCredential]::new('', $secret)).Password
$info.EnvironmentVariables['HOST'] = '127.0.0.1'
$info.EnvironmentVariables['PORT'] = '4173'
$info.EnvironmentVariables['SITE_ORIGIN'] = 'http://127.0.0.1:4173'
Write-Host 'Open http://127.0.0.1:4173/studio.html and sign in with your Studio key.'
$process = [Diagnostics.Process]::Start($info)
try { $process.WaitForExit() } finally { if (!$process.HasExited) { $process.Kill() } }

