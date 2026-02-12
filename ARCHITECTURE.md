# Arquitetura Hexagonal (Ports and Adapters)

Este documento descreve a arquitetura hexagonal implementada no projeto Anamnese Inteligente PaaS V2.

## Visão Geral

A arquitetura hexagonal (também conhecida como Ports and Adapters) separa a lógica de negócio da infraestrutura, permitindo que o código seja testável, manutenível e independente de frameworks e bibliotecas externas.

## Estrutura de Diretórios

```
src/
├── domain/              # Camada de Domínio (Núcleo)
│   └── entities/        # Entidades de negócio puras
│
├── application/         # Camada de Aplicação
│   └── use-cases/      # Casos de uso (orquestração de lógica de negócio)
│
├── ports/              # Portas (Interfaces)
│   ├── repositories/   # Interfaces de repositórios
│   └── services/      # Interfaces de serviços externos
│
├── infrastructure/     # Camada de Infraestrutura (Adapters)
│   ├── repositories/   # Implementações de repositórios (Prisma)
│   ├── services/      # Implementações de serviços (JWT, Bcrypt, etc)
│   └── di/            # Container de Injeção de Dependências
│
└── presentation/       # Camada de Apresentação
    └── controllers/   # Controllers HTTP (Fastify)
```

## Camadas

### 1. Domain (Domínio)

**Responsabilidade**: Contém a lógica de negócio pura, sem dependências externas.

**Componentes**:
- **Entities**: Entidades de domínio que encapsulam regras de negócio
  - `User.ts`: Entidade de usuário
  - `Membership.ts`: Relacionamento usuário-tenant com roles
  - `Tenant.ts`: Entidade de tenant
  - `RefreshToken.ts`: Token de refresh com validações

**Características**:
- Sem dependências de frameworks
- Classes puras com métodos de negócio
- Validações e invariantes de domínio

**Exemplo**:
```typescript
export class User {
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
```

### 2. Application (Aplicação)

**Responsabilidade**: Orquestra casos de uso, coordena entidades e serviços.

**Componentes**:
- **Use Cases**: Casos de uso que implementam fluxos de negócio
  - `LoginUseCase.ts`: Lógica de autenticação
  - `RefreshTokenUseCase.ts`: Renovação de tokens
  - `RegisterUseCase.ts`: Registro de usuários

**Características**:
- Depende apenas de interfaces (ports)
- Contém lógica de orquestração
- Não conhece detalhes de implementação

**Exemplo**:
```typescript
export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    // ...
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    // Orquestra o fluxo de login
  }
}
```

### 3. Ports (Portas)

**Responsabilidade**: Define contratos (interfaces) que o domínio precisa.

**Componentes**:
- **Repositories**: Interfaces de persistência
  - `IUserRepository.ts`
  - `IMembershipRepository.ts`
  - `ITenantRepository.ts`
- **Services**: Interfaces de serviços externos
  - `IPasswordService.ts`
  - `ITokenService.ts`
  - `IAuditService.ts`

**Características**:
- Apenas interfaces TypeScript
- Definidas pelo domínio
- Implementadas pela infraestrutura

### 4. Infrastructure (Infraestrutura)

**Responsabilidade**: Implementa as portas usando tecnologias específicas.

**Componentes**:
- **Repositories**: Implementações usando Prisma
  - `PrismaUserRepository.ts`
  - `PrismaMembershipRepository.ts`
- **Services**: Implementações de serviços
  - `BcryptPasswordService.ts`
  - `JwtTokenService.ts`
  - `PrismaAuditService.ts`
- **DI Container**: Composição de dependências
  - `Container.ts`

**Características**:
- Implementa interfaces definidas em ports
- Conhece detalhes de frameworks (Prisma, JWT, etc)
- Pode ser substituída sem afetar o domínio

### 5. Presentation (Apresentação)

**Responsabilidade**: Interface HTTP, validação de entrada, formatação de saída.

**Componentes**:
- **Controllers**: Handlers HTTP
  - `AuthController.ts`

**Características**:
- Conhece Fastify e HTTP
- Valida entrada (schemas Zod)
- Delega para use cases
- Formata respostas HTTP

## Fluxo de Dados

```
HTTP Request
    ↓
Presentation Layer (Controller)
    ↓
Application Layer (Use Case)
    ↓
Domain Layer (Entities)
    ↓
Infrastructure Layer (Repository/Service)
    ↓
Database/External Service
```

## Princípios Aplicados

### 1. Dependency Inversion Principle (DIP)

O domínio define interfaces (ports), e a infraestrutura as implementa (adapters).

```typescript
// Port (definido pelo domínio)
interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
}

// Adapter (implementado pela infraestrutura)
class PrismaUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    // Implementação usando Prisma
  }
}
```

### 2. Separation of Concerns

Cada camada tem uma responsabilidade única:
- **Domain**: Regras de negócio
- **Application**: Orquestração
- **Infrastructure**: Detalhes técnicos
- **Presentation**: Interface HTTP

### 3. Testabilidade

Cada camada pode ser testada independentemente usando mocks/stubs das interfaces.

```typescript
// Teste de use case com mock
const mockUserRepository: IUserRepository = {
  findByEmail: vi.fn().mockResolvedValue(user),
};
const useCase = new LoginUseCase(mockUserRepository, ...);
```

## Benefícios

1. **Testabilidade**: Lógica de negócio pode ser testada sem banco de dados
2. **Manutenibilidade**: Mudanças em frameworks não afetam o domínio
3. **Flexibilidade**: Fácil trocar implementações (ex: Prisma → TypeORM)
4. **Clareza**: Separação clara de responsabilidades
5. **Escalabilidade**: Fácil adicionar novos casos de uso

## Migração Progressiva

A refatoração está sendo feita módulo por módulo:

1. ✅ **Auth Module**: Completamente refatorado
2. ⏳ **Templates Module**: Em progresso
3. ⏳ **Sessions Module**: Pendente
4. ⏳ **Engine Module**: Pendente
5. ⏳ **AI Module**: Pendente

## Exemplo Completo: Login

### 1. Controller (Presentation)
```typescript
async login(request, reply) {
  const body = loginBodySchema.parse(request.body);
  const result = await this.loginUseCase.execute({
    email: body.email,
    password: body.password,
  });
  return reply.send(result);
}
```

### 2. Use Case (Application)
```typescript
async execute(request: LoginRequest): Promise<LoginResponse> {
  const user = await this.userRepository.findByEmail(request.email);
  if (!user) throw new UnauthorizedError();
  
  const match = await this.passwordService.compare(
    request.password,
    user.passwordHash
  );
  if (!match) throw new UnauthorizedError();
  
  // ... mais lógica
}
```

### 3. Repository (Infrastructure)
```typescript
async findByEmail(email: string): Promise<User | null> {
  const prismaUser = await this.prisma.user.findUnique({ where: { email } });
  return prismaUser ? this.toDomain(prismaUser) : null;
}
```

## Próximos Passos

1. Completar refatoração de todos os módulos
2. Adicionar testes unitários para use cases
3. Adicionar testes de integração para adapters
4. Documentar padrões e convenções
5. Criar exemplos de testes
