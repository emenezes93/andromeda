#!/usr/bin/env bash
# =============================================================================
# Script de padronização do repositório
# Aplica proteção de branches e opcionalmente outras configurações via GitHub CLI.
# Uso: ./setup-repository.sh [--dry-run] [--branch main]
# Requer: gh (https://cli.github.com) instalado e autenticado (gh auth login).
# Permissão: admin no repositório.
# =============================================================================

set -e

DRY_RUN=false
BRANCHES=""
REPO=""

# Status checks que devem passar antes do merge (nomes dos jobs do CI)
REQUIRED_CHECKS='["lint","test","security","build"]'
REQUIRED_APPROVALS=1

usage() {
  echo "Uso: $0 [OPÇÕES] [REPO]"
  echo ""
  echo "OPÇÕES:"
  echo "  --dry-run       Só mostra o que seria feito, não altera nada"
  echo "  --branch NAME   Protege a branch NAME (pode repetir; padrão: main master)"
  echo "  --help          Mostra esta ajuda"
  echo ""
  echo "REPO:  owner/repo (ex: octocat/andromeda). Se omitido, usa o repo do git remoto origin."
  echo ""
  echo "Exemplo: $0 --dry-run"
  echo "         $0 --branch main --branch master"
  echo "         $0 meuorg/andromeda"
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --branch)
      if [[ -n "$BRANCHES" ]]; then BRANCHES="$BRANCHES $2"; else BRANCHES="$2"; fi
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    -*)
      echo "Opção desconhecida: $1"
      usage
      exit 1
      ;;
    *)
      if [[ -z "$REPO" ]]; then
        REPO="$1"
      else
        echo "Repositório já definido: $REPO"
        usage
        exit 1
      fi
      shift
      ;;
  esac
done

[[ -z "$BRANCHES" ]] && BRANCHES="main master"

# -----------------------------------------------------------------------------
# Resolver repositório (owner/repo)
# -----------------------------------------------------------------------------
if [[ -z "$REPO" ]]; then
  if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    ORIGIN=$(git remote get-url origin 2>/dev/null || true)
    if [[ -n "$ORIGIN" ]]; then
      # suporta https e git@
      if [[ "$ORIGIN" =~ ^https://github\.com/([^/]+)/([^/.]+) ]]; then
        REPO="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
      elif [[ "$ORIGIN" =~ ^git@github\.com:([^/]+)/([^/.]+) ]]; then
        REPO="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
      fi
    fi
  fi
  if [[ -z "$REPO" ]]; then
    echo "Erro: não foi possível inferir owner/repo. Passe REPO como argumento ou execute dentro de um clone com remote origin."
    exit 1
  fi
fi

echo "Repositório: $REPO"
echo "Branches a proteger: $BRANCHES"
echo "Status checks obrigatórios: $REQUIRED_CHECKS"
echo "Approvals necessários: $REQUIRED_APPROVALS"
if [[ "$DRY_RUN" == "true" ]]; then
  echo "[DRY-RUN] Nenhuma alteração será feita."
  echo ""
fi

# -----------------------------------------------------------------------------
# Verificar gh
# -----------------------------------------------------------------------------
if ! command -v gh >/dev/null 2>&1; then
  echo "Erro: GitHub CLI (gh) não encontrado. Instale: https://cli.github.com"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Erro: gh não está autenticado. Execute: gh auth login"
  exit 1
fi

# -----------------------------------------------------------------------------
# Aplicar proteção por branch
# -----------------------------------------------------------------------------
for BRANCH in $BRANCHES; do
  echo "----------------------------------------"
  echo "Branch: $BRANCH"
  echo "----------------------------------------"

  # Verifica se a branch existe no remoto
  if ! gh api "repos/$REPO/branches/$BRANCH" --silent 2>/dev/null; then
    echo "  Aviso: branch '$BRANCH' não existe no remoto. Pulando."
    continue
  fi

  PAYLOAD=$(cat <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": $REQUIRED_CHECKS
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": $REQUIRED_APPROVALS,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
)

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "  [DRY-RUN] Seria aplicada proteção: PR obrigatório, $REQUIRED_APPROVALS approval(s), status checks: $REQUIRED_CHECKS"
    continue
  fi

  if gh api "repos/$REPO/branches/$BRANCH/protection" \
    -X PUT \
    -H "Accept: application/vnd.github+json" \
    --input - <<< "$PAYLOAD" 2>/dev/null; then
    echo "  Proteção aplicada com sucesso."
  else
    echo "  Erro ao aplicar proteção. Verifique permissões (admin) e se a branch existe."
    exit 1
  fi
done

# -----------------------------------------------------------------------------
# Opcional: definir branch padrão como main (apenas se --set-default-main)
# -----------------------------------------------------------------------------
# Para definir branch padrão: gh repo edit OWNER/REPO --default-branch main

echo ""
echo "Concluído. Veja: https://github.com/$REPO/settings/branches"
