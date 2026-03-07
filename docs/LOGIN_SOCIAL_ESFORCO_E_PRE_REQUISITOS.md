# Login social — esforço, pré-requisitos e reaproveitamento

Documento de medição de esforço para implementar login social (OAuth 2.0) no Andromeda (Anamnese Inteligente PaaS), com lista de pré-requisitos e do que já está pronto para reaproveitar.

---

## 1. Resumo executivo

| Item | Estimativa |
|------|------------|
| **Esforço total (1 provedor, ex.: Google)** | **~8–14 dias** (1 dev full-time) |
| **Esforço por provedor adicional** (ex.: GitHub, Apple) | **~2–4 dias** cada |
| **Risco** | Médio (mudança em modelo User e fluxo de signup) |

O esforço considera: backend (schema, use cases, rotas, env), frontend (botões, callback, estado), testes e documentação. Não inclui aprovação em consoles (Google Cloud, Apple Developer etc.), que pode levar dias.

---

## 2. O que já temos pronto (reaproveitamento)

### 2.1 Backend

| Componente | Situação | Como reaproveitar |
|------------|----------|-------------------|
| **JWT + refresh token** | ✅ Pronto | `JwtTokenService` gera o mesmo payload (`userId`, `email`, `role`, `tenantId`). Após obter/crear usuário via OAuth, chamar `generateAccessToken(user, membership)` e devolver o mesmo contrato que `/v1/auth/login`. Nenhuma alteração em consumidores. |
| **Auth middleware** | ✅ Pronto | Continua validando Bearer JWT. Login social só troca a forma de obter o usuário; o token é idêntico. |
| **Refresh / logout** | ✅ Pronto | `RefreshTokenUseCase`, `LogoutUseCase` e rotas já funcionam. Usuário social usa os mesmos endpoints. |
| **2FA (TOTP)** | ✅ Pronto | Pode permanecer opcional para contas que têm senha; para contas só-OAuth, 2FA pode ficar desabilitado ou ser tratado em fase posterior. |
| **Signup (tenant + owner)** | ✅ Pronto | Lógica de `SignupUseCase` + `createWithOwner` é reutilizável: em “signup social” criar tenant + usuário com `authProvider`/`providerId` e sem senha (ou hash placeholder até migração). |
| **Rate limit em auth** | ✅ Pronto | Rotas `/v1/auth/*` já têm limite; basta incluir as novas rotas (ex.: `/v1/auth/oauth/:provider`, `/v1/auth/oauth/:provider/callback`) no mesmo padrão. |
| **CORS** | ✅ Pronto | `CORS_ORIGINS` / `FRONTEND_URL` já configurados; só garantir que o redirect_uri do OAuth esteja na origem permitida. |
| **Audit** | ✅ Pronto | `IAuditService.log` já usado em login/signup; dar log de `login_social` ou `signup_social` com `provider`. |

### 2.2 Frontend

| Componente | Situação | Como reaproveitar |
|------------|----------|-------------------|
| **API client + token** | ✅ Pronto | `apiFetch`, `client.ts` com refresh em 401 e headers `Authorization` / `x-tenant-id`. Após callback OAuth, receber `token` + `refreshToken` + `user` e chamar `setAuth(...)` como no login atual. |
| **Auth store** | ✅ Pronto | `authStore` (localStorage + estado) não precisa distinguir origem (email/senha vs social). |
| **LoginPage / SignupPage** | ✅ Pronto | Só incluir botões “Continuar com Google” (e outros). Redirect para backend inicia o fluxo; callback pode redirecionar para `/login?success=oauth` com token no hash/query (conforme estratégia) ou retornar JSON para o frontend exibir e então setAuth + navigate. |
| **Proteção de rotas** | ✅ Pronto | `ProtectedRoute` e redirecionamento para `/login` já funcionam. |
| **Onboarding pós-login** | ✅ Pronto | `isOnboardingDismissed()` e redirect para `/onboarding` ou `/` já aplicados após qualquer login. |

### 2.3 Infra e produto

| Componente | Situação | Como reaproveitar |
|------------|----------|-------------------|
| **Multi-tenant (RLS)** | ✅ Pronto | `x-tenant-id` + membership; usuário social também terá `tenantId` no JWT. Para signup social, definir como o tenant é escolhido (ex.: primeiro login escolhe ou cria tenant; ou link de convite com tenant fixo). |
| **Documentação de API** | ✅ Pronto | Swagger em `/documentation`; registrar novas rotas OAuth com schemas. |

---

## 3. Pré-requisitos

### 3.1 Contas e aplicações nos provedores

| Provedor | O que criar | Observação |
|----------|-------------|------------|
| **Google** | Projeto no Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Web application). URIs de redirect: `https://api.seudominio.com/v1/auth/oauth/google/callback` (e equivalente para frontend se usar flow no client). | Email de login precisa estar no mesmo domínio se usar “Internal” (Google Workspace). |
| **GitHub** | GitHub → Settings → Developer settings → OAuth Apps → New. Authorization callback URL: `https://api.seudominio.com/v1/auth/oauth/github/callback`. | Scopes: `user:email` (e opcionalmente `read:user`). |
| **Apple** | Apple Developer → Certificates, Identifiers & Profiles → Identifiers → Sign in with Apple. Service ID e configuração de redirect. | Exige Apple Developer Program (pago). Mais burocrático. |

### 3.2 Variáveis de ambiente (backend)

Novas variáveis sugeridas em `src/config/env.ts` (todas opcionais; se não definidas, login social fica desabilitado):

```env
# Google OAuth (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# GitHub OAuth (opcional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
# Apple OAuth (opcional) — mais campos (teamId, keyId, privateKey, etc.)
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
# URL do frontend para redirect após login (já existe FRONTEND_URL; usar para callback final)
# FRONTEND_URL=https://app.seudominio.com
```

- **Validação:** só exigir `*_CLIENT_ID` e `*_CLIENT_SECRET` (ou equivalente) quando a rota `/v1/auth/oauth/:provider` for realmente registrada (feature flag ou presença das env).

### 3.3 Schema do banco (User)

O modelo `User` hoje tem `passwordHash` obrigatório. Para login social:

- **Opção A (recomendada):** Tornar `passwordHash` opcional e adicionar campos de provedor:
  - `authProvider` (enum ou string: `email` | `google` | `github` | `apple`)
  - `providerId` (string; id do usuário no provedor, ex.: `sub` do Google)
  - Índice único por `(authProvider, providerId)` para lookups; para `authProvider = 'email'`, `providerId` pode ser null ou igual ao userId.
- **Opção B:** Manter `passwordHash` obrigatório e usar um hash “placeholder” (impossível de usar para login) para usuários só-OAuth; adicionar `authProvider` + `providerId` e na hora do login por senha checar `authProvider === 'email'`.

Recomendação: **Opção A** (schema mais limpo e sem senha fictícia). Exige:

- Migration: `passwordHash String?`, `authProvider String @default("email")`, `providerId String?`, índice único `@@unique([authProvider, providerId])` (com cuidado para múltiplos nulls se `email` for um “provider”).
- Ajuste em todos os pontos que criam usuário: `createWithOwner`, `createWithMembership`, `User` entity (e repositório) para aceitar `passwordHash` opcional e `authProvider`/`providerId`.
- Login por senha: só permitir se `authProvider === 'email'` e `passwordHash` presente.

### 3.4 Segurança

- **state:** Gerar e validar `state` no fluxo OAuth (CSRF). Armazenar em cookie httpOnly ou sessão server-side com expiry curto (ex.: 5 min).
- **PKCE:** Recomendado para clientes públicos (SPA). Backend pode gerar `code_verifier`/`code_challenge` na rota que redireciona ao provedor e validar no callback.
- **Redirect URI:** Usar lista fixa por ambiente (não aceitar redirect_uri vindo do client) para evitar open redirect.
- **Tokens do provedor:** Não persistir access_token/refresh_token do Google/GitHub/Apple no nosso banco; só usar para obter email/nome e criar sessão nossa (JWT + refresh).

### 3.5 Produto / UX

- **Signup social:** Definir como o tenant é criado ou escolhido (ex.: primeiro acesso “Criar organização” vs “Entrar em organização existente”; ou link de convite com `tenantId`).
- **Vínculo de contas:** Se o usuário já tiver conta por email e fizer login social com o mesmo email: fazer “link” (atualizar `authProvider`/`providerId`) ou tratar como login da conta existente (sem criar nova). Recomendação: mesmo email = login na conta existente e opcionalmente registrar o provedor para logins futuros.
- **Tenant no signup social:** Hoje o signup pede `tenantName`; no social pode ser: passo extra “Nome da clínica” após callback, ou criar tenant com nome derivado do usuário (ex.: “Clínica de {nome}”) e permitir edição depois.

---

## 4. Estimativa de esforço por área

### 4.1 Backend

| Tarefa | Estimativa | Notas |
|--------|------------|--------|
| Schema Prisma (User: authProvider, providerId, passwordHash opcional) + migration | 0,5–1 d | Inclui revisão de índices e unique. |
| Ajustes em repositórios e entidade User (createWithOwner, create, findByEmail, novo findByProvider) | 1–1,5 d | Inclui `PrismaUserRepository`, `PrismaTenantRepository`, interface `IUserRepository`. |
| Env (GOOGLE_*, GITHUB_*, etc.) e validação condicional | 0,25 d | |
| Rotas OAuth: GET `/v1/auth/oauth/:provider` (redirect) e GET `/v1/auth/oauth/:provider/callback` (troca code por token, busca/cria user, emite JWT) | 1,5–2 d | Por provedor; primeiro provedor inclui desenho do fluxo e state/PKCE. |
| Use case “LoginOrSignupWithOAuth” (ou equivalente) | 1 d | Entrada: provider, code, state; saída: token + refreshToken + user (mesmo contrato do login). |
| Política “mesmo email = login na conta existente” + opcional link de provedor | 0,5 d | |
| Skip auth middleware para rotas de callback (e listar em skipPaths) | 0,25 d | |
| Rate limit nas rotas OAuth | 0,25 d | |
| Testes de integração (callback com code mockado ou lib que simula provedor) | 1 d | |
| **Subtotal backend (1 provedor)** | **~6–8 d** | |

### 4.2 Frontend

| Tarefa | Estimativa | Notas |
|--------|------------|--------|
| Botões “Continuar com Google” (e depois GitHub/Apple) na LoginPage e SignupPage | 0,5 d | Inclui desabilitar se backend não tiver env do provedor (opcional: endpoint “GET /v1/auth/oauth/providers” com lista). |
| Página ou handler de callback (rota ex.: `/auth/callback`) que recebe token (query/hash) e chama setAuth + navigate | 0,5–1 d | Depende se o callback é backend redirect para frontend com token, ou frontend chama backend com code. |
| Tratamento de erros (usuário cancela no provedor, provider indisponível, etc.) | 0,25 d | |
| **Subtotal frontend (1 provedor)** | **~1,25–1,75 d** | |

### 4.3 Documentação e QA

| Tarefa | Estimativa | Notas |
|--------|------------|--------|
| Atualizar README / CLAUDE.md com variáveis OAuth e fluxo resumido | 0,25 d | |
| Testes E2E (opcional: login com Google em ambiente de staging com app de teste) | 0,5–1 d | |
| **Subtotal** | **~0,75–1,25 d** | |

### 4.4 Total e provedores adicionais

- **Primeiro provedor (ex.: Google):** **~8–11 dias** (backend 6–8 + frontend 1,25–1,75 + docs/QA 0,75–1,25).
- **Provedores adicionais (GitHub, Apple):** **~2–4 dias** cada (menos schema e desenho de fluxo; mais configuração específica e testes).

---

## 5. Ordem sugerida de implementação

1. **Schema + migration** (User: authProvider, providerId, passwordHash opcional).
2. **Backend:** env, rotas OAuth para um provedor (ex.: Google), use case, skipPaths e rate limit.
3. **Frontend:** botão “Continuar com Google” e tela de callback (ou redirect com token).
4. **Política de email:** mesmo email = login na conta existente (sem duplicar usuário).
5. **Testes** de integração e ajustes.
6. **Segundo provedor** (ex.: GitHub) e, se necessário, Apple.

---

## 6. Riscos e dependências

- **Aprovação de app (Apple):** Pode levar dias/semanas; não bloqueia Google/GitHub.
- **Mudança de contrato de User:** Qualquer código que assuma `passwordHash` sempre preenchido precisa ser revisado (login, alteração de senha, 2FA).
- **Tenant no signup social:** Definir produto antes (nome da organização, convites) evita retrabalho.

---

## 7. Referências rápidas no código

| O que | Onde |
|-------|------|
| Login (email/senha) | `AuthController.login` → `LoginUseCase` |
| Signup (tenant + owner) | `AuthController.signup` → `SignupUseCase` → `PrismaTenantRepository.createWithOwner` |
| Geração de JWT | `JwtTokenService.generateAccessToken` |
| Skip paths auth | `src/bootstrap/app.ts` (authPlugin skipPaths) |
| Schemas auth | `src/modules/auth/schemas.ts` |
| User Prisma | `prisma/schema.prisma` (model User) |
| API login frontend | `frontend/src/api/auth.ts` (login, signup, setAuth via client) |
| Páginas de auth | `frontend/src/features/auth/LoginPage.tsx`, `SignupPage.tsx` |

---

*Documento gerado para suportar decisão e planejamento do login social. Atualizar estimativas após spike ou primeiro provedor implementado.*
