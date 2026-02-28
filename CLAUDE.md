# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant Anamnese Inteligente PaaS API (v2). A Fastify-based Node.js REST API with PostgreSQL, providing adaptive health questionnaires, AI-powered insights, and full audit trails. Includes a React 18 + Vite frontend.

## Commands

```bash
# Backend development
npm run dev              # Start dev server (tsx watch mode)
npm run build            # TypeScript compile + resolve path aliases → dist/
npm run start            # Production server (node dist/src/bootstrap/server.js)

# Testing
npm run test             # Run all tests once
npm run test:unit        # Unit tests only — tests/unit/ (no DB required)
npm run test:integration # Integration tests — tests/integration/ (requires DB)
npm run test:coverage    # With coverage report
npm run test:watch       # Watch mode
npx vitest run tests/integration/role-flows.integration.test.ts  # Single test file

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
docker compose up -d     # Start API + PostgreSQL + Frontend

# Frontend (from frontend/)
npm run dev              # Vite dev server on :5173
npm run build            # tsc + vite build
npm run lint             # ESLint (max-warnings 0)
npm run test             # Vitest run
```

## Architecture

### Entry Points
- `src/bootstrap/server.ts` — Startup, cleanup jobs (cron/BullMQ), signal handlers
- `src/bootstrap/app.ts` — `buildApp()` factory: registers all plugins, middleware, and routes (both hexagonal controllers and legacy modules)

### HTTP Layer (src/http/)

**Plugin & middleware registration order in `buildApp()` (order is critical for RLS and auth to work):**
1. `src/http/plugins/prisma.ts` — Prisma client lifecycle; exposes `setTenantId()`/`clearTenantId()` for RLS
2. `src/http/plugins/swagger.ts` — OpenAPI docs at `/documentation`
3. `src/http/middleware/tenant.ts` — Extracts `x-tenant-id` header, calls `setTenantId()` via `onRequest` hook
4. `src/http/middleware/auth.ts` — JWT verification, decorates `request.user`. Skips: `/health`, `/ready`, `/v1/auth/*`, `/v1/patient-portal/*`, `/v1/billing/webhook`, `/v1/public`, `/documentation`
5. `src/http/middleware/rateLimit.ts` — Global (60 req/min) + auth-specific (10 req/min) limits
6. `src/http/middleware/errorHandler.ts` — Maps AppError/ZodError to structured JSON with requestId

### Backend: core (hexagonal) vs modules (legacy)

- **src/core/** — Hexagonal architecture for critical domains. Layers:
  - `domain/entities/` — Pure business objects (no framework deps)
  - `application/use-cases/` — Orchestration; depends only on port interfaces
  - `ports/` — Repository and service interfaces (contracts)
  - `infrastructure/` — Concrete implementations (Prisma repos, JWT, bcrypt, insight generators)
  - `infrastructure/di/Container.ts` — **Dependency injection container**: instantiates all 13+ repos, 10+ services, 15+ use cases, and 11 HTTP controllers. Decorated on Fastify as `app.container`.
  - `presentation/controllers/` — HTTP handlers; each controller's `registerRoutes(app)` registers Fastify routes

  Domains in core: auth, users, tenants, patients, anamnesis (templates + sessions), insights, audit, stats, goals, quota

- **src/modules/** — Legacy Fastify "route → service → schema" modules. Use for maintenance and new features not yet migrated. Migration to core is optional and incremental.

  Modules: `health`, `auth` (legacy), `billing`, `patient-portal`, `patients-legacy` (evolutions), `progress-photos`, `scheduled-questionnaires`, `training-plans`, `training-executions`

- **Env source:** Use only `src/config/env.ts` (never `src/plugins/env.ts`).

### TypeScript Path Aliases

Backend (maps to `./src/`):
```
@core/*         src/core/*
@domain/*       src/core/domain/*
@application/*  src/core/application/*
@ports/*        src/core/ports/*
@infrastructure/* src/core/infrastructure/*
@presentation/* src/core/presentation/*
@shared/*       src/shared/*
@config/*       src/config/*
@http/*         src/http/*
@bootstrap/*    src/bootstrap/*
```
Frontend: `@/*` → `./src/*`

### Multi-Tenancy via RLS
- Every request includes `x-tenant-id` header
- Tenant middleware sets PostgreSQL session variable `app.tenant_id` via `SET LOCAL`
- RLS policies enforce row-level isolation at the database level
- **Important**: Prisma does NOT auto-inject tenantId — all service/repo code must include it in queries manually

### RBAC
Role hierarchy in `src/shared/utils/rbac.ts`: `owner (4) > admin (3) > practitioner (2) > viewer (1)`. Guards (`requireRole`, `requireOneOfRoles`) check membership role against resource-specific thresholds.

### Auth Architecture
- JWT (15 min) + Refresh Token (30 days, stored in DB)
- User email is **global** across tenants; `Membership` model links User → Tenant with role
- JWT payload contains: `userId`, `email`, `tenantId`, `role`
- Optional 2FA (TOTP via speakeasy + backup codes)
- Brute-force protection: `loginAttempts` + `lockedUntil` on User model
- Cleanup jobs remove expired refresh tokens — dual mode: BullMQ/Redis (if `REDIS_URL` set) or `setInterval` fallback

### Adaptive Engine (src/modules/anamnesis/engine/)
Two-phase question selection:
1. **Conditional rules** — `conditionalLogic` in template schema controls show/hide
2. **Heuristic deepening** — Detects critical tags (stress, sleep, food_emotional) and injects follow-up questions when thresholds are met

### AI Insights (src/modules/ai/ and src/core/infrastructure/services/)
Controlled by `AI_MODE` env var; `Container.ts` selects the implementation:
- `ruleBased` (default) — Deterministic risk scoring from answer tags
- `llmMock` — Deterministic varied output using answer hash (no external API calls)
- `llm` — Real OpenAI or Anthropic; requires `AI_PROVIDER` + `AI_API_KEY`; optional fallback provider

Optional Redis caching: `RedisInsightCache` if `REDIS_URL` is set, else `NoopInsightCache`.

### Billing (src/modules/billing/)
Optional Stripe integration; enabled when `STRIPE_SECRET_KEY` is set:
- Stripe webhook verification (`/v1/billing/webhook` skips auth middleware)
- Subscription tiers tracked on `Tenant` model (`stripeCustomerId`, `subscriptionStatus`, `planTier`)
- AI cost alerts: `aiCostLimitUsd` + `aiCostAlertThreshold` on Tenant

### Shared Utilities (src/shared/)
- `errors/AppError.ts` — AppError hierarchy: `BadRequestError (400)`, `UnauthorizedError (401)`, `ForbiddenError (403)`, `NotFoundError (404)`, `ConflictError (409)`, `UnprocessableEntityError (422)`
- `utils/idempotency.ts` — `idempotency-key` header support; SHA256 request hashing; cached responses or 409 on body mismatch
- `utils/audit.ts` — `auditLog()` helper for tracking all write operations
- `utils/pagination.ts` — Zod schema + helpers for paginated list endpoints

## Frontend (frontend/)

### State Management
- **localStorage** — Stores token, refreshToken, user object, tenantId
- **React Query** (`@tanstack/react-query`) — Async state, caching, invalidation for all API calls
- **React Hook Form** — Form state management
- **useTheme** (`hooks/useTheme.ts`) — Dark/light theme switching
- **useUnsavedChanges** (`hooks/useUnsavedChanges.ts`) — Warns before navigating away from dirty forms

### API Client Pattern (frontend/src/api/)
- `client.ts` — Base `apiFetch<T>()`: reads token/tenantId from localStorage, sets headers, auto-refreshes on 401
- One module per domain: `templates.ts`, `sessions.ts`, `patients.ts`, etc. — each re-exports typed `apiFetch` calls
- `globalErrorHandler.ts` — Registers toast notification error handler

### Design System
- CSS design tokens defined in `frontend/src/styles/index.css`, mapped in `frontend/tailwind.config.js`
- **Always use token classes** (e.g., `border-error bg-error-light text-error`) — never raw Tailwind color classes like `red-*`
- Badge variants: `default`, `primary`, `success`, `warning`, `error` — see `frontend/src/components/ui/Badge.tsx`
- `SessionStatusBadge` — `frontend/src/components/ui/SessionStatusBadge.tsx`

### Routing (frontend/src/routes/index.tsx)
React Router v6 with 30+ routes, all lazy-loaded. `ProtectedRoute` enforces auth; `PageLayout` wraps all authenticated pages with sidebar + responsive hamburger. Public routes: `/login`, `/fill/:token`, `/onboarding`.

## Testing

- Framework: Vitest with `vitest.setup.ts` pre-loading env vars (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=test`)
- Unit tests: `tests/unit/` (no DB required)
- Integration tests: `tests/integration/` — use `buildApp()` + `app.inject()` pattern (no HTTP server needed)
- Backend path alias: `@` maps to `./src`

## Code Style

- Strict TypeScript (ES2022, NodeNext modules)
- Prettier: single quotes, semicolons, trailing commas (es5), 100 char width
- ESLint: prefix unused vars with `_`, `no-explicit-any` is a warning
- ES Modules (`"type": "module"` in package.json)

## Environment

Copy `.env.example` to `.env`. Key vars: `DATABASE_URL`, `JWT_SECRET` (min 32 chars), `AI_MODE`. See `src/config/env.ts` for the full Zod validation schema.

Optional vars: `REDIS_URL` (enables BullMQ queue + insight cache), `STRIPE_SECRET_KEY` (enables billing), `AI_API_KEY` + `AI_PROVIDER` (required when `AI_MODE=llm`).

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
