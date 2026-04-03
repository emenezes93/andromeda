# Configura ANDROID_HOME para o projeto (rode depois de instalar o Android Studio)
# Uso: .\scripts\setup-android-env.ps1
# Ou defina $env:ANDROID_SDK_PATH antes, ex: $env:ANDROID_SDK_PATH = "D:\Android\Sdk"

$sdkPath = $env:ANDROID_SDK_PATH
if (-not $sdkPath) {
    $sdkPath = "C:\Users\menez\AppData\Local\Android\Sdk"
}

if (-not (Test-Path $sdkPath)) {
    Write-Host "Android SDK nao encontrado em: $sdkPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "1. Instale o Android Studio: https://developer.android.com/studio" -ForegroundColor Yellow
    Write-Host "2. Abra o Android Studio > Settings > Appearance & Behavior > System Settings > Android SDK" -ForegroundColor Yellow
    Write-Host "   e veja o caminho 'Android SDK Location'." -ForegroundColor Yellow
    Write-Host "3. Rode este script de novo passando o caminho:" -ForegroundColor Yellow
    Write-Host "   `$env:ANDROID_SDK_PATH = 'SEU_CAMINHO'; .\scripts\setup-android-env.ps1" -ForegroundColor Cyan
    exit 1
}

$platformTools = Join-Path $sdkPath "platform-tools"
$emulator = Join-Path $sdkPath "emulator"
if (-not (Test-Path (Join-Path $platformTools "adb.exe"))) {
    Write-Host "platform-tools nao encontrado. Abra Android Studio > SDK Manager e instale 'Android SDK Platform-Tools'." -ForegroundColor Red
    exit 1
}

# Seta para esta sessao (funciona na hora neste terminal)
$env:ANDROID_HOME = $sdkPath
$env:Path = "$platformTools;$emulator;" + $env:Path
Write-Host "ANDROID_HOME definido para esta sessao: $sdkPath" -ForegroundColor Green
Write-Host "Voce pode rodar: npx expo start --android" -ForegroundColor Green

# Pergunta se quer salvar permanentemente
$save = Read-Host "Definir ANDROID_HOME permanentemente para o seu usuario? (s/n)"
if ($save -eq "s" -or $save -eq "S") {
    [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkPath, "User")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*$platformTools*") {
        [System.Environment]::SetEnvironmentVariable("Path", "$userPath;$platformTools;$emulator", "User")
    }
    Write-Host "Variaveis salvas. Feche e abra o terminal (e o Cursor) para usar em novas sessoes." -ForegroundColor Green
}
