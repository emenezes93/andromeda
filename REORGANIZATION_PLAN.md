# Plano de Reorganização - Implementação Prática

## 🎯 Objetivo

Reorganizar a estrutura do repositório seguindo arquitetura hexagonal e melhores práticas, mantendo compatibilidade durante a migração.

## 📦 Estrutura Proposta (Simplificada para Início)

```
src/
├── bootstrap/              # Inicialização
│   ├── app.ts
│   └── server.ts
│
├── config/                  # Configurações
│   ├── env.ts              # (mover de plugins/env.ts)
│   └── database.ts         # (novo)
│
├── core/                   # Arquitetura Hexagonal
│   ├── domain/
│   │   └── entities/      # (já existe, manter)
│   ├── application/
│   │   └── use-cases/      # (já existe, manter)
│   ├── ports/              # (já existe, manter)
│   ├── infrastructure/     # (já existe, manter)
│   └── presentation/       # (já existe, manter)
│
├── http/                   # Camada HTTP (reorganizar)
│   ├── middleware/        # (mover de plugins/)
│   │   ├── auth.ts
│   │   ├── tenant.ts
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts
│   ├── plugins/           # Plugins Fastify específicos
│   │   ├── swagger.ts
│   │   └── prisma.ts
│   └── routes/            # Rotas legacy (durante migração)
│       ├── health.ts
│       └── ...
│
├── shared/                 # Utilitários compartilhados
│   ├── errors/
│   │   └── AppError.ts    # (mover de shared/errors.ts)
│   ├── utils/
│   │   ├── idempotency.ts
│   │   ├── pagination.ts
│   │   ├── audit.ts
│   │   └── rbac.ts
│   └── types/
│       └── index.ts
│
└── schemas/                # Schemas de validação HTTP
    └── index.ts            # (já existe)
```

## 🔄 Migração Passo a Passo

### Etapa 1: Criar Estrutura Base e Path Aliases

1. **Atualizar tsconfig.json** com path aliases:

```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["./src/core/*"],
      "@domain/*": ["./src/core/domain/*"],
      "@application/*": ["./src/core/application/*"],
      "@ports/*": ["./src/core/ports/*"],
      "@infrastructure/*": ["./src/core/infrastructure/*"],
      "@presentation/*": ["./src/core/presentation/*"],
      "@shared/*": ["./src/shared/*"],
      "@config/*": ["./src/config/*"],
      "@http/*": ["./src/http/*"]
    }
  }
}
```

2. **Criar diretórios base**

### Etapa 2: Reorganizar Configurações

- Mover `plugins/env.ts` → `config/env.ts`
- Criar `config/database.ts` para configuração do Prisma

### Etapa 3: Reorganizar HTTP Layer

- Mover `plugins/auth.ts` → `http/middleware/auth.ts`
- Mover `plugins/tenant.ts` → `http/middleware/tenant.ts`
- Mover `plugins/rateLimit.ts` → `http/middleware/rateLimit.ts`
- Mover `plugins/errorHandler.ts` → `http/middleware/errorHandler.ts`
- Mover `plugins/swagger.ts` → `http/plugins/swagger.ts`
- Mover `plugins/prisma.ts` → `http/plugins/prisma.ts`

### Etapa 4: Reorganizar Shared

- Mover `shared/errors.ts` → `shared/errors/AppError.ts`
- Criar `shared/errors/index.ts` para exports
- Manter `shared/utils/` para utilitários
- Mover `shared/rbac.ts` → `shared/utils/rbac.ts`
- Mover `shared/idempotency.ts` → `shared/utils/idempotency.ts`
- Mover `shared/pagination.ts` → `shared/utils/pagination.ts`
- Mover `shared/audit.ts` → `shared/utils/audit.ts`
- Mover `shared/types.ts` → `shared/types/index.ts`

### Etapa 5: Reorganizar Core (Arquitetura Hexagonal)

- Mover `domain/` → `core/domain/`
- Mover `application/` → `core/application/`
- Mover `ports/` → `core/ports/`
- Mover `infrastructure/` → `core/infrastructure/`
- Mover `presentation/` → `core/presentation/`

### Etapa 6: Reorganizar Bootstrap

- Mover `app.ts` → `bootstrap/app.ts`
- Mover `server.ts` → `bootstrap/server.ts`

### Etapa 7: Reorganizar Schemas

- Manter `schemas/` na raiz de `src/` (ou mover para `http/schemas/`)
- Consolidar schemas de `modules/` em `schemas/`

### Etapa 8: Reorganizar Testes

- Criar `tests/unit/` para testes unitários
- Criar `tests/integration/` para testes de integração
- Mover testes de `src/integration/` → `tests/integration/`
- Mover testes de `src/shared/*.test.ts` → `tests/unit/`
- Mover testes de `src/modules/**/*.test.ts` → `tests/unit/`

## 📝 Arquivos a Criar/Modificar

### 1. tsconfig.json - Adicionar Path Aliases

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@core/*": ["./src/core/*"],
      "@domain/*": ["./src/core/domain/*"],
      "@application/*": ["./src/core/application/*"],
      "@ports/*": ["./src/core/ports/*"],
      "@infrastructure/*": ["./src/core/infrastructure/*"],
      "@presentation/*": ["./src/core/presentation/*"],
      "@shared/*": ["./src/shared/*"],
      "@config/*": ["./src/config/*"],
      "@http/*": ["./src/http/*"]
    }
  }
}
```

### 2. vitest.config.ts - Atualizar Paths

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@core': path.resolve(__dirname, './src/core'),
    '@domain': path.resolve(__dirname, './src/core/domain'),
    '@application': path.resolve(__dirname, './src/core/application'),
    '@ports': path.resolve(__dirname, './src/core/ports'),
    '@infrastructure': path.resolve(__dirname, './src/core/infrastructure'),
    '@presentation': path.resolve(__dirname, './src/core/presentation'),
    '@shared': path.resolve(__dirname, './src/shared'),
    '@config': path.resolve(__dirname, './src/config'),
    '@http': path.resolve(__dirname, './src/http'),
  },
}
```

### 3. Criar shared/errors/index.ts

```typescript
export * from './AppError.js';
```

### 4. Criar shared/utils/index.ts

```typescript
export * from './rbac.js';
export * from './idempotency.js';
export * from './pagination.js';
export * from './audit.js';
```

## ✅ Ordem de Execução Recomendada

1. **Criar estrutura de diretórios** (sem mover arquivos ainda)
2. **Adicionar path aliases** no tsconfig e vitest
3. **Mover configurações** (config/)
4. **Mover shared** (reorganizar)
5. **Mover HTTP layer** (middleware, plugins)
6. **Mover core** (domain, application, etc.)
7. **Mover bootstrap**
8. **Atualizar imports** gradualmente
9. **Mover testes**
10. **Validar tudo funciona**

## 🚨 Importante

- Fazer uma branch para a reorganização
- Fazer commits pequenos e incrementais
- Testar após cada etapa
- Manter compatibilidade com código legado durante migração
- Atualizar documentação conforme avança
