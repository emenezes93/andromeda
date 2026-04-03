# Andromeda — Fit Insight

[![CI](https://github.com/emenezes93/andromeda/actions/workflows/ci.yml/badge.svg)](https://github.com/emenezes93/andromeda/actions/workflows/ci.yml)
[![PR Checks](https://github.com/emenezes93/andromeda/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/emenezes93/andromeda/actions/workflows/pr-checks.yml)
[![Node 20](https://img.shields.io/badge/node-20+-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Plataforma multi-tenant para criação e gestão de questionários de saúde adaptativos com insights de IA.

## Visão Geral

API REST completa construída com Fastify + PostgreSQL (Row-Level Security) para:

- Criar e gerenciar **templates de questionários** de saúde com lógica condicional
- Aplicar **anamneses adaptativas** — o motor seleciona a próxima pergunta em tempo real
- Gerar **insights automáticos** com IA (regras determinísticas ou LLM)
- Gerenciar **pacientes**, evoluções e histórico clínico
- **Auditoria completa** de todas as ações com trilha imutável
- **Multi-tenancy** via RLS — dados isolados por tenant no banco

**Stack:**

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20 + TypeScript (strict) |
| Framework | Fastify 5 + Zod |
| ORM / DB | Prisma + PostgreSQL 16 (RLS) |
| Frontend | React 18 + Vite + TailwindCSS |
| Testes | Vitest (unit + integration) |
| Deploy | Docker Compose |

---

## Início Rápido

### Docker (recomendado)

```bash
git clone https://github.com/emenezes93/andromeda.git
cd andromeda
docker compose up --build -d

# Aplica migrations e seed inicial
docker compose exec api npm run prisma:migrate
docker compose exec api npm run prisma:seed
```

Acesse:
- API: http://localhost:3000
- Frontend: http://localhost:8080
- Documentação OpenAPI: http://localhost:3000/documentation
- Login demo: `owner@demo.com` / `owner123`

### Desenvolvimento Local

**Pré-requisitos:** Node.js 20+ e PostgreSQL 16

```bash
npm install
cp .env.example .env
# Configure DATABASE_URL e JWT_SECRET no .env

npm run prisma:generate    # Gera o Prisma Client
npm run prisma:migrate:dev # Cria e aplica migrations
npm run prisma:seed        # Popula dados demo
npm run dev                # Inicia em modo watch
```

---

## Estrutura do Projeto

```
andromeda/
├── src/
│   ├── bootstrap/          # app.ts — inicialização do Fastify
│   ├── config/             # env.ts — validação Zod das env vars
│   ├── core/               # Arquitetura hexagonal (auth)
│   │   ├── domain/         # Entidades e value objects
│   │   ├── application/    # Use cases
│   │   └── infrastructure/ # Prisma, JWT
│   ├── modules/            # Rotas Fastify (features principais)
│   │   ├── anamnesis/
│   │   │   ├── templates/  # CRUD de templates
│   │   │   ├── sessions/   # Sessões de anamnese
│   │   │   └── engine/     # Motor adaptativo
│   │   ├── ai/             # Geração de insights
│   │   ├── patients/
│   │   ├── users/
│   │   ├── tenants/
│   │   └── audit/
│   ├── plugins/            # Fastify plugins (auth, RLS, rate limit...)
│   └── shared/             # Erros, RBAC, idempotência, paginação
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── frontend/               # React + Vite (container separado)
├── tests/                  # Testes de integração e e2e
├── docs/                   # Documentação complementar
└── .github/
    ├── workflows/          # CI, release, PR checks
    ├── ISSUE_TEMPLATE/     # Bug report e feature request
    └── PULL_REQUEST_TEMPLATE.md
```

---

## Comandos Principais

```bash
# Desenvolvimento
npm run dev              # Servidor em modo watch
npm run dev:worker       # Worker de jobs em modo watch
npm run build            # Compila TypeScript → dist/
npm run start            # Executa versão compilada
npm run start:worker     # Executa o worker compilado

# Banco de Dados
npm run prisma:generate      # Regenera Prisma Client
npm run prisma:migrate:dev   # Cria e aplica migrations (dev)
npm run prisma:migrate       # Aplica migrations (produção)
npm run prisma:seed          # Seed com dados demo
npm run prisma:studio        # UI para inspecionar dados

# Qualidade
npm run lint             # ESLint
npm run format           # Prettier
npm run test             # Todos os testes
npm run test:unit        # Apenas unitários
npm run test:integration # Apenas integração
npm run test:coverage    # Com cobertura
npm run test:watch       # Modo watch

# Docker
docker compose up -d         # Inicia API + Frontend + DB
docker compose logs -f api   # Logs da API
docker compose down          # Para tudo
```

---

## Conceitos Chave

### Multi-Tenancy via RLS

Cada requisição deve incluir o header `x-tenant-id`. O plugin de tenant define a variável de sessão `app.tenant_id` no PostgreSQL via `SET LOCAL`, e as políticas de Row-Level Security garantem isolamento automático.

> O Prisma **não** injeta `tenantId` automaticamente — o código de serviço deve incluí-lo em todas as queries.

### RBAC

Hierarquia: `owner (4) > admin (3) > practitioner (2) > viewer (1)`

Guards: `requireRole` e `requireOneOfRoles` em `src/shared/rbac.ts`.

### Motor Adaptativo

Duas fases na seleção da próxima pergunta:
1. **Regras condicionais** — `conditionalLogic` no schema do template controla exibição
2. **Aprofundamento heurístico** — detecta tags críticas (`stress`, `sleep`, `food_emotional`) e injeta perguntas de acompanhamento

### AI Insights

Controlado pela env var `AI_MODE`:
- `ruleBased` (padrão) — scoring determinístico baseado em tags
- `llmMock` — output variado sem chamadas externas (hash das respostas)
- `llm` — integração real com OpenAI ou Anthropic

### Autenticação

- JWT de acesso (15 min) + Refresh Token (30 dias)
- 2FA via TOTP para owners/admins
- Arquitetura hexagonal em `src/core/` — AuthController + use cases

---

## Variáveis de Ambiente

Copie `.env.example` para `.env`. Principais:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/anamnese
JWT_SECRET=sua-chave-secreta-minimo-32-caracteres
PORT=3000
NODE_ENV=development

AI_MODE=ruleBased        # ruleBased | llmMock | llm
AI_PROVIDER=openai       # openai | anthropic  (quando AI_MODE=llm)
AI_API_KEY=sk-...        # API key              (quando AI_MODE=llm)

RATE_LIMIT_GLOBAL=60     # req/min global
RATE_LIMIT_AUTH=10       # req/min no /auth/login
```

Veja `src/config/env.ts` para o schema completo de validação.

### Operação Web x Worker

Para escalar com segurança, separe processos HTTP e jobs em background:

- `web`: atende API/HTTP e deve rodar com `BACKGROUND_JOBS_ENABLED=false`
- `worker`: executa alertas, scheduler e cleanup e deve rodar com `BACKGROUND_JOBS_ENABLED=true`

Exemplo:

```bash
# API / web
BACKGROUND_JOBS_ENABLED=false npm run start

# Worker / jobs
BACKGROUND_JOBS_ENABLED=true npm run start:worker
```

Em ambiente com múltiplas réplicas web, mantenha apenas o worker com jobs habilitados para evitar duplicidade de processamento.

---

## Endpoints Principais

| Método | Rota | Descrição |
|---|---|---|
| POST | `/v1/auth/login` | Login (JWT + refresh token) |
| POST | `/v1/auth/refresh` | Renova token |
| GET | `/v1/anamnesis/templates` | Lista templates |
| POST | `/v1/anamnesis/templates` | Cria template |
| POST | `/v1/anamnesis/sessions` | Inicia sessão |
| POST | `/v1/anamnesis/engine/next-question` | Próxima pergunta |
| POST | `/v1/ai/insights` | Gera insights |
| GET | `/v1/patients` | Lista pacientes |
| GET | `/v1/audit` | Trilha de auditoria |

Documentação interativa completa: http://localhost:3000/documentation

---

## Problemas Comuns

**`Cannot find module`**
```bash
npm install && npm run prisma:generate
```

**`Database connection failed`**
- Verifique se o PostgreSQL está rodando e o `DATABASE_URL` está correto

**`JWT_SECRET must be at least 32 characters`**
- Configure `JWT_SECRET` no `.env` com no mínimo 32 caracteres

**Migrations não aplicam**
```bash
npm run prisma:migrate:dev
npm run prisma:generate
```

---

## Contribuindo

Pull Requests são bem-vindos. Antes de abrir um PR:

1. Crie uma branch descritiva: `git checkout -b feat/nome-da-feature`
2. Siga a convenção de commits: [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `refactor:`, `chore:`, etc.)
3. O título do PR **deve** seguir o formato Conventional Commits (validado automaticamente)
4. Execute `npm run test`, `npm run lint` e `npx tsc --noEmit` antes de abrir o PR
5. Preencha o template de PR com checklist e screenshots (se UI)

Para reportar bugs ou sugerir features, use os [formulários de issue](.github/ISSUE_TEMPLATE/).

---

## Documentação Adicional

- [ARCHITECTURE.md](ARCHITECTURE.md) — decisões arquiteturais detalhadas
- [CLAUDE.md](CLAUDE.md) — guia para desenvolvimento com Claude Code
- [docs/AI_LLM_SETUP.md](docs/AI_LLM_SETUP.md) — configurar LLM real
- [docs/DOCKER_FIRST_RUN.md](docs/DOCKER_FIRST_RUN.md) — primeira execução com Docker

---

## Licença

MIT
