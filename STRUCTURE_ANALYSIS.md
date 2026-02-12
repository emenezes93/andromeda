# Análise e Proposta de Reorganização da Estrutura

## 📊 Situação Atual

### Estrutura Atual (Misturada)

```
src/
├── app.ts                    # Bootstrap
├── server.ts                 # Entry point
│
├── plugins/                  # Plugins Fastify (infraestrutura HTTP)
│   ├── env.ts
│   ├── prisma.ts
│   ├── tenant.ts
│   ├── auth.ts
│   ├── rateLimit.ts
│   ├── swagger.ts
│   └── errorHandler.ts
│
├── modules/                  # Estrutura antiga (legacy)
│   ├── health/
│   ├── auth/
│   ├── tenants/
│   ├── users/
│   ├── anamnesis/
│   │   ├── templates/
│   │   ├── sessions/
│   │   └── engine/
│   ├── ai/
│   └── audit/
│
├── domain/                    # Nova estrutura hexagonal
│   └── entities/
│
├── application/               # Nova estrutura hexagonal
│   └── use-cases/
│
├── ports/                     # Nova estrutura hexagonal
│   ├── repositories/
│   └── services/
│
├── infrastructure/            # Nova estrutura hexagonal
│   ├── repositories/
│   ├── services/
│   └── di/
│
├── presentation/              # Nova estrutura hexagonal
│   └── controllers/
│
├── shared/                    # Utilitários misturados
│   ├── errors.ts
│   ├── rbac.ts
│   ├── idempotency.ts
│   ├── pagination.ts
│   ├── audit.ts
│   ├── types.ts
│   └── cleanup.ts
│
├── schemas/                   # Schemas de validação
│   └── index.ts
│
└── integration/               # Testes de integração
    └── *.test.ts
```

### Problemas Identificados

1. ❌ **Duplicação**: Estrutura antiga (`modules/`) e nova (`core/`) coexistindo
2. ❌ **Plugins misturados**: Plugins HTTP misturados com lógica de aplicação
3. ❌ **Shared confuso**: Utilitários, tipos e lógica de domínio misturados
4. ❌ **Testes espalhados**: Testes em múltiplos lugares
5. ❌ **Falta de organização por contexto**: Não há agrupamento claro por bounded context
6. ❌ **Schemas desorganizados**: Schemas espalhados em `modules/` e `schemas/`

## 🎯 Estrutura Proposta (Organizada)

```
src/
├── bootstrap/                 # ✅ Inicialização da aplicação
│   ├── app.ts                # Factory do Fastify
│   └── server.ts              # Entry point
│
├── config/                    # ✅ Configurações centralizadas
│   ├── env.ts                 # Validação de env vars
│   └── database.ts           # Config do Prisma
│
├── core/                     # ✅ Arquitetura Hexagonal (núcleo)
│   ├── domain/               # Domínio puro
│   │   ├── entities/         # Entidades agrupadas por contexto
│   │   │   ├── auth/
│   │   │   │   ├── User.ts
│   │   │   │   ├── Membership.ts
│   │   │   │   └── RefreshToken.ts
│   │   │   ├── tenant/
│   │   │   │   └── Tenant.ts
│   │   │   └── anamnesis/
│   │   │       ├── Template.ts
│   │   │       ├── Session.ts
│   │   │       └── Answer.ts
│   │   └── value-objects/    # Value Objects
│   │       └── AuthToken.ts
│   │
│   ├── application/          # Casos de uso
│   │   └── use-cases/
│   │       ├── auth/
│   │       ├── tenant/
│   │       └── anamnesis/
│   │
│   ├── ports/                # Interfaces (contratos)
│   │   ├── repositories/
│   │   └── services/
│   │
│   ├── infrastructure/       # Implementações
│   │   ├── database/
│   │   │   └── prisma/
│   │   │       └── repositories/
│   │   ├── services/
│   │   └── di/
│   │
│   └── presentation/         # Controllers HTTP
│       └── controllers/
│
├── http/                     # ✅ Camada HTTP (Fastify)
│   ├── middleware/           # Middlewares
│   │   ├── auth.ts
│   │   ├── tenant.ts
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts
│   ├── plugins/              # Plugins Fastify
│   │   ├── swagger.ts
│   │   └── prisma.ts
│   └── routes/               # Rotas legacy (durante migração)
│       └── health.ts
│
├── shared/                   # ✅ Utilitários compartilhados
│   ├── errors/               # Erros customizados
│   │   ├── AppError.ts
│   │   └── index.ts
│   ├── utils/               # Funções utilitárias
│   │   ├── rbac.ts
│   │   ├── idempotency.ts
│   │   ├── pagination.ts
│   │   ├── audit.ts
│   │   └── cleanup.ts
│   └── types/               # Tipos TypeScript
│       └── index.ts
│
└── schemas/                  # ✅ Schemas de validação HTTP
    └── index.ts
```

## 🔄 Plano de Migração Incremental

### Fase 1: Preparação (Não quebra nada)

1. ✅ Criar estrutura de diretórios
2. ✅ Adicionar path aliases no tsconfig
3. ✅ Criar arquivos index.ts para exports

### Fase 2: Reorganizar Configurações

1. Mover `plugins/env.ts` → `config/env.ts`
2. Criar `config/database.ts`
3. Atualizar imports

### Fase 3: Reorganizar HTTP Layer

1. Mover plugins para `http/plugins/`
2. Mover middlewares para `http/middleware/`
3. Atualizar imports

### Fase 4: Reorganizar Shared

1. Criar `shared/errors/`
2. Criar `shared/utils/`
3. Criar `shared/types/`
4. Mover arquivos e atualizar imports

### Fase 5: Reorganizar Core

1. Mover arquitetura hexagonal para `core/`
2. Agrupar entidades por contexto
3. Atualizar imports

### Fase 6: Reorganizar Bootstrap

1. Mover `app.ts` e `server.ts` para `bootstrap/`
2. Atualizar imports

### Fase 7: Reorganizar Testes

1. Criar `tests/unit/`
2. Criar `tests/integration/`
3. Mover testes
4. Atualizar configuração do Vitest

## 📋 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Bootstrap** | `src/app.ts`, `src/server.ts` | `src/bootstrap/` |
| **Config** | `src/plugins/env.ts` | `src/config/` |
| **HTTP** | `src/plugins/` misturado | `src/http/` organizado |
| **Core** | `src/domain/`, `src/application/` | `src/core/` agrupado |
| **Shared** | `src/shared/*.ts` plano | `src/shared/{errors,utils,types}/` |
| **Testes** | Espalhados | `tests/` organizado |
| **Schemas** | `src/modules/**/schemas.ts` | `src/schemas/` centralizado |

## ✅ Benefícios da Nova Estrutura

1. **Clareza**: Cada diretório tem propósito claro
2. **Organização**: Agrupamento lógico por responsabilidade
3. **Escalabilidade**: Fácil adicionar novos módulos
4. **Manutenibilidade**: Código mais fácil de navegar
5. **Testabilidade**: Testes organizados por tipo
6. **Separação de Concerns**: Camadas bem definidas

## 🚀 Próximos Passos

1. Revisar proposta
2. Aprovar estrutura
3. Criar branch de migração
4. Implementar fase por fase
5. Validar após cada fase
6. Atualizar documentação
