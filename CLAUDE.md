# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant Anamnese Inteligente PaaS API (v2). A Fastify-based Node.js REST API with PostgreSQL, providing adaptive health questionnaires, AI-powered insights, and full audit trails.

## Commands

```bash
# Development
npm run dev              # Start dev server (tsx watch mode)
npm run build            # TypeScript compile to dist/
npm run start            # Production server (node dist/server.js)

# Testing
npm run test             # Run all tests once
npm run test:watch       # Run tests in watch mode
npx vitest run src/shared/rbac.test.ts   # Run a single test file

# Database
npm run prisma:generate     # Generate Prisma client after schema changes
npm run prisma:migrate:dev  # Create/apply dev migration
npm run prisma:migrate      # Deploy migrations (production)
npm run prisma:seed          # Seed demo data (owner@demo.com / owner123)
npm run prisma:studio        # Open Prisma Studio UI

# Code quality
npm run lint             # ESLint on src/
npm run format           # Prettier on src/**/*.ts

# Docker
docker compose up -d     # Start API + PostgreSQL
```

## Architecture

### Entry Points
- `src/server.ts` — Bootstrap, calls `buildApp()` and starts listening
- `src/app.ts` — `buildApp()` factory: registers all plugins, schemas, and module routes

### Plugin System (src/plugins/)
Plugins register in order in `buildApp()`:
1. **env.ts** — Validates environment with Zod, decorates `app.config`
2. **prisma.ts** — Prisma client lifecycle; exposes `setTenantId()`/`clearTenantId()` for RLS
3. **tenant.ts** — Extracts `x-tenant-id` header, calls `setTenantId()` via `onRequest` hook
4. **auth.ts** — JWT verification, decorates `request.user` (skips `/health`, `/ready`, `/v1/auth/login`, `/documentation`)
5. **rateLimit.ts** — Global + auth-specific rate limiting
6. **swagger.ts** — OpenAPI docs at `/documentation`
7. **errorHandler.ts** — Maps AppError/ZodError to structured JSON responses with requestId

### Module Pattern (src/modules/)
Each module follows: `routes.ts` (Fastify route registration) → `service.ts` (business logic) → `schemas.ts` (Zod request/response validation).

Modules: `health`, `auth`, `tenants`, `users`, `anamnesis/templates`, `anamnesis/sessions`, `anamnesis/engine`, `ai`, `audit`, `patients`

### Backend: core (hexagonal) vs modules (legacy)
- **Entry:** `src/bootstrap/app.ts` builds the app; it uses `@config/env`, `@http/*` (plugins/middleware) and registers **both** the hexagonal auth and legacy routes.
- **src/core/** — Arquitetura hexagonal: domain, application (use cases), infrastructure (Prisma, JWT), ports. O **auth** (login, register, refresh, logout) é atendido pelo `AuthController` e use cases. Use para **novo código** de domínio crítico ou quando quiser testabilidade e inversão de dependência.
- **src/modules/** — Rotas Fastify “legacy” (tenants, users, templates, sessions, engine, ai, audit, patients). Use para **manutenção e novas features** que não migraram para core. Novas rotas podem ser adicionadas aqui; migração para core é opcional e incremental.
- **Fonte de env:** usar apenas `src/config/env.ts`; `src/plugins/env.ts` existe mas o app usa `@config/env`.

### Multi-Tenancy via RLS
- Every request includes `x-tenant-id` header
- The tenant plugin sets PostgreSQL session variable `app.tenant_id` via `SET LOCAL`
- RLS policies enforce row-level isolation at the database level
- **Important**: Prisma does NOT auto-inject tenantId — service code must include it in all queries manually

### RBAC
Role hierarchy in `src/shared/rbac.ts`: `owner (4) > admin (3) > practitioner (2) > viewer (1)`. Guards (`requireRole`, `requireOneOfRoles`) check membership role against resource-specific thresholds.

### Adaptive Engine (src/modules/anamnesis/engine/)
Two-phase question selection:
1. **Conditional rules** — `conditionalLogic` in template schema controls show/hide
2. **Heuristic deepening** — Detects critical tags (stress, sleep, food_emotional) and injects follow-up questions when thresholds are met

### AI Insights (src/modules/ai/)
Controlled by `AI_MODE` env var:
- `ruleBased` (default) — Deterministic risk scoring from answer tags
- `llmMock` — Deterministic varied output using answer hash (no external API calls)

### Shared Utilities (src/shared/)
- `errors.ts` — AppError hierarchy (BadRequest, Unauthorized, Forbidden, NotFound, Conflict, UnprocessableEntity)
- `idempotency.ts` — `idempotency-key` header support; SHA256 request hashing; cached responses or 409 on body mismatch
- `audit.ts` — `auditLog()` helper for tracking all write operations
- `pagination.ts` — Zod schema + helpers for paginated list endpoints

## Testing

- Framework: Vitest with `vitest.setup.ts` pre-loading env vars (DATABASE_URL, JWT_SECRET, NODE_ENV=test)
- Unit tests alongside source: `*.test.ts` files in `src/shared/` and `src/modules/`
- Integration tests in `src/integration/` use `buildApp()` + `app.inject()` pattern (no HTTP server needed)
- Path alias: `@` maps to `./src`

## Code Style

- Strict TypeScript (ES2022, NodeNext modules)
- Prettier: single quotes, semicolons, trailing commas (es5), 100 char width
- ESLint: prefix unused vars with `_`, `no-explicit-any` is a warning
- ES Modules (`"type": "module"` in package.json)

## Environment

Copy `.env.example` to `.env`. Key vars: `DATABASE_URL`, `JWT_SECRET` (min 32 chars), `AI_MODE`. See `src/plugins/env.ts` for the full Zod validation schema.
