# Prompt de Melhorias — Anamnese Inteligente PaaS V2

> **Contexto:** Projeto multi-tenant (Fastify 4 + Prisma 5 + PostgreSQL 16 + TypeScript) para questionários adaptativos de saúde com engine inteligente e insights por IA. Estrutura atual: `src/plugins/`, `src/shared/`, `src/modules/` (health, auth, tenants, users, anamnesis/templates, anamnesis/sessions, anamnesis/engine, ai, audit), `prisma/schema.prisma`, Docker multi-stage.

---

## FASE 1 — Segurança (Prioridade Crítica)

### 1.1 Refresh Token

**Arquivo:** `src/modules/auth/routes.ts`, `prisma/schema.prisma`, `src/plugins/auth.ts`

- Criar model `RefreshToken` no Prisma:
  ```prisma
  model RefreshToken {
    id        String   @id @default(cuid())
    userId    String   @map("user_id")
    tenantId  String   @map("tenant_id")
    token     String   @unique
    expiresAt DateTime @map("expires_at")
    revokedAt DateTime? @map("revoked_at")
    createdAt DateTime @default(now()) @map("created_at")

    user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
    tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

    @@index([token])
    @@index([userId, tenantId])
    @@map("refresh_tokens")
  }
  ```
- Gerar migration: `npx prisma migrate dev --name add_refresh_tokens`
- Reduzir expiração do access token de `7d` para `15m` em `src/modules/auth/routes.ts` (linha 46: `{ expiresIn: '7d' }` → `{ expiresIn: '15m' }`)
- Gerar refresh token como UUID v4 (crypto.randomUUID()), com expiração de 30 dias
- No `POST /v1/auth/login`, retornar `{ token, refreshToken, expiresIn: 900, user }`
- Criar endpoint `POST /v1/auth/refresh`:
  - Recebe `{ refreshToken: string }`
  - Valida que o refresh token existe, não está revogado e não expirou
  - Gera novo access token JWT (15min) e novo refresh token (rotação)
  - Revoga o refresh token anterior (set `revokedAt = now()`)
  - Retorna `{ token, refreshToken, expiresIn: 900 }`
  - Rate limit: 5 req/min
- Criar endpoint `POST /v1/auth/logout`:
  - Revoga o refresh token recebido
  - Retorna `204 No Content`
- Adicionar `/v1/auth/refresh` ao `skipPaths` do auth plugin (não requer JWT válido)
- Adicionar cron job ou cleanup periódico para deletar refresh tokens expirados (> 30 dias):
  - Criar `src/shared/cleanup.ts` com função `cleanupExpiredTokens(prisma)`
  - Executar a cada 24h via `setInterval` no `server.ts` ou via endpoint admin
- Atualizar os schemas OpenAPI em `src/schemas/index.ts` para os novos endpoints e respostas

### 1.2 Complexidade de Senha

**Arquivo:** `src/modules/auth/schemas.ts`

- Atualizar validação Zod do campo `password` em `registerBodySchema` e `loginBodySchema`:
  ```typescript
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos 1 letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter ao menos 1 letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos 1 número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter ao menos 1 caractere especial')
  ```
- Aplicar a mesma validação no `POST /v1/users` (`src/modules/users/schemas.ts`)
- Não alterar o login body validation (login só precisa de `min(1)` — a validação de complexidade é só para criação/alteração)

### 1.3 CORS Restritivo

**Arquivo:** `src/app.ts` (linha 31), `src/plugins/env.ts`

- Adicionar variável de ambiente `CORS_ORIGINS` ao schema do env:
  ```typescript
  CORS_ORIGINS: z.string().default('*'), // comma-separated origins ou '*'
  ```
- Alterar registro do CORS em `app.ts`:
  ```typescript
  const origins = env.CORS_ORIGINS === '*' ? true : env.CORS_ORIGINS.split(',').map(o => o.trim());
  await app.register(cors, { origin: origins, credentials: true });
  ```
- Atualizar `.env.example` com `CORS_ORIGINS=http://localhost:3000,https://app.seudominio.com`
- Atualizar `docker-compose.yml` com `CORS_ORIGINS: ${CORS_ORIGINS:-*}`

### 1.4 Helmet (Headers de Segurança)

**Arquivo:** `package.json`, `src/app.ts`

- Instalar: `npm install @fastify/helmet`
- Registrar em `app.ts` antes do CORS:
  ```typescript
  import helmet from '@fastify/helmet';
  await app.register(helmet, { contentSecurityPolicy: false }); // CSP desabilitado para Swagger UI
  ```

### 1.5 Rate Limit por Usuário

**Arquivo:** `src/plugins/rateLimit.ts`

- Alterar o `keyGenerator` para usar userId quando autenticado:
  ```typescript
  keyGenerator: (request) => {
    const user = (request as any).user;
    return user ? `user:${user.userId}` : `ip:${request.ip ?? 'unknown'}`;
  },
  ```
- Adicionar variáveis de ambiente em `env.ts`:
  ```typescript
  RATE_LIMIT_TEMPLATES: z.coerce.number().default(30),
  RATE_LIMIT_SESSIONS: z.coerce.number().default(30),
  RATE_LIMIT_AI: z.coerce.number().default(10),
  ```
- Aplicar rate limits específicos por rota nos respectivos módulos (config.rateLimit)

---

## FASE 2 — Banco de Dados & Performance

### 2.1 Índices de Performance

**Arquivo:** `prisma/schema.prisma`

Adicionar `@@index` nos models existentes (gerar migration depois):

```prisma
model AnamnesisTemplate {
  // ... campos existentes
  @@index([tenantId, createdAt])
  @@map("anamnesis_templates")
}

model AnamnesisSession {
  // ... campos existentes
  @@index([tenantId, createdAt])
  @@index([tenantId, status])
  @@index([templateId])
  @@map("anamnesis_sessions")
}

model AnamnesisAnswer {
  // ... campos existentes
  @@index([sessionId, createdAt])
  @@index([tenantId])
  @@map("anamnesis_answers")
}

model AiInsight {
  // ... campos existentes
  @@index([tenantId])
  @@map("ai_insights")
}

model AuditLog {
  // ... campos existentes
  @@index([tenantId, createdAt])
  @@index([tenantId, action])
  @@index([tenantId, entity])
  @@index([actorUserId])
  @@map("audit_log")
}

model Membership {
  // ... campos existentes
  @@index([tenantId])
  @@index([userId])
  @@unique([userId, tenantId])
  @@map("memberships")
}

model IdempotencyKey {
  // ... campos existentes
  @@index([createdAt]) // para cleanup de keys expiradas
  @@unique([tenantId, key])
  @@map("idempotency_keys")
}
```

- Gerar migration: `npx prisma migrate dev --name add_performance_indexes`

### 2.2 Soft Delete para Entidades Principais

**Arquivo:** `prisma/schema.prisma`

- Adicionar campo `deletedAt DateTime? @map("deleted_at")` nos models: `Tenant`, `User`, `AnamnesisTemplate`, `AnamnesisSession`
- Criar middleware Prisma em `src/plugins/prisma.ts` para filtrar automaticamente registros deletados:
  ```typescript
  prisma.$use(async (params, next) => {
    if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
      if (['Tenant', 'User', 'AnamnesisTemplate', 'AnamnesisSession'].includes(params.model ?? '')) {
        params.args = params.args ?? {};
        params.args.where = { ...params.args.where, deletedAt: null };
      }
    }
    return next(params);
  });
  ```
- Gerar migration: `npx prisma migrate dev --name add_soft_delete`

### 2.3 Expiração de Idempotency Keys

**Arquivo:** `src/shared/idempotency.ts`, `src/shared/cleanup.ts`

- Na função `withIdempotency`, verificar se a key existente tem mais de 24h — se sim, tratar como expirada e reprocessar
- Em `cleanup.ts`, adicionar limpeza de idempotency keys com mais de 7 dias:
  ```typescript
  export async function cleanupExpiredIdempotencyKeys(prisma: PrismaClient): Promise<number> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await prisma.idempotencyKey.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return result.count;
  }
  ```

---

## FASE 3 — Testes (Cobertura Abrangente)

### 3.1 Infraestrutura de Teste

**Arquivo:** `src/tests/helpers.ts` (novo)

Criar helper de teste reutilizável:
```typescript
import { buildApp } from '../app.js';
import type { FastifyInstance } from 'fastify';

export async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  return app;
}

export async function loginAsOwner(app: FastifyInstance): Promise<{ token: string; tenantId: string }> {
  const res = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { email: 'owner@demo.com', password: 'owner123' },
  });
  const body = JSON.parse(res.body);
  return { token: body.token, tenantId: body.user.tenantId };
}

export function authHeaders(token: string, tenantId: string) {
  return {
    authorization: `Bearer ${token}`,
    'x-tenant-id': tenantId,
    'content-type': 'application/json',
  };
}
```

### 3.2 Testes de Integração — Auth

**Arquivo:** `src/integration/auth.integration.test.ts` (expandir existente)

Adicionar testes para:
- Login com credenciais válidas → retorna token, user, tenantId
- Login com email inexistente → 401
- Login com senha incorreta → 401
- Login com tenant suspenso → 403
- Register com role insuficiente (viewer tenta registrar) → 403
- Register com email duplicado → 400
- Register com senha fraca (sem maiúscula, sem número, etc.) → 400
- Refresh token válido → novo token
- Refresh token expirado → 401
- Refresh token revogado → 401
- Logout → 204 e refresh token invalidado

### 3.3 Testes de Integração — Tenants

**Arquivo:** `src/integration/tenants.integration.test.ts` (novo)

- Criar tenant como owner → 201
- Criar tenant como viewer → 403
- Criar tenant sem auth → 401
- Get tenant existente → 200
- Get tenant de outro tenant → 403/404
- Get tenant inexistente → 404

### 3.4 Testes de Integração — Users

**Arquivo:** `src/integration/users.integration.test.ts` (novo)

- Criar user como owner → 201
- Criar user como practitioner → 403
- Criar user com email duplicado → 400
- Get user existente → 200
- Get user de outro tenant → 404

### 3.5 Testes de Integração — Templates

**Arquivo:** `src/integration/templates.integration.test.ts` (novo)

- Criar template com schemaJson válido → 201
- Criar template com schemaJson inválido (sem questions) → 400/422
- Listar templates com paginação (page=1, limit=5) → 200
- Get template por ID → 200
- Get template inexistente → 404
- Idempotência: POST com mesmo idempotency-key → mesmo resultado

### 3.6 Testes de Integração — Sessions & Answers

**Arquivo:** `src/integration/sessions.integration.test.ts` (novo)

- Criar session com templateId válido → 201
- Criar session com templateId inexistente → 404
- Get session com answers incluídas → 200
- Submit answers com answersJson válido → 201
- Submit answers para session de outro tenant → 403/404
- Idempotência: POST com mesmo idempotency-key → mesmo resultado

### 3.7 Testes de Integração — AI Insights

**Arquivo:** `src/integration/ai.integration.test.ts` (novo)

- Gerar insights para session com answers → 201
- Gerar insights para session sem answers → 422 ou resultado padrão
- Gerar insights duplicados (mesmo session) → 200 (retorna existente)
- Get insights por sessionId → 200
- Get insights de session inexistente → 404

### 3.8 Testes de Integração — Audit

**Arquivo:** `src/integration/audit.integration.test.ts` (novo)

- Listar audit logs como owner → 200
- Listar audit logs como viewer → 403
- Filtrar por action, entity, date range → resultados corretos
- Paginação funciona corretamente

### 3.9 Testes de Integração — Fluxo Completo E2E

**Arquivo:** `src/integration/e2e-flow.integration.test.ts` (novo)

Teste de ponta a ponta que segue o fluxo completo:
1. Login como owner → obtém token
2. Criar template → 201
3. Criar session a partir do template → 201
4. Loop de engine/next-question → submit answer (repetir até `reason: 'completed'`)
5. Gerar insights → 201
6. Verificar insights gerados → risks e recommendations presentes
7. Verificar audit logs → todas ações registradas

### 3.10 Script de Teste

**Arquivo:** `package.json`

Adicionar scripts:
```json
"test:unit": "vitest run --testPathPattern='(test|spec)\\.ts$' --testPathIgnorePatterns='integration'",
"test:integration": "vitest run --testPathPattern='integration'",
"test:coverage": "vitest run --coverage",
"test:e2e": "vitest run --testPathPattern='e2e-flow'"
```

---

## FASE 4 — Serviço de IA Genérico

### 4.1 Regras Configuráveis

**Arquivo:** `src/modules/ai/service.ts` (reescrever), `src/modules/ai/rules.ts` (novo)

O serviço atual de IA em `src/modules/ai/service.ts` tem lógica hardcoded para question IDs específicos (`q1`, `q2`, `q3`, etc.). Precisa ser genérico para funcionar com qualquer template.

Criar `src/modules/ai/rules.ts`:
```typescript
export interface ScoringRule {
  tag: string;                             // tag da questão a avaliar
  questionTypes: ('number' | 'single')[];  // tipos de questão aplicáveis
  scoringFn: (value: unknown, questionType: string) => number | null; // retorna score 0-100 ou null se não aplicável
}

export interface RiskAggregation {
  riskKey: keyof RisksPayload;   // chave no objeto de riscos
  sourceTags: string[];          // tags que alimentam este risco
  aggregation: 'avg' | 'max' | 'min' | 'weighted';
  defaultScore: number;
}

export interface RecommendationRule {
  condition: (risks: RisksPayload) => boolean;
  recommendation: string;
}
```

Reescrever `generateInsightsRuleBased` para:
1. Iterar todas as questões do template e suas tags
2. Para questões do tipo `number`: normalizar o valor para 0-100 baseado em min/max esperados (usar `options` ou range padrão 1-10)
3. Para questões do tipo `single`: mapear a posição da opção selecionada dentro de `options[]` para um score 0-100 (primeira opção = score mais baixo, última = mais alto)
4. Agrupar scores por tag e calcular os riscos
5. Gerar summary e recommendations baseados nos thresholds dos riscos
6. Manter backward compatibility: se `q1`-`q6` existirem com as tags do seed, os resultados devem ser equivalentes

### 4.2 Adicionar Modo LLM Real (Preparação)

**Arquivo:** `src/plugins/env.ts`, `src/modules/ai/service.ts`

- Adicionar ao env schema:
  ```typescript
  AI_MODE: z.enum(['ruleBased', 'llmMock', 'llm']).default('ruleBased'),
  AI_PROVIDER: z.enum(['openai', 'anthropic']).optional(),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
  ```
- Criar `src/modules/ai/llm-provider.ts` com interface:
  ```typescript
  export interface LlmProvider {
    generateInsights(templateJson: TemplateSchemaJson, answers: Record<string, unknown>): Promise<AiInsightPayload>;
  }
  ```
- Implementar adapter para OpenAI ou Anthropic que:
  - Monta prompt com as questões do template e respostas
  - Pede resposta em JSON estruturado com `summary`, `risks`, `recommendations`
  - Valida resposta com Zod antes de retornar
  - Faz retry com backoff exponencial (max 3 tentativas)
  - Timeout de 30s por chamada
- Atualizar `generateInsights` para suportar modo `'llm'`:
  ```typescript
  export async function generateInsights(mode, template, answers) {
    if (mode === 'llm') return await llmProvider.generateInsights(template, answers);
    if (mode === 'llmMock') return generateInsightsLlmMock(template, answers);
    return generateInsightsRuleBased(template, answers);
  }
  ```

---

## FASE 5 — Observabilidade

### 5.1 Logging Estruturado

**Arquivo:** `src/app.ts`, `src/plugins/logger.ts` (novo)

- Criar plugin de logging que adiciona context a todos os logs:
  ```typescript
  fastify.addHook('onRequest', async (request) => {
    request.log = request.log.child({
      tenantId: request.headers['x-tenant-id'],
      userId: (request as any).user?.userId,
      requestId: request.id,
    });
  });
  ```
- Adicionar log de negócio nos pontos críticos:
  - `auth/routes.ts`: log em login success/failure
  - `sessions/routes.ts`: log em session created, answers submitted
  - `ai/routes.ts`: log em insights generated (com duração em ms)
  - `engine/routes.ts`: log em next-question (com reason e completionPercent)

### 5.2 Métricas (Prometheus)

**Arquivo:** `package.json`, `src/plugins/metrics.ts` (novo), `src/modules/metrics/routes.ts` (novo)

- Instalar: `npm install prom-client`
- Criar plugin de métricas:
  ```typescript
  import client from 'prom-client';

  // Métricas padrão do Node.js
  client.collectDefaultMetrics({ prefix: 'anamnese_' });

  // Métricas customizadas
  export const httpRequestDuration = new client.Histogram({
    name: 'anamnese_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  });

  export const httpRequestsTotal = new client.Counter({
    name: 'anamnese_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  export const activeSessionsGauge = new client.Gauge({
    name: 'anamnese_active_sessions',
    help: 'Number of active anamnesis sessions',
    labelNames: ['tenant_id'],
  });

  export const insightGenerationDuration = new client.Histogram({
    name: 'anamnese_insight_generation_seconds',
    help: 'Duration of AI insight generation',
    labelNames: ['mode'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  });
  ```
- Registrar hook `onResponse` para medir duração de requests
- Criar endpoint `GET /metrics` que retorna métricas no formato Prometheus
- Adicionar `/metrics` ao `skipPaths` do auth plugin

### 5.3 Request Tracing

**Arquivo:** `src/app.ts`

- Garantir que `x-request-id` é propagado em todas as respostas:
  ```typescript
  fastify.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });
  ```
- Logar `requestId` em todos os pontos de auditoria e erro
- Adicionar header `x-response-time` com duração em ms

---

## FASE 6 — CI/CD

### 6.1 GitHub Actions — CI

**Arquivo:** `.github/workflows/ci.yml` (novo)

```yaml
name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: anamnese_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/anamnese_test
      JWT_SECRET: test-secret-key-min-32-chars-for-ci-pipeline
      NODE_ENV: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run prisma:seed
      - run: npm run test:coverage
      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npx prisma generate

  docker:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: anamnese-paas:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 6.2 Dockerfile Melhorado

**Arquivo:** `Dockerfile`

Adicionar COPY do prisma schema para que migration possa rodar no container:
```dockerfile
# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# --- Production stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O - http://localhost:3000/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
```

---

## FASE 7 — Melhorias de API & DX

### 7.1 Versionamento de Templates

**Arquivo:** `src/modules/anamnesis/templates/routes.ts`

- Adicionar endpoint `PUT /v1/anamnesis/templates/:id` para criar nova versão:
  - Recebe novo `schemaJson` e/ou `name`
  - Incrementa `version` automaticamente
  - Cria novo registro (não altera o original — imutabilidade)
  - Sessions existentes continuam apontando para a versão antiga
  - Retorna o novo template com version incrementada
- Adicionar endpoint `GET /v1/anamnesis/templates/:id/versions` para listar todas as versões
- Adicionar campo `parentId` (self-relation) ao model `AnamnesisTemplate` para rastrear cadeia de versões:
  ```prisma
  model AnamnesisTemplate {
    // ... campos existentes
    parentId  String? @map("parent_id")
    parent    AnamnesisTemplate?  @relation("TemplateVersions", fields: [parentId], references: [id])
    children  AnamnesisTemplate[] @relation("TemplateVersions")
  }
  ```

### 7.2 Filtros e Busca

**Arquivo:** `src/modules/anamnesis/sessions/routes.ts`, `src/modules/anamnesis/templates/routes.ts`

- `GET /v1/anamnesis/sessions` (novo endpoint — listar sessions):
  - Query params: `status` (in_progress | completed), `templateId`, `subjectId`, `from`, `to`, `page`, `limit`
  - Ordenação por `createdAt DESC`
  - Retorna lista paginada com `{ data, total, page, limit }`
- `GET /v1/anamnesis/templates`:
  - Adicionar query params: `name` (busca parcial ILIKE), `tag` (filtra por tags)

### 7.3 Seed Expandido

**Arquivo:** `prisma/seed.ts`

Expandir o seed para criar um ambiente de desenvolvimento mais completo:
```typescript
// Tenants
const tenants = [
  { name: 'Clínica Demo', status: 'active' },
  { name: 'Clínica Beta', status: 'active' },
];

// Users (por tenant)
const users = [
  { email: 'owner@demo.com', password: 'Owner123!', name: 'Owner Demo', role: 'owner', tenant: 0 },
  { email: 'admin@demo.com', password: 'Admin123!', name: 'Admin Demo', role: 'admin', tenant: 0 },
  { email: 'pract@demo.com', password: 'Pract123!', name: 'Practitioner Demo', role: 'practitioner', tenant: 0 },
  { email: 'viewer@demo.com', password: 'Viewer123!', name: 'Viewer Demo', role: 'viewer', tenant: 0 },
  { email: 'owner@beta.com', password: 'Owner123!', name: 'Owner Beta', role: 'owner', tenant: 1 },
];

// Templates (manter o existente + adicionar outro)
// Template 2: Anamnese esportiva (com questões diferentes para testar genericidade da IA)
```

Manter backward-compatibility: `owner@demo.com / owner123` deve continuar funcionando (upsert)

### 7.4 Paginação Consistente

**Arquivo:** `src/shared/pagination.ts`

- Garantir que todos os endpoints de listagem usam o mesmo formato de resposta:
  ```typescript
  interface PaginatedResponse<T> {
    data: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }
  ```
- Aplicar limites máximos: `limit` não pode exceder 100, default 20

---

## FASE 8 — Validações e Edge Cases

### 8.1 Limites de Tamanho

**Arquivo:** `src/modules/anamnesis/templates/schemas.ts`

- Limitar quantidade máxima de questões por template: 100
- Limitar tamanho de `options[]` por questão: 20 opções
- Limitar tamanho de texto de questão: 500 caracteres
- Limitar `conditionalLogic` rules: 50 regras por template

### 8.2 Validação de Respostas vs Schema

**Arquivo:** `src/modules/anamnesis/sessions/routes.ts`

No endpoint `POST /v1/anamnesis/sessions/:id/answers`:
- Validar que cada questionId em `answersJson` existe no template
- Validar tipos: se questão é `number`, resposta deve ser número; se `single`, resposta deve estar em `options[]`
- Retornar erro 422 com detalhes de qual questão falhou validação
- Ignorar (com warning no log) questões que não são visíveis pela `conditionalLogic`

### 8.3 Status de Session

**Arquivo:** `src/modules/anamnesis/sessions/routes.ts`, `src/modules/anamnesis/engine/routes.ts`

- Impedir submissão de answers em session com `status: 'completed'` → retornar 409 Conflict
- Ao gerar insights, marcar session como `completed` automaticamente
- Adicionar endpoint `PATCH /v1/anamnesis/sessions/:id/complete` para completar manualmente

---

## ORDEM DE EXECUÇÃO RECOMENDADA

```
FASE 1 (Segurança)       → ~2-3 dias
  1.1 Refresh Token
  1.2 Complexidade de Senha
  1.3 CORS Restritivo
  1.4 Helmet
  1.5 Rate Limit por Usuário

FASE 2 (Banco de Dados)  → ~1 dia
  2.1 Índices
  2.2 Soft Delete
  2.3 Expiração de Idempotency Keys

FASE 3 (Testes)          → ~2-3 dias
  3.1–3.9 Toda a suíte de testes
  3.10 Scripts de teste

FASE 4 (IA Genérica)     → ~2 dias
  4.1 Regras Configuráveis
  4.2 Modo LLM Real

FASE 5 (Observabilidade) → ~1 dia
  5.1 Logging Estruturado
  5.2 Métricas Prometheus
  5.3 Request Tracing

FASE 6 (CI/CD)           → ~1 dia
  6.1 GitHub Actions
  6.2 Dockerfile Melhorado

FASE 7 (API & DX)        → ~2 dias
  7.1 Versionamento de Templates
  7.2 Filtros e Busca
  7.3 Seed Expandido
  7.4 Paginação Consistente

FASE 8 (Validações)      → ~1 dia
  8.1 Limites de Tamanho
  8.2 Validação de Respostas
  8.3 Status de Session
```

## REGRAS GERAIS

- **TypeScript strict** — sem `any` explícito, usar tipos corretos
- **Zod** para toda validação de entrada (body, query, params)
- **Padrão ESM** — `import/export`, extensões `.js` nos imports relativos
- **Testes** — cada nova feature deve ter testes unitários e/ou de integração
- **Migrations** — toda alteração de schema via `prisma migrate dev --name descricao`
- **Audit** — toda ação de escrita deve gerar audit log
- **RLS** — toda nova tabela tenant-scoped deve ter política RLS
- **Idempotência** — todo POST de criação deve suportar `idempotency-key`
- **Schemas OpenAPI** — todo novo endpoint deve ter schema registrado em `src/schemas/index.ts`
- **Backward compatibility** — não quebrar endpoints existentes, manter contratos atuais
- **Não instalar dependências desnecessárias** — usar o que já existe no projeto quando possível
