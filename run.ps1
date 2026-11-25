param([switch]$DemoOnly)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    $localNode = Join-Path $env:LOCALAPPDATA 'Programs\nodejs'
    if (Test-Path -LiteralPath (Join-Path $localNode 'node.exe')) {
        $env:Path = $localNode + ';' + $env:Path
    }
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Установите Node.js 24 LTS, затем повторите запуск.' }
if (Get-Command pnpm.cmd -ErrorAction SilentlyContinue) {
    & pnpm.cmd install --frozen-lockfile
} elseif (Get-Command npx.cmd -ErrorAction SilentlyContinue) {
    & npx.cmd --yes pnpm@11.25.0 install --frozen-lockfile
} else { throw 'Требуется pnpm или npm из поставки Node.js.' }
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
try {
    $testArgs = @('core/run.js', '--demo', '--headed')
    if ($DemoOnly) {
        $testArgs += @('login.spec.js', '--grep', 'ТК-А07')
    } else {
        if (-not $env:MATERIK_LOGIN -or -not $env:MATERIK_PASSWORD) {
            $credential = Get-Credential -Message 'Учебная запись www.materik-m.ru для демонстрации тестов'
            if (-not $credential) { exit 1 }
            $env:MATERIK_LOGIN = $credential.UserName
            $env:MATERIK_PASSWORD = $credential.GetNetworkCredential().Password
        }
        if (-not $env:MATERIK_LOGIN -or -not $env:MATERIK_PASSWORD) { throw 'Для полного прогона нужны логин и пароль.' }
    }
    $env:QA_DEMO_RUN_ID = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH-mm-ss-fffZ') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
    & node @testArgs
    $result = $LASTEXITCODE
    $report = Join-Path $PSScriptRoot "runs\$env:QA_DEMO_RUN_ID\report\index.html"
    if (Test-Path -LiteralPath $report -PathType Leaf) {
        Write-Host 'Открываю Allure-отчёт текущего прогона'
        Start-Process -FilePath $report
    } elseif ($result -eq 0) { throw 'Файл отчета текущего прогона отсутствует.' }
    exit $result
} finally {
    Remove-Item Env:MATERIK_LOGIN,Env:MATERIK_PASSWORD,Env:QA_DEMO_RUN_ID -ErrorAction SilentlyContinue
}
