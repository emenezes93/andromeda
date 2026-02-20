# Prompt: Migração para Arquitetura Hexagonal — Andromeda

## Contexto do Projeto

Você está trabalhando em `/mnt/c/Users/menez/Documents/andromeda`, um backend Fastify + Prisma + PostgreSQL multi-tenant (TypeScript strict, ES Modules). O projeto **já possui um núcleo hexagonal funcional** em `src/core/` cobrindo auth. Sua tarefa é **migrar todos os módulos legados** de `src/modules/` para o mesmo padrão.

## Referência de Padrão (NÃO altere, USE como template)

O módulo `src/core/` (auth) é a referência canônica. Antes de começar, leia obrigatoriamente:

- `src/core/domain/entities/User.ts` — como modelar uma entidade de domínio
- `src/core/application/use-cases/auth/LoginUseCase.ts` — como escrever um use case
- `src/core/ports/repositories/IUserRepository.ts` — como definir um port
- `src/core/infrastructure/repositories/PrismaUserRepository.ts` — como implementar um adapter Prisma
- `src/core/infrastructure/di/Container.ts` — como registrar no container DI
- `src/core/presentation/controllers/AuthController.ts` — como criar um controller HTTP
- `src/bootstrap/app.ts` — onde registrar os novos controllers no app

## Estrutura-Alvo (para cada feature migrada)

```
src/core/
├── domain/entities/
│   └── {Feature}Entity.ts          ← Entidade de domínio pura (sem imports externos)
├── ports/
│   ├── repositories/
│   │   └── I{Feature}Repository.ts ← Interface (contrato), sem implementação
│   └── services/
│       └── I{Feature}Service.ts    ← Interface de serviço externo (se houver)
├── application/use-cases/{feature}/
│   ├── List{Feature}UseCase.ts
│   ├── Create{Feature}UseCase.ts
│   ├── Update{Feature}UseCase.ts
│   └── Delete{Feature}UseCase.ts
├── infrastructure/
│   ├── repositories/
│   │   └── Prisma{Feature}Repository.ts ← implements I{Feature}Repository
│   └── services/
│       └── {Name}Service.ts             ← implements I{Feature}Service
└── presentation/controllers/
    └── {Feature}Controller.ts           ← Adapter HTTP, delega para use cases
```

## Regras Invioláveis de Arquitetura

1. **Domínio não importa NADA externo**: entities em `src/core/domain/` não podem importar Prisma, Fastify, bcrypt, axios, ou qualquer lib de terceiro. Apenas outras entities e `src/shared/errors/`.
2. **Use cases dependem somente de ports**: constructors recebem `I{X}Repository` e `I{X}Service` como interfaces, NUNCA implementações concretas.
3. **Repositories têm `toDomain()` privado**: converte Prisma model → Entity de domínio. O domínio nunca recebe um tipo Prisma.
4. **Controllers são HTTP adapters**: validam input com Zod, delegam para use case, formatam response. ZERO lógica de negócio.
5. **Container é o único lugar de instanciação**: nada é `new`-ado fora do `Container.ts`.
6. **Limpeza**: ao migrar um módulo, remova as rotas legadas de `src/bootstrap/app.ts` e delete o arquivo legado correspondente. Não deixe código morto.

## Ordem de Migração

Execute as fases **nesta ordem**, validando o build TypeScript após cada fase (`npm run build`).

---

## FASE 1 — Users Module

**Legado:** `src/modules/users/routes.ts` e `src/modules/users/schemas.ts`

### 1.1 — Estender `IUserRepository`

Adicione ao `src/core/ports/repositories/IUserRepository.ts`:
```typescript
// Métodos novos (além dos já existentes de auth)
findAll(tenantId: string, opts: { page: number; limit: number }): Promise<{ data: User[]; total: number }>;
findById(id: string, tenantId: string): Promise<User | null>;
create(data: { email: string; passwordHash: string; name: string | null; tenantId: string; role: string }): Promise<User>;
update(id: string, tenantId: string, data: { name?: string; email?: string; passwordHash?: string }): Promise<User>;
softDelete(id: string, tenantId: string): Promise<void>;
```

### 1.2 — Implementar em `PrismaUserRepository`

Implemente os métodos acima em `src/core/infrastructure/repositories/PrismaUserRepository.ts`. Use o `toDomain()` existente para conversão.

### 1.3 — Criar Use Cases em `src/core/application/use-cases/users/`

**`ListUsersUseCase.ts`**
- Request: `{ tenantId: string; page: number; limit: number; requestingUser: { role: string } }`
- Requer role >= `admin`
- Retorna `{ data: User[]; total: number; page: number; limit: number }`

**`GetUserUseCase.ts`**
- Request: `{ id: string; tenantId: string; requestingUser: { role: string } }`
- Requer role >= `admin` ou `id === requestingUser.id`
- Retorna `User | null`

**`CreateUserUseCase.ts`**
- Request: `{ email: string; password: string; name: string | null; tenantId: string; role: string; requestingUser: { role: string } }`
- Requer role >= `admin` para criar admin; `owner` para criar owner
- Usa `IPasswordService` para hash
- Verifica email duplicado (409 Conflict)
- Cria user + membership na mesma operação
- Audita via `IAuditService`
- **Não duplique lógica do RegisterUseCase** — RegisterUseCase é para self-registration; CreateUserUseCase é para criação por admin

**`UpdateUserUseCase.ts`**
- Request: `{ id: string; tenantId: string; data: { name?: string; email?: string; password?: string }; requestingUser: { id: string; role: string } }`
- Requer `admin` ou o próprio usuário
- Audita mudanças

**`DeleteUserUseCase.ts`**
- Request: `{ id: string; tenantId: string; requestingUser: { role: string } }`
- Requer `owner`
- Soft delete
- Audita

### 1.4 — Controller `src/core/presentation/controllers/UserController.ts`

Rotas:
- `GET /v1/users` — lista (admin+)
- `GET /v1/users/:id` — detalhe
- `POST /v1/users` — criar (admin+)
- `PATCH /v1/users/:id` — atualizar
- `DELETE /v1/users/:id` — soft delete (owner)

Siga o padrão do `AuthController`: use `requireTenant(request)` e `requireAuth(request)` do middleware existente.

### 1.5 — Registrar no Container e App

Em `Container.ts`: adicione `listUsersUseCase`, `getUserUseCase`, `createUserUseCase`, `updateUserUseCase`, `deleteUserUseCase`, `userController`.

Em `src/bootstrap/app.ts`:
- Remova `import { usersRoutes }` e `app.register(usersRoutes)`
- Adicione `container.userController.registerRoutes(app)`

**Delete:** `src/modules/users/routes.ts` e `src/modules/users/schemas.ts`

---

## FASE 2 — Tenants Module

**Legado:** `src/modules/tenants/routes.ts` e `src/modules/tenants/schemas.ts`

### 2.1 — Estender `ITenantRepository`

Adicione ao `src/core/ports/repositories/ITenantRepository.ts`:
```typescript
findAll(opts: { page: number; limit: number }): Promise<{ data: Tenant[]; total: number }>;
create(data: { name: string; plan?: string }): Promise<Tenant>;
update(id: string, data: { name?: string; plan?: string; status?: string }): Promise<Tenant>;
suspend(id: string): Promise<Tenant>;
activate(id: string): Promise<Tenant>;
```

### 2.2 — Implementar em `PrismaTenantRepository`

Implemente os métodos usando o `toDomain()` existente.

### 2.3 — Criar Use Cases em `src/core/application/use-cases/tenants/`

**`ListTenantsUseCase.ts`** — somente `owner` global (sem tenantId, acesso a todos os tenants)

**`GetTenantUseCase.ts`** — `admin+` do próprio tenant

**`CreateTenantUseCase.ts`** — `owner` global; verifica nome duplicado (409)

**`UpdateTenantUseCase.ts`** — `owner` global; campos opcionais

**`SuspendTenantUseCase.ts`** / **`ActivateTenantUseCase.ts`** — `owner` global; usa métodos da entidade `Tenant`

### 2.4 — Controller `TenantController.ts`

Rotas:
- `GET /v1/tenants` — owner only
- `GET /v1/tenants/:id` — admin+
- `POST /v1/tenants` — owner only
- `PATCH /v1/tenants/:id` — owner only
- `POST /v1/tenants/:id/suspend` — owner only
- `POST /v1/tenants/:id/activate` — owner only

### 2.5 — Registrar e Limpar

Mesmo padrão da Fase 1. Delete `src/modules/tenants/`.

---

## FASE 3 — Patients Module

**Legado:** `src/modules/patients/routes.ts` e `src/modules/patients/schemas.ts`

### 3.1 — Entidade `src/core/domain/entities/Patient.ts`

```typescript
export class Patient {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly cpf: string | null,
    public readonly birthDate: Date | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  isAdult(): boolean { /* birthDate check */ }

  static create(data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'isAdult'>): Patient { ... }
}
```

### 3.2 — Port `src/core/ports/repositories/IPatientRepository.ts`

```typescript
export interface IPatientRepository {
  findAll(tenantId: string, opts: { page: number; limit: number; search?: string }): Promise<{ data: Patient[]; total: number }>;
  findById(id: string, tenantId: string): Promise<Patient | null>;
  findByCpf(cpf: string, tenantId: string): Promise<Patient | null>;
  create(data: PatientCreateData): Promise<Patient>;
  update(id: string, tenantId: string, data: PatientUpdateData): Promise<Patient>;
  delete(id: string, tenantId: string): Promise<void>;
}
```

### 3.3 — Adapter `PrismaPatientRepository.ts`

Implemente `IPatientRepository` com `toDomain()` privado.

### 3.4 — Use Cases em `src/core/application/use-cases/patients/`

- `ListPatientsUseCase` — practitioner+; suporta search
- `GetPatientUseCase` — practitioner+
- `CreatePatientUseCase` — practitioner+; verifica CPF duplicado por tenant (409)
- `UpdatePatientUseCase` — practitioner+
- `DeletePatientUseCase` — admin+; audita

### 3.5 — Controller e Limpeza

Mesmo padrão. Delete `src/modules/patients/`.

---

## FASE 4 — Anamnesis Templates

**Legado:** `src/modules/anamnesis/templates/routes.ts` e `schemas.ts`

### 4.1 — Entidade `AnamnesisTemplate.ts`

```typescript
export class AnamnesisTemplate {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly schemaJson: unknown, // JSON sem tipagem rígida no domínio
    public readonly isActive: boolean,
    public readonly createdAt: Date,
  ) {}

  activate(): AnamnesisTemplate { return new AnamnesisTemplate(..., true, ...); }
  deactivate(): AnamnesisTemplate { return new AnamnesisTemplate(..., false, ...); }
  hasConditionalLogic(): boolean { /* inspeciona schemaJson */ }
}
```

### 4.2 — Port `ITemplateRepository.ts`

```typescript
findAll(tenantId: string, opts: PaginationOpts): Promise<Paginated<AnamnesisTemplate>>;
findById(id: string, tenantId: string): Promise<AnamnesisTemplate | null>;
create(data: TemplateCreateData): Promise<AnamnesisTemplate>;
update(id: string, tenantId: string, data: TemplateUpdateData): Promise<AnamnesisTemplate>;
delete(id: string, tenantId: string): Promise<void>;
```

### 4.3 — Use Cases em `src/core/application/use-cases/anamnesis/templates/`

- `ListTemplatesUseCase` — viewer+
- `GetTemplateUseCase` — viewer+
- `CreateTemplateUseCase` — admin+; valida schemaJson tem campo `questions` array
- `UpdateTemplateUseCase` — admin+
- `DeleteTemplateUseCase` — admin+

### 4.4 — Controller `TemplateController.ts`

- `GET /v1/anamnesis/templates`
- `GET /v1/anamnesis/templates/:id`
- `POST /v1/anamnesis/templates`
- `PATCH /v1/anamnesis/templates/:id`
- `DELETE /v1/anamnesis/templates/:id`

Delete `src/modules/anamnesis/templates/`.

---

## FASE 5 — Anamnesis Sessions + Engine

**Legado:** `src/modules/anamnesis/sessions/`, `src/modules/anamnesis/engine/`, `src/modules/anamnesis/publicFill/`

Esta é a fase mais complexa. Leia o código legado completo antes de começar.

### 5.1 — Entidades

**`AnamnesisSession.ts`**
```typescript
export class AnamnesisSession {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly templateId: string,
    public readonly patientId: string,
    public readonly status: 'pending' | 'in_progress' | 'completed' | 'abandoned',
    public readonly answers: SessionAnswer[],
    public readonly startedAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly createdAt: Date,
  ) {}

  isCompleted(): boolean { return this.status === 'completed'; }
  isPending(): boolean { return this.status === 'pending'; }
  canReceiveAnswer(): boolean { return this.status === 'in_progress' || this.status === 'pending'; }
  complete(): AnamnesisSession { /* retorna nova instância com status completed + completedAt */ }
  start(): AnamnesisSession { /* status = in_progress, startedAt = now */ }
}
```

**`SessionAnswer.ts`** (value object)
```typescript
export class SessionAnswer {
  constructor(
    public readonly questionId: string,
    public readonly value: unknown,
    public readonly answeredAt: Date,
  ) {}
}
```

### 5.2 — Port `ISessionRepository.ts`

```typescript
findAll(tenantId: string, opts: { patientId?: string; templateId?: string } & PaginationOpts): Promise<Paginated<AnamnesisSession>>;
findById(id: string, tenantId: string): Promise<AnamnesisSession | null>;
findByPublicToken(token: string): Promise<AnamnesisSession | null>;
create(data: SessionCreateData): Promise<AnamnesisSession>;
addAnswer(sessionId: string, answer: SessionAnswer): Promise<AnamnesisSession>;
updateStatus(id: string, status: AnamnesisSession['status']): Promise<AnamnesisSession>;
```

### 5.3 — Port `IQuestionEngine.ts`

```typescript
export interface IQuestionEngine {
  selectNextQuestion(session: AnamnesisSession, template: AnamnesisTemplate): Question | null;
  evaluateConditionals(answers: SessionAnswer[], rules: ConditionalRule[]): boolean;
}
```

### 5.4 — Adapter `ConditionalQuestionEngine.ts`

Migre a lógica de `src/modules/anamnesis/engine/engine.ts` para implementar `IQuestionEngine`. Esta classe não deve depender de Prisma.

### 5.5 — Use Cases em `src/core/application/use-cases/anamnesis/sessions/`

- `CreateSessionUseCase` — cria sessão vinculada a template + patient
- `StartSessionUseCase` — transição para `in_progress`
- `AnswerQuestionUseCase` — adiciona resposta; usa `IQuestionEngine` para validar se a questão é válida no fluxo atual
- `GetNextQuestionUseCase` — usa `IQuestionEngine.selectNextQuestion()`
- `CompleteSessionUseCase` — finaliza a sessão; dispara `IAuditService`
- `GetSessionUseCase` — viewer+
- `ListSessionsUseCase` — practitioner+
- `PublicSubmitAnswerUseCase` — sem auth (usa token público); chama `AnswerQuestionUseCase` internamente

### 5.6 — Controller `SessionController.ts`

- `POST /v1/anamnesis/sessions`
- `GET /v1/anamnesis/sessions`
- `GET /v1/anamnesis/sessions/:id`
- `POST /v1/anamnesis/sessions/:id/start`
- `GET /v1/anamnesis/sessions/:id/next-question`
- `POST /v1/anamnesis/sessions/:id/answers`
- `POST /v1/anamnesis/sessions/:id/complete`
- `POST /v1/public/anamnesis/:token/answers` (sem auth)

Delete `src/modules/anamnesis/`.

---

## FASE 6 — AI / Insights

**Legado:** `src/modules/ai/`

### 6.1 — Entidade `Insight.ts`

```typescript
export class Insight {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly sessionId: string,
    public readonly riskLevel: 'low' | 'medium' | 'high',
    public readonly summary: string,
    public readonly recommendations: string[],
    public readonly flags: string[],
    public readonly mode: 'ruleBased' | 'llmMock' | 'llm',
    public readonly createdAt: Date,
  ) {}

  isHighRisk(): boolean { return this.riskLevel === 'high'; }
  isCached(): boolean { /* verifica se foi gerado de cache */ }
}
```

### 6.2 — Ports

**`IInsightRepository.ts`**
```typescript
findBySessionId(sessionId: string, tenantId: string): Promise<Insight | null>;
create(data: InsightCreateData): Promise<Insight>;
```

**`IInsightGenerator.ts`**
```typescript
export interface IInsightGenerator {
  generate(session: AnamnesisSession, template: AnamnesisTemplate): Promise<InsightData>;
}
```

**`IInsightCache.ts`** (opcional — somente se Redis estiver disponível)
```typescript
export interface IInsightCache {
  get(key: string): Promise<InsightData | null>;
  set(key: string, value: InsightData, ttlSeconds: number): Promise<void>;
}
```

### 6.3 — Adapters

- `RuleBasedInsightGenerator.ts` — migra lógica de `src/modules/ai/rules.ts`
- `LLMMockInsightGenerator.ts` — migra lógica mock de `src/modules/ai/llm-provider.ts`
- `RedisInsightCache.ts` — migra `src/modules/ai/redis-cache.ts`; implementa `IInsightCache`
- `PrismaInsightRepository.ts` — implementa `IInsightRepository`

### 6.4 — Use Case `GenerateInsightsUseCase.ts`

```typescript
// Depende de: ISessionRepository, ITemplateRepository, IInsightRepository, IInsightGenerator, IInsightCache (opcional)
// Lógica:
// 1. Busca session + template por ports
// 2. Verifica idempotência: se já existe Insight para a session, retorna cached
// 3. Tenta IInsightCache.get(cacheKey)
// 4. Se não, chama IInsightGenerator.generate()
// 5. Salva via IInsightRepository.create()
// 6. Salva no cache (se disponível)
// 7. Audita
// 8. Retorna Insight entity
```

### 6.5 — Controller `InsightController.ts`

- `POST /v1/anamnesis/insights` — gera insights para uma session
- `GET /v1/anamnesis/sessions/:sessionId/insights` — busca insights de uma session

Delete `src/modules/ai/`.

---

## FASE 7 — Módulos de Suporte

### 7.1 — Audit Module

**Legado:** `src/modules/audit/routes.ts`

Não há escrita nova (audit já usa `IAuditService`). Apenas migre a **consulta**:

- `ListAuditLogsUseCase.ts` — admin+; filtros por action, entityType, entityId, userId, dateRange
- `IAuditQueryRepository.ts` — port de leitura
- `PrismaAuditQueryRepository.ts`
- `AuditController.ts` — `GET /v1/audit`

Delete `src/modules/audit/`.

### 7.2 — Stats Module

**Legado:** `src/modules/stats/routes.ts`

- `GetStatsUseCase.ts` — owner/admin; agrega dados de sessions, patients, templates
- `IStatsRepository.ts` — port (queries de agregação)
- `PrismaStatsRepository.ts`
- `StatsController.ts` — `GET /v1/stats`

Delete `src/modules/stats/`.

### 7.3 — Goals Module

**Legado:** `src/modules/goals/`

- `GoalEntity.ts`
- `IGoalRepository.ts`
- Use Cases: List, Create, Update, Complete, Delete
- `GoalController.ts`

Delete `src/modules/goals/`.

### 7.4 — Patient Portal Module

**Legado:** `src/modules/patient-portal/`

Este módulo usa autenticação separada (portal token, não JWT de staff). Crie um port dedicado:

- `IPatientPortalAuth.ts` — gera/valida tokens de portal
- Use Cases: `PatientPortalLoginUseCase`, `GetPortalSessionsUseCase`, `PortalAnswerQuestionUseCase`
- `PatientPortalController.ts`

Delete `src/modules/patient-portal/`.

### 7.5 — Training Plans, Executions, Progress Photos

Siga o mesmo padrão (Entity → Port → UseCase → Adapter → Controller). Cada um tem CRUD básico.

Delete `src/modules/training-plans/`, `src/modules/training-executions/`, `src/modules/progress-photos/`.

### 7.6 — Billing Module

**Legado:** `src/modules/billing/`

O billing tem particularidade do webhook Stripe (sem auth, body raw).

- `IPaymentGateway.ts` — port abstrato (não acopla ao Stripe)
- `StripePaymentGateway.ts` — adapter Stripe
- `ISubscriptionRepository.ts`
- Use Cases: `HandleWebhookUseCase`, `GetSubscriptionUseCase`, `CreateCheckoutUseCase`
- `BillingController.ts`

Delete `src/modules/billing/`.

### 7.7 — Scheduled Questionnaires

- `ISchedulerService.ts` — port de agendamento (schedule, cancel, list)
- `NodeSchedulerService.ts` — adapter node-cron/setInterval
- `IScheduledQuestionnaireRepository.ts`
- `ScheduleQuestionnaireUseCase.ts`, `CancelScheduledUseCase.ts`, `RunScheduledJobUseCase.ts`
- `ScheduledQuestionnaireController.ts`

Delete `src/modules/scheduled-questionnaires/`.

---

## FASE 8 — Limpeza Final

Execute após todas as fases anteriores compilarem sem erros.

### 8.1 — Remover `src/plugins/` (diretório legado duplicado)

```
src/plugins/auth.ts         → duplica src/http/middleware/auth.ts
src/plugins/env.ts          → duplica src/config/env.ts
src/plugins/errorHandler.ts → duplica src/http/middleware/errorHandler.ts
src/plugins/prisma.ts       → duplica src/http/plugins/prisma.ts
src/plugins/rateLimit.ts    → duplica src/http/middleware/rateLimit.ts
src/plugins/swagger.ts      → duplica src/http/plugins/swagger.ts
src/plugins/tenant.ts       → duplica src/http/middleware/tenant.ts
```

Verifique que nenhum import em `src/` aponta para `src/plugins/` antes de deletar.

### 8.2 — Remover `src/types/` (duplica `src/shared/types/`)

Verifique imports e substitua por `@shared/types/`.

### 8.3 — Remover `src/shared/utils/audit.ts`

Este helper faz Prisma direto, duplicando `IAuditService`. Todos os usos devem migrar para usar `IAuditService` via DI.

### 8.4 — Remover `src/modules/auth/routes.ts`

A autenticação já está em `src/core/`. Verifique que `two-factor.ts` e `password-policy.ts` foram migrados para core (ou para ports) antes de deletar.

### 8.5 — Verificar `src/bootstrap/app.ts`

No final, o arquivo deve registrar apenas:
```typescript
container.authController.registerRoutes(app);
container.userController.registerRoutes(app);
container.tenantController.registerRoutes(app);
container.patientController.registerRoutes(app);
container.templateController.registerRoutes(app);
container.sessionController.registerRoutes(app);
container.insightController.registerRoutes(app);
container.auditController.registerRoutes(app);
container.statsController.registerRoutes(app);
container.goalController.registerRoutes(app);
container.patientPortalController.registerRoutes(app);
container.billingController.registerRoutes(app);
container.scheduledQuestionnaireController.registerRoutes(app);
container.trainingPlanController.registerRoutes(app);
container.trainingExecutionController.registerRoutes(app);
container.progressPhotoController.registerRoutes(app);
await app.register(healthRoutes); // health não precisa de DI
```

Zero `app.register(legacyRoutes)`.

---

## Critérios de Sucesso por Fase

Após cada fase, **obrigatoriamente** valide:

```bash
npm run build          # TypeScript deve compilar sem erros
npm run lint           # ESLint sem erros
npm run test           # Todos os testes passando
```

E verifique manualmente:
- [ ] Nenhum import de Prisma em `src/core/domain/`
- [ ] Nenhum import de Fastify em `src/core/application/`
- [ ] Nenhum `new` fora do `Container.ts` (exceto value objects simples)
- [ ] Todo novo repository tem método `toDomain()` privado
- [ ] Todo novo controller não contém lógica de negócio

---

## Guia de Import Paths

Use sempre os aliases configurados em `tsconfig.json`:

```typescript
// Domínio
import { User } from '@domain/entities/User.js';

// Ports
import type { IUserRepository } from '@ports/repositories/IUserRepository.js';
import type { IAuditService } from '@ports/services/IAuditService.js';

// Application
import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase.js';

// Infrastructure (somente dentro de infrastructure/)
import { PrismaUserRepository } from '../repositories/PrismaUserRepository.js';

// Presentation
import { AuthController } from '@presentation/controllers/AuthController.js';

// Core (externo)
import { Container } from '@core/infrastructure/di/Container.js';

// Shared
import { NotFoundError } from '@shared/errors/index.js';
import { Guards } from '@shared/utils/rbac.js';
import { requireAuth } from '@http/middleware/auth.js';
import { requireTenant } from '@http/middleware/tenant.js';
import { env } from '@config/env.js';
```

---

## O Que NÃO Fazer

- ❌ Não crie services fora da estrutura de ports/adapters
- ❌ Não coloque lógica de negócio em `routes.ts` — isso é o anti-pattern sendo corrigido
- ❌ Não instancie repositórios ou use cases dentro de controllers — use DI via Container
- ❌ Não misture query HTTP (request.query) em use cases — controllers extraem e passam como parâmetros simples
- ❌ Não crie helpers com Prisma direto fora de `infrastructure/`
- ❌ Não faça um use case chamar outro use case — prefira um use case maior que orquestre os repositórios diretamente
- ❌ Não adicione lógica de retry/cache em use cases — crie ports para isso e adapters separados
- ❌ Não valide input com Zod em use cases — Zod fica exclusivamente no controller (camada de apresentação)

---

## Informações do Ambiente

- Node: `/home/emenezes/.cursor-server/bin/3578107fdf149b00059ddad37048220e41681000/node`
- Build: `npm run build` (tsc)
- Schema Prisma: `prisma/schema.prisma` — não altere durante a migração
- Todos os modelos Prisma que você precisar já existem no schema
- Alias `@` → `./src` no tsconfig; aliases específicos (`@domain`, `@ports`, etc.) também configurados
