# Anamnese Inteligente PaaS – V2

Base multi-tenant para o PaaS de Anamnese Adaptativa (Node.js + Fastify + Postgres + Prisma + Docker), com motor de anamnese adaptativa (regras + heurística), insights por IA mock, observabilidade, testes e segurança.

## Stack

- **Node.js 20+** + TypeScript
- **Fastify** (API)
- **PostgreSQL 16** + **Prisma** (migrations + client)
- **Zod** (validação)
- **@fastify/swagger** + **@fastify/swagger-ui** (OpenAPI)
- **Pino** (logs)
- **Docker** + **docker-compose**
- **Vitest** (unit + integration)
- **ESLint** + **Prettier**

## Arquitetura

- **Multi-tenant**: tenant via header `x-tenant-id`. Postgres **Row-Level Security (RLS)** com variável de sessão `app.tenant_id`. Todas as rotas (exceto `/health`, `/ready`, `/v1/auth/login`) exigem `x-tenant-id` + JWT.
- **RBAC**: roles `owner`, `admin`, `practitioner`, `viewer`. Guards por recurso (tenants, templates, sessions, audit).
- **Idempotência**: header `idempotency-key` em POST de criação; mesma key + mesmo body → mesma resposta; mesma key + body diferente → 409.
- **Prisma vs RLS**: o Prisma não define `app.tenant_id` automaticamente. Em toda rota validamos `tenantId` e usamos `where: { tenantId }` nas queries. O RLS no Postgres é camada extra de segurança (migrations `20250204000001_rls`). **Recomendação**: manter sempre validação de tenant na API e RLS no DB.

## Como rodar

### Docker Compose (API + Frontend + DB)

```bash
docker compose up --build
```

- **API:** http://localhost:3000  
- **Frontend:** http://localhost:8080 (SPA; nginx faz proxy para a API)  
- **Postgres:** localhost:5432  

**Primeira vez:** o banco inicia vazio. Para conseguir logar no frontend, aplique as migrations e rode o seed. Ver **[docs/DOCKER_FIRST_RUN.md](docs/DOCKER_FIRST_RUN.md)**. Login demo: `owner@demo.com` / `owner123`.

O frontend fica em um **container separado** (`frontend/`). Ver `frontend/README.md` para desenvolvimento local da SPA.

### Local (dev)

1. Postgres 16 rodando (ex.: Docker ou local).
2. Crie o banco e configure `.env`:

```bash
cp .env.example .env
# Ajuste DATABASE_URL e JWT_SECRET (mín. 32 caracteres)
```

3. Migrations e seed:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

4. Subir a API:

```bash
npm run dev
```

### Scripts npm

| Script | Descrição |
|--------|-----------|
| `npm run dev` | API em modo watch (tsx) |
| `npm run build` | Compila TypeScript → `dist/` |
| `npm run start` | Roda `node dist/bootstrap/server.js` |
| `npm run test` | Vitest (unit + integration) |
| `npm run test:watch` | Vitest em watch |
| `npm run lint` | ESLint em `src/` |
| `npm run format` | Prettier em `src/**/*.ts` |
| `npm run prisma:generate` | Gera Prisma Client |
| `npm run prisma:migrate` | Aplica migrations (`deploy`) |
| `npm run prisma:migrate:dev` | Cria/aplica migrations (dev) |
| `npm run prisma:seed` | Roda seed (tenant + user owner + template) |
| `npm run prisma:studio` | Abre Prisma Studio |

## Fluxo completo (curl)

Assumindo seed rodado (tenant + `owner@demo.com` / `owner123`).

1. **Login** (obter token e tenantId):

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@demo.com","password":"owner123"}'
```

Guarde `token` e `user.tenantId` das respostas.

2. **Criar sessão de anamnese**:

```bash
export TOKEN="<seu-token>"
export TENANT_ID="<tenant-id-do-login>"
export TEMPLATE_ID="<id-do-template-listado ou do seed>"

curl -s -X POST http://localhost:3000/v1/anamnesis/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "{\"templateId\":\"$TEMPLATE_ID\"}"
```

Guarde `id` da sessão.

3. **Próxima pergunta (engine)**:

```bash
export SESSION_ID="<id-da-sessao>"

curl -s -X POST http://localhost:3000/v1/anamnesis/engine/next-question \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"currentAnswers\":{}}"
```

4. **Enviar respostas** (repetir conforme as perguntas):

```bash
curl -s -X POST "http://localhost:3000/v1/anamnesis/sessions/$SESSION_ID/answers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{"answersJson":{"q1":7,"q2":6,"q3":"Às vezes"}}'
```

5. **Insights (IA mock)**:

```bash
curl -s -X POST http://localhost:3000/v1/ai/insights \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -d "{\"sessionId\":\"$SESSION_ID\"}"
```

6. **Listar templates** (para pegar templateId se não tiver):

```bash
curl -s "http://localhost:3000/v1/anamnesis/templates?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```

## Endpoints (resumo)

- **Health**: `GET /health` (sempre 200), `GET /ready` (200 se DB ok, 503 se não).
- **Auth**: `POST /v1/auth/login`, `POST /v1/auth/register` (owner/admin).
- **Tenants**: `POST /v1/tenants`, `GET /v1/tenants/:id`.
- **Users**: `POST /v1/users`, `GET /v1/users/:id`.
- **Templates**: `POST /v1/anamnesis/templates`, `GET /v1/anamnesis/templates/:id`, `GET /v1/anamnesis/templates` (paginação).
- **Sessions**: `POST /v1/anamnesis/sessions`, `GET /v1/anamnesis/sessions/:id`, `POST /v1/anamnesis/sessions/:id/answers`.
- **Engine**: `POST /v1/anamnesis/engine/next-question`.
- **AI**: `POST /v1/ai/insights`, `GET /v1/ai/insights/:sessionId`.
- **Audit**: `GET /v1/audit` (filtros: action, entity, from, to, page, limit).

Documentação OpenAPI: `GET /documentation` e `GET /documentation/json`.

## Testes

```bash
npm run test
```

- **Unit**: engine (`engine.test.ts`), AI service (`service.test.ts`), idempotency (`idempotency.test.ts`), RBAC (`rbac.test.ts`).
- **Integration**: health/ready, login (401 e 200 com seed), rotas protegidas (401 sem auth), engine (404 para sessão inexistente).

Requisito: Postgres acessível com `DATABASE_URL` (ex.: `postgresql://postgres:postgres@localhost:5432/anamnese`). Use `vitest.setup.ts` para definir env de teste se precisar.

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NODE_ENV` | development / production / test | development |
| `PORT` | Porta HTTP | 3000 |
| `HOST` | Host de bind | 0.0.0.0 |
| `DATABASE_URL` | URL do Postgres | postgresql://user:pass@host:5432/db |
| `JWT_SECRET` | Segredo JWT (mín. 32 caracteres) | (obrigatório) |
| `RATE_LIMIT_GLOBAL` | Requisições/min (global) | 60 |
| `RATE_LIMIT_AUTH` | Requisições/min em login | 10 |
| `BODY_LIMIT` | Tamanho máximo do body (bytes) | 1048576 |
| `REQUEST_TIMEOUT` | Timeout da requisição (ms) | 30000 |
| `AI_MODE` | ruleBased \| llmMock | ruleBased |

## Estrutura do projeto

```
src/
  server.ts           # Bootstrap
  app.ts              # buildApp (Fastify + plugins + rotas)
  plugins/            # env, prisma, tenant, auth, rateLimit, swagger, errorHandler
  modules/
    health/
    auth/
    tenants/
    users/
    anamnesis/
      templates/
      sessions/
      engine/         # Motor adaptativo (regras + heurística)
    ai/               # Insights (ruleBased + llmMock)
    audit/
  shared/             # errors, rbac, idempotency, pagination, types, audit
  schemas/            # Registro de schemas OpenAPI (Zod → JSON Schema)
  integration/        # Testes de integração
prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Motor de anamnese (MVP)

- **schema_json** do template: `questions` (id, text, type, options, required, tags), `conditionalLogic` (if answer X then show Y), tags (ex.: sleep, stress, food_emotional).
- **POST /v1/anamnesis/engine/next-question**: recebe `sessionId` e `currentAnswers`; retorna `nextQuestion | null`, `reason`, `completionPercent`.
- Motor: (1) regras determinísticas (condicional); (2) heurística por tags (aprofundar em áreas críticas, ex. stress alto → pergunta extra). Sem APIs externas.

## IA (mock)

- **POST /v1/ai/insights**: body `{ sessionId }`. Busca template + respostas, chama `generateInsights(template, answers)`, persiste em `ai_insights` e retorna.
- **Estratégias**: `ruleBased` (padrão) e `llmMock` (texto variado determinístico por seed). Seleção via `AI_MODE=ruleBased|llmMock`.

## Segurança e trade-offs

- **RLS**: aplicado na migration `20250204000001_rls`. A aplicação deve chamar `set_config('app.tenant_id', tenantId)` por request (feito no plugin tenant quando `x-tenant-id` está presente). Em rotas sem tenant (ex.: login), não setamos; políticas com `OR current_setting(...) = ''` permitem operações necessárias (ex.: insert em audit_log no login).
- **Prisma**: não há middleware global que injete `tenantId` em todos os creates/queries. Todas as rotas validam `tenantId` e incluem `tenantId` no `where`/`data`. RLS no DB é a camada final de isolamento.
