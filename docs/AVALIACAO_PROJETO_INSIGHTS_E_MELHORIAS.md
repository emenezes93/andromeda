# Avaliação do Projeto – Anamnese Inteligente PaaS

Documento de avaliação técnica do repositório (API + frontend), com insights e melhorias priorizadas.

---

## 1. Visão geral

| Aspecto | Situação |
|--------|----------|
| **Stack** | Backend: Fastify 4, Prisma 5, PostgreSQL 16, TypeScript. Frontend: React 18, Vite 5, Tailwind, Recharts, Lottie. |
| **Arquitetura** | API modular (health, auth, tenants, users, templates, sessions, engine, ai, audit, patients). Frontend por features (auth, dashboard, templates, sessions, patients, users, audit, insights). |
| **Multi-tenancy** | Header `x-tenant-id` + RLS no banco; tenant injetado por plugin. |
| **Segurança** | JWT, refresh token com rotação, Helmet, CORS configurável, rate limit global e por rota, senha forte no registro e criação de usuário. |
| **Qualidade** | Backend: ESLint, Prettier, Vitest (unit + integration + e2e), coverage. Frontend: build e lint em `src`; **sem testes automatizados**. |

---

## 2. Pontos fortes

- **Documentação de contexto:** `CLAUDE.md`, `PLANO_PROXIMAS_FUNCOES.md`, `PLANO_TELAS_POS_LOGIN.md` e `PROMPT_MELHORIAS.md` alinham visão, comandos e backlog.
- **Segurança já implementada:** complexidade de senha (auth + users), CORS por env, Helmet, rate limit por rota (templates, sessions, ai, auth). Refresh token com rotação e logout.
- **API bem estruturada:** módulos com rotas → schemas Zod; paginação e erros padronizados; auditoria em writes; idempotência onde faz sentido.
- **Frontend completo para o escopo atual:** login, dashboard com gráficos, templates (lista/criar/editar/detalhe), sessões (lista/nova/detalhe/fluxo anamnese), insights com gráficos e breathwork, pacientes (lista/form/detalhe/evolução), usuários (lista/convidar), auditoria. Navegação e RBAC (menu Usuários só para owner/admin).
- **UX moderna:** animações (botão tátil, gráficos Recharts, Lottie, círculo de respiração), toasts, estados de loading e vazio.
- **CI backend:** lint → test (com Postgres) → security audit → build → Docker (main). Frontend **não** está no pipeline.

---

## 3. Insights (observações)

### 3.1 Duplicação de estrutura no backend

Existem dois “mundos” no backend:

- **Legacy:** `src/modules/*` (auth, tenants, users, templates, sessions, engine, ai, audit, patients) e `src/plugins/` (env).
- **Hexagonal:** `src/core/` (domain, application, infrastructure, ports) e `src/bootstrap/app.ts` usando `@config/env`, `@http/*`, `Container`, `AuthController`.

O `buildApp()` registra o `AuthController` (hexagonal) e as rotas legacy. Isso pode gerar confusão sobre onde implementar novas features (ex.: novo endpoint de auth). **Recomendação:** definir uma regra clara (ex.: “novo código em core; legacy só manutenção”) ou migrar um módulo por vez e documentar no `CLAUDE.md`.

### 3.2 Duplicação env / config

Há `src/plugins/env.ts` e `src/config/env.ts`; o `app.ts` usa `@config/env.js`. Se o antigo ainda for referenciado em algum lugar, há risco de duas fontes de verdade para variáveis de ambiente. **Recomendação:** manter uma única fonte (ex.: `src/config/env.ts`) e remover ou redirecionar o outro.

### 3.3 Frontend fora do CI

O CI atual (`.github/workflows/ci.yml`) roda apenas no root: lint e build são do backend. O frontend vive em `frontend/` e não é buildado nem testado no pipeline. **Risco:** quebras no frontend (ou em integração API ↔ frontend) só aparecem localmente ou em produção. **Recomendação:** adicionar job `frontend` (lint + build) no mesmo workflow.

### 3.4 Testes apenas no backend

O frontend não tem Vitest (ou outro runner) configurado; não há testes de componente, integração ou e2e para a UI. **Risco:** refators e novas features podem regredir sem detecção automática. **Recomendação:** começar com testes de integração (ex.: páginas principais via `buildApp` + `app.inject` ou MSW) e depois alguns testes de componente críticos (formulários, fluxo de anamnese).

### 3.5 Tratamento de erro no frontend

O `apiFetch` já trata 401 (refresh + redirect para login) e corpo de erro genérico. Não há uma camada global de “último recurso” para exibir erro (toast ou banner) em 403/404/500. Cada página trata erro localmente. **Recomendação:** um hook ou wrapper global (ex.: React Query `onError` ou interceptor) para toasts de “Ação não permitida”, “Não encontrado”, “Erro no servidor”, reduzindo duplicação e melhorando consistência.

### 3.6 Acessibilidade (a11y)

Há boas práticas pontuais (labels, `aria-label` em ícones, `role="list"`). Não há verificação sistemática (ex.: axe-core, lint a11y). **Recomendação:** adicionar regras de a11y no ESLint e, em um segundo passo, testes com axe em telas críticas (login, fluxo anamnese, formulários).

### 3.7 Plano vs implementação

O `PLANO_PROXIMAS_FUNCOES.md` diz que “Usuários” e “Tenants” não existem no frontend; na prática, já existem `UsersListPage`, `InviteUserPage` e rotas `/users`, `/users/invite`. O menu “Usuários” já está condicionado a owner/admin. **Recomendação:** atualizar o plano para refletir o estado atual (e o que falta, ex.: lista de tenants e rota `/tenants` só para owner).

---

## 4. Melhorias priorizadas

### 4.1 Crítico (curto prazo)

| # | Melhoria | Onde | Ação resumida |
|---|----------|------|----------------|
| 1 | **Frontend no CI** | `.github/workflows/ci.yml` | Novo job: `cd frontend && npm ci && npm run lint && npm run build`. Opcional: cache de `node_modules`. |
| 2 | **CORS em produção** | Deploy / env | Garantir `CORS_ORIGINS` definido com origens reais (ex.: `https://app.seudominio.com`) e nunca `*` em produção. Documentar em `.env.example` e no README. |
| 3 | **Atualizar plano** | `docs/PLANO_PROXIMAS_FUNCOES.md` | Ajustar tabela “Estado atual”: marcar Usuários (listar + convidar) como existente no frontend; deixar explícito o que falta (ex.: GET /v1/users listagem se ainda não existir, Tenants só owner). |

### 4.2 Alto (médio prazo)

| # | Melhoria | Onde | Ação resumida |
|---|----------|------|----------------|
| 4 | **Rate limit por usuário** | `src/http/middleware/rateLimit.ts` (ou plugin equivalente) | Usar `keyGenerator` que retorne `user:${request.user?.userId}` quando autenticado, senão `ip:${request.ip}`. Evita que um usuário abuse compartilhando IP. |
| 5 | **Erro global no frontend** | `frontend/src` (App ou provider) | Centralizar exibição de erros de API (403, 404, 5xx) em toast ou banner (ex.: React Query global `onError` ou wrapper em torno de `apiFetch`). |
| 6 | **Filtros na auditoria (UI)** | `AuditListPage` + `api/audit` | A API já suporta filtros; expor na UI filtros por ação, entidade e período (e paginação já existente). |
| 7 | **Filtro de sessões** | `SessionsListPage` + backend | Se a API já suportar: filtro por status e/ou template; caso contrário, implementar query params e expor no frontend. |

### 4.3 Médio (backlog)

| # | Melhoria | Onde | Ação resumida |
|---|----------|------|----------------|
| 8 | **Testes no frontend** | `frontend/` | Configurar Vitest (ou React Testing Library); começar por testes de integração das páginas principais e um fluxo crítico (ex.: login → lista de sessões). |
| 9 | **Unificar env no backend** | `src/plugins/env.ts` vs `src/config/env.ts` | Manter apenas `src/config/env.ts` (ou o que o `buildApp` usa); remover ou reexportar o outro e atualizar imports. |
| 10 | **Documentar arquitetura backend** | `CLAUDE.md` ou `docs/` | Explicar quando usar `src/core` (hexagonal) vs `src/modules` (legacy) e roteiro de migração, se houver. |
| 11 | **Export de sessão (PDF/JSON)** | API + frontend | Endpoint (ex.: GET /v1/sessions/:id/export?format=json|pdf) e botão na tela de detalhe/insights para download. |
| 12 | **Dashboard com métricas** | API opcional + `DashboardPage` | Totais do mês (sessões, templates ativos, etc.); pode ser agregado no frontend a partir dos endpoints atuais ou com um endpoint dedicado. |

### 4.4 Melhorias de produto e UX

| # | Melhoria | Onde | Ação resumida |
|---|----------|------|----------------|
| 13 | **Skeletons de loading** | Listas e detalhes (templates, sessões, pacientes, usuários) | Substituir ou complementar spinners por skeletons alinhados ao layout dos cards/tabelas. |
| 14 | **Confirmação em ações destrutivas** | Ex.: remover usuário, encerrar sessão | Modal ou confirm() antes de ações irreversíveis. |
| 15 | **A11y** | Frontend | Regras eslint-plugin-jsx-a11y; em fluxos críticos, rodar axe-core (manual ou em teste). |
| 16 | **Tenants (owner)** | API + frontend | Se ainda não existir: GET /v1/tenants (só owner), rota `/tenants`, lista e formulário “Novo tenant”; item “Tenants” no menu só para owner. |

---

## 5. Resumo executivo

- O projeto está **bem estruturado**, com segurança (JWT, refresh, senha forte, CORS, Helmet, rate limit) e documentação de produto/backlog alinhada.
- **Principais gaps:** frontend fora do CI, ausência de testes no frontend, tratamento de erro não centralizado na UI, e pequena desatualização do plano em relação ao que já está implementado (usuários).
- **Prioridade imediata:** incluir o frontend no CI, reforçar CORS em produção e atualizar o plano. Em seguida: rate limit por usuário, erro global no frontend, filtros de auditoria (e sessões, se a API suportar) e, no backlog, testes de frontend, unificação de env e documentação da arquitetura backend.

---

## 6. Status das melhorias implementadas (após execução)

| # | Melhoria | Status |
|---|----------|--------|
| 1 | Frontend no CI | ✅ Job `frontend` adicionado em `.github/workflows/ci.yml` (lint + build); `test` depende de `lint` e `frontend`. |
| 2 | CORS em produção | ✅ `.env.example` atualizado com comentário e exemplo (incl. localhost:5173). |
| 3 | Atualizar plano | ✅ `docs/PLANO_PROXIMAS_FUNCOES.md`: tabela estado atual e seção Usuários atualizadas; Tenants explícito como pendente. |
| 4 | Rate limit por usuário | ✅ Já existia em `src/http/middleware/rateLimit.ts` (`keyGenerator` com `user:${userId}` ou `ip:`). |
| 5 | Erro global no frontend | ✅ `api/globalErrorHandler.ts` + `apiFetch` exibe toast em 403/404/5xx; `ToastProvider` registra o handler. |
| 6 | Filtros na auditoria (UI) | ✅ Já existiam em `AuditListPage` (ação, entidade, período). |
| 7 | Filtro de sessões | ✅ Backend: GET `/v1/anamnesis/sessions` com `status` e `templateId`. Frontend: filtros de status e template em `SessionsListPage`, paginação com filtros. |
| 10 | Documentar arquitetura backend | ✅ `CLAUDE.md`: seção "Backend: core (hexagonal) vs modules (legacy)" e uso de `@config/env`. |

*Documento gerado com base na análise do repositório (backend + frontend) e nos planos em `docs/` e `PROMPT_MELHORIAS.md`.*
