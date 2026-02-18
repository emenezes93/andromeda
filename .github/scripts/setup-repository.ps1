# =============================================================================
# Script de padronização do repositório (PowerShell)
# Aplica proteção de branches via GitHub CLI.
# Uso: .\setup-repository.ps1 [-DryRun] [-Branch "main"] [-Repo "owner/repo"]
# Requer: gh instalado e autenticado (gh auth login). Permissão: admin no repo.
# =============================================================================

param(
    [switch]$DryRun,
    [string[]]$Branch = @("main", "master"),
    [string]$Repo = ""
)

$ErrorActionPreference = "Stop"

$REQUIRED_CHECKS = @("lint", "test", "security", "build") | ConvertTo-Json
$REQUIRED_APPROVALS = 1

# -----------------------------------------------------------------------------
# Resolver repositório (owner/repo)
# -----------------------------------------------------------------------------
if ([string]::IsNullOrWhiteSpace($Repo)) {
    try {
        $origin = git remote get-url origin 2>$null
        if ($origin -match "github\.com[/:]([^/]+)/([^/.]+)") {
            $Repo = "$($Matches[1])/$($Matches[2])"
        }
    } catch {}
    if ([string]::IsNullOrWhiteSpace($Repo)) {
        Write-Error "Nao foi possivel inferir owner/repo. Passe -Repo 'owner/repo' ou execute dentro de um clone com remote origin."
    }
}

Write-Host "Repositorio: $Repo"
Write-Host "Branches a proteger: $($Branch -join ', ')"
Write-Host "Status checks: $($REQUIRED_CHECKS)"
if ($DryRun) {
    Write-Host "[DRY-RUN] Nenhuma alteracao sera feita."
}
Write-Host ""

# -----------------------------------------------------------------------------
# Verificar gh
# -----------------------------------------------------------------------------
if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "GitHub CLI (gh) nao encontrado. Instale: https://cli.github.com"
}
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "gh nao esta autenticado. Execute: gh auth login"
}

# -----------------------------------------------------------------------------
# Aplicar proteção por branch
# -----------------------------------------------------------------------------
foreach ($b in $Branch) {
    Write-Host "----------------------------------------"
    Write-Host "Branch: $b"
    Write-Host "----------------------------------------"

    $branchExists = gh api "repos/$Repo/branches/$b" --silent 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Aviso: branch '$b' nao existe no remoto. Pulando."
        continue
    }

    $payload = @{
        required_status_checks = @{
            strict   = $true
            contexts = @("lint", "test", "security", "build")
        }
        enforce_admins = $false
        required_pull_request_reviews = @{
            required_approving_review_count = $REQUIRED_APPROVALS
            dismiss_stale_reviews          = $true
            require_code_owner_reviews     = $false
        }
        restrictions           = $null
        required_linear_history = $false
        allow_force_pushes      = $false
        allow_deletions         = $false
    } | ConvertTo-Json -Depth 5 -Compress

    if ($DryRun) {
        Write-Host "  [DRY-RUN] Seria aplicada protecao: PR obrigatorio, $REQUIRED_APPROVALS approval(s), status checks: lint, test, security, build"
        continue
    }

    $payload | gh api "repos/$Repo/branches/$b/protection" -X PUT -H "Accept: application/vnd.github+json" --input - 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Protecao aplicada com sucesso."
    } else {
        Write-Error "Erro ao aplicar protecao na branch $b. Verifique permissoes (admin)."
    }
}

Write-Host ""
Write-Host "Concluido. Veja: https://github.com/$Repo/settings/branches"
