$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    $localNode = Join-Path $env:LOCALAPPDATA 'Programs\nodejs'
    if (Test-Path -LiteralPath (Join-Path $localNode 'node.exe')) {
        $env:Path = $localNode + ';' + $env:Path
    }
}
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) { throw 'Установите Node.js 24 LTS с npm и повторите запуск.' }
$major = & node.exe -p 'parseInt(process.versions.node)'
if ($LASTEXITCODE -ne 0 -or [int]$major -lt 24) { throw 'Для запуска нужен Node.js версии 24 или новее.' }
$pnpmVersion = '11.25.0'
$pnpm = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
if ($pnpm -and ((& pnpm.cmd --version) -eq $pnpmVersion)) {
    & pnpm.cmd install --frozen-lockfile --prod=false
} elseif (Get-Command npx.cmd -ErrorAction SilentlyContinue) {
    & npx.cmd --yes "pnpm@$pnpmVersion" install --frozen-lockfile --prod=false
} else { throw 'Установите npm вместе с Node.js и повторите запуск.' }
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
try {
    if (-not $env:MATERIK_LOGIN -or -not $env:MATERIK_PASSWORD) {
        $credential = Get-Credential -Message 'Учебная запись www.materik-m.ru для демонстрации тестов'
        if (-not $credential) { exit 1 }
        $env:MATERIK_LOGIN = $credential.UserName
        $env:MATERIK_PASSWORD = $credential.GetNetworkCredential().Password
    }
    if (-not $env:MATERIK_LOGIN -or -not $env:MATERIK_PASSWORD) { throw 'Для демонстрации всех тестов нужны логин и пароль.' }
    $env:QA_DEMO = '1'
    $env:QA_DEMO_RUN_ID = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH-mm-ss-fffZ') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
    & node core/run.js --headed
    $result = $LASTEXITCODE
    $report = Join-Path $PSScriptRoot "runs\$env:QA_DEMO_RUN_ID\report\index.html"
    if (Test-Path -LiteralPath $report -PathType Leaf) {
        Write-Host '07 / Сдача и приёмка — открывается Allure текущего прогона'
        Start-Process -FilePath $report
    } elseif ($result -eq 0) { throw 'Файл отчета текущего прогона отсутствует.' }
    exit $result
} finally {
    Remove-Item Env:MATERIK_LOGIN,Env:MATERIK_PASSWORD -ErrorAction SilentlyContinue
}
