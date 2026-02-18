# Scripts de padronização do repositório

Scripts para aplicar as regras descritas em [REPOSITORY.md](../REPOSITORY.md).

## Pré-requisitos

- **GitHub CLI** (`gh`) instalado e autenticado
  - 📖 **Guia completo:** [INSTALL_GH.md](INSTALL_GH.md)
  - Ou instale: <https://cli.github.com> e execute `gh auth login`
- **Permissão de admin** no repositório (para proteção de branches)

## setup-repository.sh (Bash)

Aplica **proteção de branches** nas branches principais (`main` e `master`):

- Exige pull request antes do merge
- Exige 1 approval e dismiss stale reviews
- Exige que os status checks do CI passem: `lint`, `test`, `security`, `build`
- Exige branch atualizada (strict)
- Não permite force push nem exclusão da branch

### Uso (Git Bash / WSL / Linux / macOS)

```bash
# Dentro do clone do repositório (usa origin para owner/repo)
chmod +x .github/scripts/setup-repository.sh
./.github/scripts/setup-repository.sh --dry-run   # só simula
./.github/scripts/setup-repository.sh             # aplica

# Proteger apenas main
./.github/scripts/setup-repository.sh --branch main

# Repositório específico
./.github/scripts/setup-repository.sh meuorg/andromeda
```

### Opções

| Opção       | Descrição |
|------------|-----------|
| `--dry-run` | Mostra o que seria feito, não altera nada |
| `--branch NAME` | Protege apenas a branch NAME (pode repetir) |
| `--help`   | Ajuda |

## setup-repository.ps1 (PowerShell)

Equivalente ao script Bash para Windows (PowerShell).

### Uso (Windows)

```powershell
cd C:\caminho\do\andromeda
.\.github\scripts\setup-repository.ps1 -DryRun   # simula
.\.github\scripts\setup-repository.ps1           # aplica
.\.github\scripts\setup-repository.ps1 -Repo "meuorg/andromeda"
```

## Definir branch padrão

Para definir `main` como branch padrão do repositório (após criar a branch se necessário):

```bash
gh repo edit OWNER/REPO --default-branch main
```

## Gerar release (manual)

Conforme [REPOSITORY.md](../REPOSITORY.md):

```bash
git checkout main
git pull
git tag -a v2.0.0 -m "Release v2.0.0"
git push origin v2.0.0
```

O workflow `.github/workflows/release.yml` gera a release e a imagem Docker automaticamente.
