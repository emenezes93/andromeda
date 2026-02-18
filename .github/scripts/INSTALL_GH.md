# Instalação e autenticação do GitHub CLI (`gh`)

Este guia mostra como instalar e autenticar o GitHub CLI (`gh`) necessário para executar os scripts de padronização do repositório.

---

## Instalação

### Windows

#### Opção 1: Winget (recomendado, Windows 10/11)

```powershell
winget install --id GitHub.cli
```

#### Opção 2: Chocolatey

```powershell
choco install gh
```

#### Opção 3: Scoop

```powershell
scoop install gh
```

#### Opção 4: Download manual

1. Acesse: <https://github.com/cli/cli/releases/latest>
2. Baixe `gh_X.X.X_windows_amd64.msi` (ou `.zip` para instalação portátil)
3. Execute o instalador ou extraia o `.zip` e adicione ao PATH

**Verificar instalação:**

```powershell
gh --version
```

---

### macOS

#### Opção 1: Homebrew (recomendado)

```bash
brew install gh
```

#### Opção 2: MacPorts

```bash
sudo port install gh
```

#### Opção 3: Download manual

1. Acesse: <https://github.com/cli/cli/releases/latest>
2. Baixe `gh_X.X.X_macOS_amd64.tar.gz` ou `.pkg`
3. Extraia ou instale

**Verificar instalação:**

```bash
gh --version
```

---

### Linux

#### Debian/Ubuntu

```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

#### Fedora/RHEL/CentOS

```bash
sudo dnf install 'dnf-command(config-manager)'
sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
sudo dnf install gh
```

#### Arch Linux

```bash
sudo pacman -S github-cli
```

#### Outras distribuições

Consulte: <https://github.com/cli/cli/blob/trunk/docs/install_linux.md>

**Verificar instalação:**

```bash
gh --version
```

---

## Autenticação

Após instalar, você precisa autenticar o `gh` com sua conta do GitHub.

### Método 1: Autenticação interativa (recomendado)

```bash
gh auth login
```

O comando guiará você pelo processo:

1. **Escolha o protocolo:**
   - `HTTPS` (recomendado) — usa HTTPS para todas as operações
   - `SSH` — usa chaves SSH (requer configuração prévia)

2. **Escolha como autenticar:**
   - `Login with a web browser` — abre o navegador para autorizar
   - `Paste an authentication token` — cola um token manualmente

3. **Se escolher web browser:**
   - Um código será exibido (ex.: `ABCD-1234`)
   - Pressione Enter para abrir o navegador
   - Autorize o GitHub CLI no navegador
   - Volte ao terminal e confirme

4. **Escolha o escopo (permissões):**
   - `repo` — acesso completo a repositórios (necessário para proteção de branches)
   - `workflow` — se precisar gerenciar workflows
   - Outros conforme necessário

### Método 2: Token manual (GitHub.com)

Se preferir usar um token existente ou criar um novo:

1. **Criar token no GitHub:**
   - Acesse: <https://github.com/settings/tokens>
   - Clique em **Generate new token** → **Generate new token (classic)**
   - Nome: `gh-cli` (ou outro)
   - Expiração: escolha (ex.: 90 dias ou sem expiração)
   - Escopos: marque pelo menos `repo` (e `workflow` se necessário)
   - Clique em **Generate token**
   - **Copie o token** (só aparece uma vez!)

2. **Autenticar com o token:**

```bash
gh auth login --with-token < token.txt
# ou colar diretamente:
echo "SEU_TOKEN_AQUI" | gh auth login --with-token
```

### Método 3: GitHub Enterprise Server

Se usar GitHub Enterprise Server:

```bash
gh auth login --hostname ghe.example.com
```

---

## Verificar autenticação

```bash
gh auth status
```

Saída esperada:

```
github.com
  ✓ Logged in as seu-usuario (github.com)
  ✓ Git operations for github.com configured to use https protocol
  ✓ Token: gho_... (expires in 89 days)
```

---

## Gerenciar autenticações

### Listar contas autenticadas

```bash
gh auth status
```

### Fazer logout

```bash
gh auth logout
```

### Fazer logout de um host específico

```bash
gh auth logout --hostname github.com
```

### Refresh do token (renovar)

```bash
gh auth refresh
```

---

## Solução de problemas

### Erro: "gh: command not found"

- **Windows:** Reinicie o terminal após instalar. Verifique se `gh` está no PATH.
- **Linux/macOS:** Verifique se o diretório de instalação está no PATH.

### Erro: "authentication required"

Execute `gh auth login` novamente.

### Erro: "insufficient permissions"

- Verifique se o token tem escopo `repo`.
- Se for GitHub Enterprise, verifique permissões de admin no repositório.

### Token expirado

```bash
gh auth refresh
```

Ou faça login novamente:

```bash
gh auth login
```

---

## Próximos passos

Após instalar e autenticar:

1. **Teste o acesso:**

```bash
gh repo view
```

2. **Execute o script de padronização:**

```bash
# Bash
./.github/scripts/setup-repository.sh --dry-run

# PowerShell
.\.github\scripts\setup-repository.ps1 -DryRun
```

---

## Referências

- Documentação oficial: <https://cli.github.com/manual/>
- Instalação: <https://github.com/cli/cli#installation>
- Autenticação: <https://cli.github.com/manual/gh_auth_login>
