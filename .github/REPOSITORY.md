# Organização do repositório

Este documento descreve o modelo de branches, as regras de proteção recomendadas e o fluxo de releases.

---

## Estratégia de branches

| Branch      | Uso |
|------------|-----|
| **main**   | Código em produção. Todo merge deve passar por PR e CI. Releases são geradas a partir de tags em `main`. |
| **master** | Suportada igual a `main` (CI e proteção). Preferir **main** como branch padrão. |
| **feature/*** | Novas funcionalidades. Branch a partir de `main`, merge via PR. |
| **fix/***   | Correções pontuais. Branch a partir de `main`, merge via PR. |

- Não fazer commit direto em `main`/`master`.
- Deletar branch após merge do PR (opcional, configurável no repositório).

---

## Branch protection (configuração no GitHub)

Configurar em **Settings → Branches → Add branch rule** (ou "Add rule") para **main** e **master**.

### Regras recomendadas

1. **Branch name pattern:** `main` e `master` (duas regras ou uma com padrão `main|master`).
2. **Require a pull request before merging**
   - ✅ Require approvals: 1 (ajustar conforme o time)
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - (Opcional) Require review from Code Owners
3. **Require status checks to pass before merging**
   - Status checks obrigatórios (exemplos):
     - `lint`
     - `test`
     - `security`
     - `build`
   - ✅ Require branches to be up to date before merging
4. **Do not allow bypassing the above settings** (incluir admins, se desejado).
5. **Allow force pushes:** Não (desmarcado).
6. **Allow deletions:** Não (desmarcado), para evitar apagar `main`/`master`.

### Aplicar via script (recomendado)

Use o script de padronização que aplica as regras acima em todas as branches principais:

```bash
# Bash (Git Bash / WSL / Linux / macOS)
./.github/scripts/setup-repository.sh --dry-run   # simula
./.github/scripts/setup-repository.sh             # aplica
```

```powershell
# PowerShell (Windows)
.\.github\scripts\setup-repository.ps1 -DryRun     # simula
.\.github\scripts\setup-repository.ps1            # aplica
```

Requisitos: [GitHub CLI](https://cli.github.com) instalado e autenticado (`gh auth login`), e permissão de **admin** no repositório. Mais detalhes em [.github/scripts/README.md](.github/scripts/README.md).

---

## Releases

### Como gerar uma release

1. **Garantir que `main` está estável** (CI verde, PRs mergeados).
2. **Criar uma tag anotada** no formato semver (ex.: `v2.0.0`):
   ```bash
   git tag -a v2.0.0 -m "Release v2.0.0"
   git push origin v2.0.0
   ```
3. O workflow **Release** (`.github/workflows/release.yml`) será disparado e irá:
   - Fazer build da aplicação e do Prisma
   - Gerar artefatos (tarball do build)
   - Construir e publicar a imagem Docker no GitHub Container Registry (GHCR)
   - Criar a **GitHub Release** com notas e anexos

### Formato das tags

- **Versões estáveis:** `vMAJOR.MINOR.PATCH` (ex.: `v2.0.0`, `v2.1.0`).
- **Pré-releases (opcional):** `v2.0.0-beta.1`, `v2.0.0-rc.1`.

O workflow de release considera tags que começam com `v` (ex.: `v*`).

### Onde encontrar a release e a imagem

- **Releases:** Aba **Releases** do repositório no GitHub.
- **Imagem Docker:** GitHub Container Registry, por exemplo:
  - `ghcr.io/<owner>/andromeda:latest`
  - `ghcr.io/<owner>/andromeda:v2.0.0`

---

## Resumo do fluxo

```
feature/xyz → PR → main (após review + CI)
                    ↓
              tag v1.2.3 → Release workflow → Release + Docker image
```
