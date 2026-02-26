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
npm run test:unit        # Unit tests only (no DB required)
npm run test:integration # Integration tests (requires DB)
npm run test:coverage    # With coverage report
npm run test:watch       # Watch mode
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
- **src/core/** — Hexagonal architecture: domain, application (use cases), infrastructure (Prisma, JWT), ports. **Auth** (login, register, refresh, logout) is handled by `AuthController` and use cases. Use for **new critical domain code** requiring testability and dependency inversion.
- **src/modules/** — Fastify "legacy" routes (tenants, users, templates, sessions, engine, ai, audit, patients). Use for **maintenance and new features** that haven't migrated to core. Migration to core is optional and incremental.
- **Env source:** use only `src/config/env.ts`; `src/plugins/env.ts` exists but the app uses `@config/env`.

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

Copy `.env.example` to `.env`. Key vars: `DATABASE_URL`, `JWT_SECRET` (min 32 chars), `AI_MODE`. See `src/config/env.ts` for the full Zod validation schema.

## CI/CD

### Workflows

| File | Trigger | Purpose |
|---|---|---|
| `.github/workflows/ci.yml` | push to main | Full test suite + coverage + Docker build |
| `.github/workflows/pr-checks.yml` | PR to main / `workflow_dispatch` | Fast feedback: lint + typecheck + unit tests (parallel, ~2 min) + PR title validation |
| `.github/workflows/release.yml` | tag push | Semantic release |
| `.github/workflows/pages.yml` | push to main | Deploy docs/website to GitHub Pages |
| `.github/dependabot.yml` | weekly (Monday 09h BRT) | Auto-update npm (backend + frontend) and Actions |

### PR Title Convention

All PR titles **must** follow [Conventional Commits](https://www.conventionalcommits.org):
```
feat: add patient export endpoint
fix: resolve RLS bypass on unauthenticated requests
refactor(auth): extract token rotation to use case
chore: bump fastify to 5.3
```
Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

The `pr-title` job in `pr-checks.yml` validates this automatically via `amannn/action-semantic-pull-request@v5`.

### GitHub Templates

- **PR template**: `.github/PULL_REQUEST_TEMPLATE.md` — checklist for tests, lint, migrations, `any` usage
- **Bug report**: `.github/ISSUE_TEMPLATE/bug_report.yml` — structured form with role/tenant/AI_MODE fields
- **Feature request**: `.github/ISSUE_TEMPLATE/feature_request.yml` — form with module selector (core vs modules)

### Known CI Issue

The `frontend-checks` job (lint) is currently failing on Dependabot PRs. This is a pre-existing issue in the frontend ESLint config, not introduced by the pr-checks workflow. Fix the frontend lint before merging Dependabot PRs.
