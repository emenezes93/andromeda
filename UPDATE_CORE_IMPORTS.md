# Script para Atualizar Imports do Core

Os arquivos dentro de `core/` precisam ter seus imports atualizados para usar path aliases ou caminhos relativos corretos.

## Padrões de Substituição

### Domain
- `from '../../../domain/entities/` → `from '@domain/entities/`
- `from '../../domain/entities/` → `from '@domain/entities/`

### Application  
- `from '../../../application/use-cases/` → `from '@application/use-cases/`
- `from '../../application/use-cases/` → `from '@application/use-cases/`

### Ports
- `from '../../../ports/repositories/` → `from '@ports/repositories/`
- `from '../../ports/repositories/` → `from '@ports/repositories/`
- `from '../../../ports/services/` → `from '@ports/services/`
- `from '../../ports/services/` → `from '@ports/services/`

### Infrastructure
- `from '../../../infrastructure/` → `from '@infrastructure/`
- `from '../../infrastructure/` → `from '@infrastructure/`

### Presentation
- `from '../../../presentation/` → `from '@presentation/`
- `from '../../presentation/` → `from '@presentation/`

## Arquivos que Precisam Atualização

1. `core/application/use-cases/auth/*.ts` - Todos os use cases
2. `core/infrastructure/repositories/*.ts` - Todos os repositories
3. `core/infrastructure/services/*.ts` - Todos os services
4. `core/infrastructure/di/Container.ts` - Container
5. `core/presentation/controllers/AuthController.ts` - Controller
6. `core/ports/**/*.ts` - Todas as interfaces
