# Relatório de Arquitetura de QA e Confiabilidade do Sistema

**Gerado em:** 07/03/2026  
**Escopo:** Backend (Node.js/Fastify) + Frontend (React/Vite) — descoberta do sistema, fluxos críticos, análise de riscos, arquitetura de testes e estratégia de cobertura.

---

## 1. Resumo da Arquitetura do Sistema

### 1.1 Stack de Tecnologia

| Camada | Tecnologia |
|--------|------------|
| **Linguagem** | TypeScript (ES2022, NodeNext) |
| **Backend** | Node.js ≥20, Fastify 5.x |
| **Frontend** | React 18, Vite |
| **Banco de dados** | PostgreSQL (Prisma ORM) |
| **Autenticação** | JWT (15 min) + refresh tokens (30 dias), 2FA TOTP opcional |
| **Fila/Cache** | BullMQ + Redis (opcional), fallback com setInterval |
| **Cobrança** | Stripe (opcional) |
| **IA** | OpenAI/Anthropic (opcional), modos rule-based/mock |

### 1.2 Estilo de Arquitetura

- **Backend:** Híbrido — **hexagonal (core)** para auth, usuários, tenants, pacientes, templates, sessões, insights, auditoria, estatísticas, metas e quota; **módulos legados** para health, billing, patient-portal, scheduled-questionnaires, training-plans, training-executions, progress-photos, diet, exercises, alerts.
- **Multi-tenancy:** Header `x-tenant-id` + consultas Prisma sempre filtradas por `tenantId` (RLS via init-rls.sql; a aplicação deve enviar tenantId).
- **RBAC:** Hierarquia de papéis `owner > admin > practitioner > viewer`; uso de `requireRole` / `requireOneOfRoles` e `Guards` nos controllers e rotas legadas.

### 1.3 Grafo de Dependências (alto nível)

```
server.ts
  → buildApp() [app.ts]
      → Plugins: helmet, cors, prisma, tenant, auth, rateLimit, swagger, errorHandler, multipart
      → Container (DI): repositórios, serviços, casos de uso, controllers
      → Rotas de health
      → AuthController, UserController, TenantController, PatientController,
        TemplateController, SessionController, InsightController, AuditController,
        StatsController, GoalController, QuotaController
      → Legado: patients-legacy, billing, patient-portal, scheduled-questionnaires,
        training-plans, training-executions, progress-photos, diet, exercises, alerts
  → startScheduledQuestionnairesJob, startAlertsJob
  → cleanupExpiredTokens (BullMQ ou setInterval)
```

### 1.4 Fronteiras dos Módulos

| Fronteira | Caminho | Descrição |
|-----------|---------|-----------|
| **Bootstrap** | `src/bootstrap/` | `app.ts` (buildApp), `server.ts` (listen, jobs, shutdown) |
| **Domínio core** | `src/core/domain/entities/` | Patient, User, Tenant, AnamnesisSession, etc. |
| **Casos de uso core** | `src/core/application/use-cases/` | Auth, users, tenants, patients, templates, sessions, insights, audit, stats, goals |
| **Portas core** | `src/core/ports/` | Interfaces de repositórios e serviços |
| **Infraestrutura core** | `src/core/infrastructure/` | Repos Prisma, Bcrypt, JWT, geradores de insight, cache, Container DI |
| **Apresentação core** | `src/core/presentation/controllers/` | Controllers HTTP (registerRoutes) |
| **Módulos legados** | `src/modules/` | health, auth (2FA), billing, patient-portal, patients-legacy, progress-photos, diet, exercises, alerts, scheduled-questionnaires, training-plans, training-executions |
| **HTTP** | `src/http/` | Plugins (prisma, swagger), middleware (tenant, auth, rateLimit, errorHandler) |
| **Shared** | `src/shared/` | Erros (hierarquia AppError), utils (rbac, pagination, idempotency, audit, answersHash) |
| **Config** | `src/config/` | env.ts (Zod), planLimits, database |

### 1.5 Interfaces Públicas (pontos de entrada da API)

- **Health:** `GET /health`, `GET /ready`
- **Auth:** `POST /v1/auth/login`, `signup`, `refresh`, `logout`, `register`; rotas 2FA em auth
- **Usuários:** `POST/GET/PATCH/DELETE /v1/users`, patches de role/active
- **Tenants:** `GET/POST /v1/tenants`, `GET/PATCH /v1/tenants/:id`, suspend/activate
- **Pacientes:** `GET/POST/PATCH/DELETE /v1/patients`, import, timeline, hub summary
- **Templates:** `GET/POST/PATCH/DELETE /v1/anamnesis/templates`, seed-default
- **Sessões:** `GET/POST /v1/anamnesis/sessions`, answer, sign, fill-link; preenchimento público em `/v1/public/...`
- **Insights:** `POST /v1/insights/generate`, `GET /v1/insights/session/:sessionId`, batch, by-tenant
- **Auditoria:** `GET /v1/audit/logs`
- **Estatísticas:** `GET /v1/stats/dashboard`, template-report, students-overview, analytics-dashboard
- **Metas:** `GET/POST/PATCH/DELETE /v1/goals`
- **Quota:** `GET /v1/quota`
- **Legado:** billing, patient-portal, scheduled-questionnaires, training-plans, training-executions, progress-photos, diet, exercises, alerts, patients-legacy (evolutions, evolution-report)

### 1.6 Modelos de Dados (Prisma)

Entidades principais: **Tenant**, **User**, **Membership**, **AnamnesisTemplate**, **AnamnesisSession**, **AnamnesisAnswer**, **Patient**, **PatientEvolution**, **PatientGoal**, **AiInsight**, **AuditLog**, **RefreshToken**, **TrainingPlan**, **TrainingExecution**, **ProgressPhoto**, **DietPlan**, **DietEntry**, **Alert**, **PatientNotification**, **Exercise**, **ScheduledQuestionnaire**, **IdempotencyKey**, **PasswordHistory**, **AiUsageMetric**, **AiCostAlert**.

### 1.7 Workers / Jobs em background

- **Questionários agendados:** `startScheduledQuestionnairesJob(app.prisma, app.log)` — cron/BullMQ
- **Alertas:** `startAlertsJob(app.prisma, app.log)`
- **Limpeza:** `cleanupExpiredTokens` — BullMQ (se REDIS_URL) ou setInterval (24h)

---

## 2. Mapeamento dos Fluxos Críticos

| Fluxo | Entrada | Serviços / Casos de Uso | Persistência |
|-------|---------|--------------------------|--------------|
| **Login** | POST /v1/auth/login | LoginUseCase → UserRepo, MembershipRepo, RefreshTokenRepo, PasswordService, TokenService | User, Membership, RefreshToken |
| **Refresh token** | POST /v1/auth/refresh | RefreshTokenUseCase → RefreshTokenRepo, TokenService | RefreshToken |
| **Listar pacientes** | GET /v1/patients | ListPatientsUseCase → PatientRepository | Patient (por tenant) |
| **Criar paciente** | POST /v1/patients | CreatePatientUseCase → PatientRepository, QuotaService, AuditService | Patient, AuditLog |
| **Criar sessão** | POST /v1/anamnesis/sessions | CreateSessionUseCase → SessionRepository, TemplateRepository | AnamnesisSession |
| **Responder pergunta** | POST .../sessions/:id/answer | AnswerQuestionUseCase → SessionRepository, TemplateRepository | AnamnesisAnswer |
| **Gerar insights** | POST /v1/insights/generate | GenerateInsightsUseCase → InsightGenerator (rule/llm/mock), Cache, SessionRepository | AiInsight, AiUsageMetric |
| **Preenchimento público** | GET/POST /v1/public/... | PublicGetSessionByTokenUseCase, PublicSubmitAnswerUseCase, PublicSignSessionUseCase | AnamnesisAnswer, AnamnesisSession |
| **CRUD plano de treino** | /v1/training-plans | módulo training-plans (service + routes) | TrainingPlan |
| **Webhook billing** | POST /v1/billing/webhook | serviço billing (verificação de assinatura Stripe) | Tenant (campos de assinatura) |

---

## 3. Análise Estática de Riscos

### 3.1 Riscos Identificados

| Risco | Local / Área | Mitigação / Observação |
|-------|--------------|-------------------------|
| **tenantId ausente na query** | Qualquer chamada Prisma sem `tenantId` no `where` | Code review; testes de integração que validem isolamento entre tenants |
| **Null/undefined em request.user** | Rotas que usam `requireAuth()` após skipPaths | Middleware de auth define user ou lança; lista de skip é explícita |
| **Validação de entrada fraca** | Algumas rotas legadas usam schema mínimo | Preferir Zod/JSON Schema em todos os bodies/querystrings; adicionar testes de validação |
| **Dados sensíveis em logs** | Log de payloads ou tokens | Evitar log de body/token brutos; audit logs guardam IDs de entidade, não segredos |
| **Bypass de rate limit** | Endpoints de auth têm limite próprio | Plugin rateLimit + config por rota (ex.: RATE_LIMIT_AUTH) |
| **Raw body do webhook Stripe** | Verificação de assinatura exige body bruto | app.ts preserva rawBody para application/json |
| **Códigos de backup 2FA** | Armazenados no DB; devem ser hasheados ou protegidos | Revisar módulo two-factor para armazenamento seguro |
| **Tamanho de upload** | Limite multipart 2MB | Aplicado em app.ts; progress-photos pode precisar de checagens adicionais |

### 3.2 Recomendações

- Incluir testes de integração para **isolamento entre tenants** (ex.: tenant A não pode ler pacientes do tenant B).
- Garantir que todos os endpoints de **criação/atualização** validem entrada com Zod ou JSON Schema e retornem 400/422 para dados inválidos.
- Manter testes de **simulação de falha** (erros de DB, tokens inválidos, payloads malformados).
- Manter testes de **segurança** para bypass de auth, escalação de papel e padrões de injeção.

---

## 4. Arquitetura de Testes

### 4.1 Camadas de Teste

| Camada | Diretório | Objetivo | Dependências |
|--------|-----------|----------|--------------|
| **Unitário** | `tests/unit/` | Domínio, casos de uso, serviços, utils (repos mockados) | Nenhuma (ou mocks leves) |
| **Integração** | `tests/integration/` | Endpoints HTTP + DB real (buildApp, inject) | PostgreSQL, seed |
| **E2E** | `tests/e2e/` | Fluxos completos (opcional; pode sobrepor integração) | DB, app |
| **Funcional** | `tests/functional/` | Comportamento em nível de feature | DB, app |
| **Regressão** | `tests/regression/` | Bugs já corrigidos, lógica complexa | DB, app |
| **Fumaça** | `tests/smoke/` | Boot + rotas críticas + auth + um CRUD | DB, app |
| **Segurança** | `tests/security/` | Bypass de auth, RBAC, injeção, isolamento por tenant | DB, app |
| **Performance** | `tests/performance/` | Tempo de resposta, throughput | DB, app |
| **UAT** | `tests/uat/` | Cenários no estilo aceitação pelo usuário | DB, app |
| **Contratos** | `tests/contracts/` | Contrato da API / conformidade de schema | Opcional (ex.: OpenAPI) |

### 4.2 Estrutura Existente

O repositório já contém:

- `tests/unit/` — entidades, use-cases, serviços, rbac, pagination, idempotency, errors, engine, plan-limits, etc.
- `tests/integration/` — auth, patients, templates, sessions, goals, tenants, users, quota, stats, training, engine, security, role-flows, audit, ai, public-sessions, app, core, flow, progress-photos, patient-notifications.
- `tests/smoke/smoke.test.ts` — health, auth, CRUD (patients, training-plans, templates), formato de resposta.
- `tests/security/training-security.test.ts` — auth obrigatória, token inválido, RBAC, checagens de injeção/XSS para training.
- `tests/regression/training-regression.test.ts`
- `tests/functional/training-functional.test.ts`
- `tests/performance/api-performance.test.ts`
- `tests/e2e/e2e-flow.test.ts`
- `tests/uat/practitioner-uat.test.ts`

**Lacuna preenchida:** `tests/contracts/` foi adicionado para testes de contrato de API/schema.

### 4.3 Runner e Configuração de Testes

- **Runner:** Vitest 4.x
- **Config:** `vitest.config.ts` — globals, ambiente node, setupFiles: `vitest.setup.ts`, include `tests/**/*.test.ts`, cobertura v8 com limites de 75% para linhas/funções/branches/statements.
- **Setup:** `vitest.setup.ts` define `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=test`.
- **Helpers:** `tests/helpers/index.ts` — `createTestApp()`, `loginAsOwner()`, `authHeaders()`, `STRONG_PASSWORD`.

---

## 5. Estratégia de Cobertura

- **Meta:** Cobertura próxima de 100% para lógica de domínio, serviços, controllers, validação e fluxos críticos; ênfase em **cobertura de branches**.
- **No escopo:** Caminhos de sucesso, casos de borda, entradas inválidas, valores de fronteira, condições de erro, 401/403, falhas de integração.
- **Excluído da cobertura:** `server.ts`, migrações Prisma, arquivos de teste.
- **Ferramentas:** Cobertura Vitest com `@vitest/coverage-v8`, reporters: text, json-summary, lcov (SonarQube).

---

## 6. Testes Implementados / Reforçados (Nesta Passagem)

- **Simulação de falha:** `tests/failure-simulation/api-failures.test.ts` — payloads inválidos, 401 (token ausente/inválido), 404 (não encontrado), 422/400 (validação), body JSON inválido, formato de resposta de erro (requestId).
- **Regressão:** `tests/regression/auth-regression.test.ts` (formato de login, refresh, logout, tenant suspenso 403); `tests/regression/tenant-isolation-regression.test.ts` (acesso cross-tenant a paciente retorna 404, lista exclui dados de outro tenant).
- **Segurança:** `tests/security/auth-bypass-and-rbac.test.ts` — endpoints protegidos exigem auth, viewer não pode criar usuários/tenants, viewer pode ler pacientes, tratamento de tenant errado.
- **Contratos:** `tests/contracts/api-contract.test.ts` — resposta de health, formato de resposta do login, formato de lista paginada, formato de resposta de erro (404, 401).
- **Fumaça:** Suite de fumaça existente mantida; CI executa fumaça após integração em `ci.yml`.
- **CI:** Etapa de smoke adicionada ao CI principal após o run de cobertura; scripts `test:contracts` e `test:failure-simulation` adicionados; `test:all` inclui contracts e failure-simulation.

---

## 7. Problemas Encontrados (Resumo)

- Ver **Seção 3** para riscos estáticos (escopo por tenant, validação, logging, upload de arquivo).
- **Corrigido nesta passagem:** Registro duplicado do parser de content type `multipart/form-data`. O módulo progress-photos registrava `@fastify/multipart` nas suas rotas enquanto `bootstrap/app.ts` já o registra globalmente. Isso fazia os testes de integração falharem com `FST_ERR_CTP_ALREADY_PRESENT` quando vários arquivos de teste rodavam. A correção foi remover o `fastify.register(multipart)` redundante de `src/modules/progress-photos/routes.ts` e usar apenas o registro multipart no nível da aplicação.
- Nenhum outro defeito crítico de código foi introduzido; as recomendações são preventivas (testes e validação).

---

## 8. Lacunas Restantes

- **Frontend:** Cobertura unitária/integração para componentes React e cliente de API (o frontend tem seu próprio script de teste; não foi expandido aqui).
- **Contratos:** Suite completa OpenAPI-diff ou de contrato de schema pode ser adicionada em `tests/contracts/`.
- **Performance:** Baseline e SLOs para endpoints principais (ex.: p95) podem ser formalizados em `tests/performance/`.
- **E2E:** Playwright/Cypress opcional para E2E em browser (fora do escopo atual).

---

## 9. Como Executar os Testes

```bash
# Apenas unitários (sem banco)
npm run test:unit

# Integração, fumaça, contratos, simulação de falha, regressão, segurança (exigem PostgreSQL)
npm run prisma:generate
npm run prisma:migrate:dev   # ou migrate deploy
npm run prisma:seed
npm run test:integration
npm run test:smoke
npm run test:contracts
npm run test:failure-simulation
npm run test:regression
npm run test:security

# Todas as camadas de teste do backend (exige banco)
npm run test:all

# Com cobertura (exige banco para integração; cobertura inclui unit + integração quando rodados juntos)
npm run test:coverage
```

---

## 10. Integração CI/CD

- **ci.yml:** Unit → Integração (com cobertura) → SonarQube → Auditoria de segurança → Build (backend + frontend) → Build e scan Docker (Trivy).
- **pr-checks.yml:** Lint, typecheck, testes unitários (sem DB); lint/build do frontend; dependency review; varredura de secrets; título de PR; checagem de migração.
- **Melhorias aplicadas / recomendadas:**
  - Garantir que o **job de integração falhe o pipeline** se os testes falharem (já é o padrão).
  - Smoke executado após o banco de integração estar pronto (no mesmo job que integração).
  - **Limites de cobertura** (75%) aplicados no Vitest; o CI executa `npm run test:coverage` no job de integração.
  - **Paralelo:** Unit e frontend rodam em paralelo nos PR checks; integração roda após unit no CI principal.

---

## 11. Métricas de Qualidade (Acompanhadas)

- **Cobertura:** Provedor Vitest v8; reporters: text, json-summary, lcov (SonarQube). Limites em `vitest.config.ts`: linhas, funções, branches, statements em 75%.
- **Execução:** Testes unitários ~1–2s; integração/fumaça/segurança/regressão/contratos/simulação de falha exigem DB e rodam no CI com serviço PostgreSQL.
- **CI:** Testes unitários e typecheck em todo PR (sem DB); suite completa + cobertura + smoke no push para main (com DB). Build falha se os testes falharem.

---

*Fim do Relatório de Arquitetura de QA e Confiabilidade.*
