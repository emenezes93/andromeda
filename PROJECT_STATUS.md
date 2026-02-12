# Status Atual do Projeto — Andromeda

**Data da verificação:** fevereiro 2025

## Resumo

O projeto está com a **reorganização em arquitetura hexagonal concluída** e a **estrutura de pastas e path aliases** em uso. O build TypeScript ainda aponta **erros de tipo e alguns ajustes** a fazer; parte deles foi corrigida nesta verificação.

---

## Estrutura Atual

```
src/
├── bootstrap/          ✅ app.ts, server.ts (entry point)
├── config/             ✅ env.ts, database.ts
├── core/               ✅ Arquitetura hexagonal
│   ├── domain/entities/
│   ├── application/use-cases/auth/
│   ├── ports/repositories e services/
│   ├── infrastructure/repositories, services, di/
│   └── presentation/controllers/
├── http/               ✅ HTTP (plugins + middleware)
│   ├── middleware/     auth, tenant, rateLimit, errorHandler
│   └── plugins/        prisma, swagger
├── modules/            ⚠️ Legacy (health, auth, tenants, users, anamnesis, ai, audit)
├── plugins/            ⚠️ Legacy (duplicados; uso em http/)
├── shared/             ✅ Reorganizado
│   ├── errors/         AppError + index
│   ├── utils/          rbac, idempotency, pagination, audit, cleanup
│   └── types/          types.ts + index
└── schemas/            ✅ Schemas OpenAPI

tests/
├── unit/               ✅ rbac, idempotency, engine, ai-service
├── integration/       ✅ app, auth, engine, flow, + outros
├── e2e/
├── fixtures/
└── helpers/
```

---

## Configurações

| Arquivo | Status | Observação |
|---------|--------|------------|
| `tsconfig.json` | ✅ | Path aliases (@core, @domain, @shared, @config, @http, @bootstrap). `rootDir: "."`, `include`: src + prisma/seed |
| `vitest.config.ts` | ✅ | Aliases alinhados ao tsconfig; testes em `tests/**/*.test.ts` |
| `package.json` | ✅ | `main` ajustado para `dist/bootstrap/server.js`; scripts dev/start apontam para bootstrap |

---

## Correções Aplicadas Nesta Verificação

1. **AuthController**  
   - Import de schemas de auth: de `../../modules/auth/schemas.js` para `../../../modules/auth/schemas.js` (caminho correto a partir de `core/presentation/controllers/`).

2. **Entidades usadas como valor**  
   - Troca de `import type` para `import` onde a classe é usada como valor (ex.: `RefreshToken.create`, `User.create`, `new User()`, etc.):
   - LoginUseCase: `RefreshToken`
   - RefreshTokenUseCase: `RefreshToken`
   - RegisterUseCase: `User`, `Membership`
   - PrismaUserRepository, PrismaMembershipRepository, PrismaTenantRepository, PrismaRefreshTokenRepository: entidades correspondentes
   - JwtTokenService: `AuthToken`

3. **package.json**  
   - `main` atualizado para `dist/bootstrap/server.js`.

---

## Erros de Build Restantes (TypeScript)

Ao rodar `node node_modules/typescript/bin/tsc --noEmit` ainda aparecem:

### 1. Variáveis/parâmetros não usados (TS6133 / TS6196)

- `src/config/database.ts`: `FastifyInstance` importado e não usado.
- `src/http/middleware/auth.ts` e `tenant.ts`: parâmetro `reply` não usado no hook.
- `src/plugins/auth.ts`, `tenant.ts`: mesmo caso.
- `src/modules/ai/service.ts`: parâmetro `template` não usado em uma função.
- `src/shared/idempotency.ts` e `src/shared/utils/idempotency.ts`: `FastifyReply` importado e não usado.

**Sugestão:** remover imports/variáveis não usados ou prefixar com `_` (ex.: `_reply`) conforme regras do projeto.

### 2. Tipos Prisma (JSON)

- `PrismaAuditService`, `shared/audit.ts`, `shared/utils/audit.ts`: `Record<string, unknown>` não atribuível a `InputJsonValue` em campos JSON do Prisma.
- **Sugestão:** usar `as Prisma.InputJsonValue` ou `as object` no que for passado para `metadataJson` (ou equivalente).

### 3. Swagger (fastify-swagger)

- `src/http/plugins/swagger.ts` e `src/plugins/swagger.ts`: propriedade `security` não existente no tipo; assinatura do plugin incompatível.
- **Sugestão:** ajustar opções para a versão atual de `@fastify/swagger` ou usar type assertion temporária.

### 4. Conversões de tipo (TemplateSchemaJson)

- `src/modules/ai/routes.ts` e `src/modules/anamnesis/engine/routes.ts`: cast de `schemaJson` (Prisma/JSON) para `TemplateSchemaJson`.
- **Sugestão:** cast via `unknown`: `schemaJson as unknown as TemplateSchemaJson`.

---

## Testes

- **Vitest:** configurado para `tests/**/*.test.ts`.
- **Unit:** `tests/unit/` (rbac, idempotency, engine, ai-service).
- **Integration:** `tests/integration/` (app, auth, engine, flow, ai, audit, sessions, templates, tenants, users).
- **E2E:** `tests/e2e/e2e-flow.test.ts`.

Não foi executado `npm run test` nesta verificação (ambiente pode não ter DB). Recomenda-se rodar localmente após corrigir os erros de tipo.

---

## Duplicação Legacy

Ainda existem duas “camadas” de código:

- **`src/plugins/`** e **`src/http/`**: mesma lógica (env, prisma, auth, tenant, rateLimit, swagger, errorHandler); o app usa `@http/*`.
- **`src/shared/*.ts`** (na raiz) e **`src/shared/errors|utils|types/`**: versões antigas e nova estrutura; o código ativo usa `@shared/errors`, `@shared/utils`, etc.

**Sugestão:** após validar build e testes, remover arquivos em `src/plugins/` e os `*.ts` duplicados na raiz de `src/shared/`.

---

## Checklist Rápido

| Item | Status |
|------|--------|
| Estrutura hexagonal (core/) | ✅ |
| Path aliases | ✅ |
| Bootstrap (app + server) | ✅ |
| Config centralizada | ✅ |
| HTTP em http/ | ✅ |
| Shared reorganizado | ✅ |
| Testes em tests/ | ✅ |
| Import AuthController (schemas) | ✅ Corrigido |
| Entidades como valor (import type → import) | ✅ Corrigido |
| package.json main | ✅ Corrigido |
| Build limpo (tsc) | ❌ Erros restantes acima |
| Lint | Não verificado |
| Testes rodando | Não verificado |

---

## Próximos Passos Recomendados

1. Corrigir variáveis/parâmetros não usados (remover ou `_`).
2. Ajustar tipos JSON (Prisma) em audit e idempotency.
3. Ajustar opções e tipos do Swagger em `http/plugins/swagger.ts` (e remover `plugins/swagger.ts` na limpeza).
4. Usar cast `as unknown as TemplateSchemaJson` onde for necessário em `ai/routes` e `engine/routes`.
5. Rodar `npm run build` e `npm run test` até ficarem verdes.
6. Limpeza: remover `src/plugins/` e arquivos duplicados em `src/shared/` após validação.

Se quiser, posso propor os patches concretos (diffs) para cada um desses itens.
