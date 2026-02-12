# Proposta de Reorganização da Estrutura do Repositório

## 📋 Análise da Estrutura Atual

### Problemas Identificados

1. **Duplicação de Estruturas**: Mistura entre estrutura antiga (`modules/`) e nova hexagonal (`domain/`, `application/`, etc.)
2. **Testes Espalhados**: Testes em `integration/`, `shared/`, e dentro de `modules/`
3. **Schemas Desorganizados**: Schemas espalhados em `modules/` e `schemas/`
4. **Shared Confuso**: `shared/` contém utilitários, mas também lógica de domínio (`rbac.ts`, `types.ts`)
5. **Plugins Misturados**: Plugins do Fastify misturados com lógica de aplicação
6. **Falta de Separação por Contexto**: Não há separação clara por bounded contexts

## 🎯 Estrutura Proposta

```
andromeda/
├── .github/                    # GitHub workflows, templates
│   └── workflows/
│
├── docs/                      # Documentação do projeto
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md
│
├── prisma/                    # Schema e migrations do Prisma
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── scripts/                   # Scripts utilitários
│   ├── setup.sh
│   └── migrate.sh
│
├── src/
│   ├── bootstrap/            # Inicialização da aplicação
│   │   ├── app.ts            # Factory do Fastify
│   │   └── server.ts         # Entry point
│   │
│   ├── config/               # Configurações
│   │   ├── env.ts            # Validação de env vars
│   │   ├── database.ts        # Config do banco
│   │   └── swagger.ts        # Config do Swagger
│   │
│   ├── core/                 # Núcleo da aplicação (Hexagonal)
│   │   ├── domain/           # Camada de Domínio
│   │   │   ├── entities/     # Entidades de negócio
│   │   │   │   ├── auth/
│   │   │   │   │   ├── User.ts
│   │   │   │   │   ├── Membership.ts
│   │   │   │   │   └── RefreshToken.ts
│   │   │   │   ├── tenant/
│   │   │   │   │   └── Tenant.ts
│   │   │   │   ├── anamnesis/
│   │   │   │   │   ├── Template.ts
│   │   │   │   │   ├── Session.ts
│   │   │   │   │   └── Answer.ts
│   │   │   │   └── ai/
│   │   │   │       └── Insight.ts
│   │   │   ├── value-objects/ # Value Objects
│   │   │   │   ├── AuthToken.ts
│   │   │   │   └── Email.ts
│   │   │   └── exceptions/    # Exceções de domínio
│   │   │       └── DomainException.ts
│   │   │
│   │   ├── application/      # Camada de Aplicação
│   │   │   ├── use-cases/    # Casos de uso
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginUseCase.ts
│   │   │   │   │   ├── RegisterUseCase.ts
│   │   │   │   │   └── RefreshTokenUseCase.ts
│   │   │   │   ├── tenant/
│   │   │   │   ├── template/
│   │   │   │   ├── session/
│   │   │   │   └── ai/
│   │   │   ├── dto/          # Data Transfer Objects
│   │   │   │   ├── auth/
│   │   │   │   └── ...
│   │   │   └── mappers/      # Mappers entre camadas
│   │   │
│   │   ├── ports/            # Portas (Interfaces)
│   │   │   ├── repositories/ # Interfaces de repositórios
│   │   │   │   ├── IUserRepository.ts
│   │   │   │   ├── ITemplateRepository.ts
│   │   │   │   └── ...
│   │   │   └── services/     # Interfaces de serviços
│   │   │       ├── IPasswordService.ts
│   │   │       ├── ITokenService.ts
│   │   │       └── IEngineService.ts
│   │   │
│   │   └── infrastructure/   # Camada de Infraestrutura
│   │       ├── database/     # Implementações de DB
│   │       │   ├── prisma/
│   │       │   │   ├── PrismaClient.ts
│   │       │   │   └── repositories/
│   │       │   │       ├── PrismaUserRepository.ts
│   │       │   │       └── ...
│   │       │   └── migrations/
│   │       ├── services/     # Implementações de serviços
│   │       │   ├── BcryptPasswordService.ts
│   │       │   ├── JwtTokenService.ts
│   │       │   └── EngineService.ts
│   │       ├── http/         # Implementações HTTP
│   │       │   ├── middleware/
│   │       │   │   ├── auth.ts
│   │       │   │   ├── tenant.ts
│   │       │   │   └── rateLimit.ts
│   │       │   └── plugins/
│   │       │       ├── swagger.ts
│   │       │       └── errorHandler.ts
│   │       └── di/           # Dependency Injection
│   │           └── Container.ts
│   │
│   └── presentation/         # Camada de Apresentação
│       ├── http/             # Controllers HTTP
│       │   ├── controllers/
│       │   │   ├── AuthController.ts
│       │   │   ├── TenantController.ts
│       │   │   └── ...
│       │   ├── routes/       # Rotas (legacy durante migração)
│       │   │   ├── health.ts
│       │   │   └── ...
│       │   └── schemas/       # Schemas de validação HTTP
│       │       ├── auth/
│       │       └── ...
│       │
│       └── cli/              # CLI commands (futuro)
│
│   └── shared/               # Utilitários compartilhados
│       ├── errors/           # Erros customizados
│       │   └── AppError.ts
│       ├── utils/            # Funções utilitárias
│       │   ├── idempotency.ts
│       │   ├── pagination.ts
│       │   └── audit.ts
│       └── types/            # Tipos TypeScript compartilhados
│           └── index.ts
│
├── tests/                    # Testes organizados
│   ├── unit/                 # Testes unitários
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   │
│   ├── integration/          # Testes de integração
│   │   ├── auth.test.ts
│   │   ├── templates.test.ts
│   │   └── ...
│   │
│   ├── e2e/                  # Testes end-to-end
│   │   └── api.test.ts
│   │
│   ├── fixtures/             # Dados de teste
│   │   └── ...
│   │
│   └── helpers/              # Helpers de teste
│       └── testUtils.ts
│
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## 🔄 Plano de Migração

### Fase 1: Reorganização de Estrutura Base (Sem Quebrar Código)

1. **Criar nova estrutura de diretórios**
   - `src/core/` para arquitetura hexagonal
   - `src/bootstrap/` para inicialização
   - `src/config/` para configurações
   - `tests/` para todos os testes

2. **Mover arquivos gradualmente**
   - Mover `domain/` → `core/domain/`
   - Mover `application/` → `core/application/`
   - Mover `infrastructure/` → `core/infrastructure/`
   - Mover `ports/` → `core/ports/`
   - Mover `presentation/` → `core/presentation/`

3. **Reorganizar shared/**
   - `shared/errors.ts` → `shared/errors/AppError.ts`
   - `shared/types.ts` → `shared/types/index.ts`
   - Manter utilitários em `shared/utils/`

### Fase 2: Reorganização por Contexto

1. **Agrupar por bounded context**
   - `domain/entities/auth/` (User, Membership, RefreshToken)
   - `domain/entities/tenant/` (Tenant)
   - `domain/entities/anamnesis/` (Template, Session, Answer)
   - `domain/entities/ai/` (Insight)

2. **Reorganizar use cases por contexto**
   - `application/use-cases/auth/`
   - `application/use-cases/tenant/`
   - `application/use-cases/template/`
   - etc.

### Fase 3: Limpeza e Consolidação

1. **Remover estrutura antiga**
   - Após migração completa, remover `modules/` antigo
   - Consolidar `plugins/` em `infrastructure/http/`

2. **Organizar testes**
   - Mover todos os testes para `tests/`
   - Separar por tipo (unit, integration, e2e)

## 📝 Benefícios da Nova Estrutura

### 1. **Clareza de Responsabilidades**
- Cada camada tem propósito claro
- Separação entre domínio, aplicação, infraestrutura e apresentação

### 2. **Organização por Contexto**
- Entidades agrupadas por bounded context
- Facilita entendimento do domínio

### 3. **Testabilidade**
- Testes organizados por tipo e camada
- Fácil localizar e executar testes específicos

### 4. **Escalabilidade**
- Fácil adicionar novos módulos seguindo o padrão
- Estrutura preparada para crescimento

### 5. **Manutenibilidade**
- Código mais fácil de navegar
- Padrões consistentes em todo projeto

## 🚀 Implementação

### Passo 1: Criar Estrutura Base

```bash
mkdir -p src/core/{domain,application,ports,infrastructure,presentation}
mkdir -p src/bootstrap src/config
mkdir -p tests/{unit,integration,e2e,fixtures,helpers}
mkdir -p docs
```

### Passo 2: Mover Arquivos Existentes

1. Mover arquivos da arquitetura hexagonal para `core/`
2. Atualizar imports
3. Manter compatibilidade com código legado

### Passo 3: Reorganizar por Contexto

1. Agrupar entidades por contexto
2. Reorganizar use cases
3. Atualizar imports

### Passo 4: Consolidar Testes

1. Mover testes para `tests/`
2. Organizar por tipo
3. Atualizar configuração do Vitest

## ⚠️ Considerações

1. **Compatibilidade**: Manter código legado funcionando durante migração
2. **Imports**: Usar path aliases no tsconfig para facilitar
3. **Testes**: Garantir que todos os testes continuem passando
4. **Documentação**: Atualizar README e docs após reorganização

## 📋 Checklist de Migração

- [ ] Criar estrutura de diretórios
- [ ] Mover arquivos de arquitetura hexagonal
- [ ] Atualizar imports
- [ ] Reorganizar por contexto
- [ ] Mover testes
- [ ] Atualizar configurações (tsconfig, vitest)
- [ ] Atualizar documentação
- [ ] Executar testes
- [ ] Validar build
- [ ] Remover código legado (após migração completa)
