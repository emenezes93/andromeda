# Fase 8 – Portal do Aluno, Agendamento e Metas

## Implementação Completa

### 1. Portal do Aluno (Autenticação de Pacientes)

#### 1.1. Schema e Migração
- **Migration**: `prisma/migrations/20250219000000_fase8_portal_aluno_metas/migration.sql`
  - Adicionado campo `user_id` ao modelo `Patient` para vincular paciente a conta de usuário
  - Relação many-to-one: um `User` pode ter múltiplos `Patient` em diferentes tenants

#### 1.2. Rotas de Autenticação
- **POST `/v1/patient-portal/login`**: Login do paciente (email + senha)
  - Valida credenciais
  - Verifica se é paciente no tenant correto
  - Retorna JWT com `role: 'patient'` e `patientId`
  - Cria refresh token

- **POST `/v1/patient-portal/register`**: Registro de novo paciente
  - Cria `User` e `Patient` vinculados em transação
  - Aplica política de senha (histórico, expiração)
  - Valida tenant ativo

#### 1.3. Rotas do Portal do Paciente
- **GET `/v1/patient-portal/me`**: Dados do paciente logado
  - Retorna informações do paciente
  - Contadores de sessões, evoluções e metas

- **GET `/v1/patient-portal/my-sessions`**: Lista sessões do paciente
  - Paginação
  - Filtro por status (`in_progress`, `completed`)
  - Inclui nome do template e se tem insights

- **GET `/v1/patient-portal/my-evolutions`**: Lista evoluções do paciente
  - Paginação
  - Ordenado por data de registro (mais recente primeiro)

- **GET `/v1/patient-portal/my-goals`**: Lista metas do paciente
  - Paginação
  - Filtro por `achieved` (true/false)
  - Ordenado por data alvo

#### 1.4. Middleware de Autenticação
- Atualizado para suportar `role: 'patient'`
- Token JWT inclui `patientId` quando aplicável
- Rotas de login/registro adicionadas aos `skipPaths`

### 2. Agendamento de Questionários Recorrentes

#### 2.1. Schema e Migração
- **Tabela `scheduled_questionnaires`**:
  - `frequency`: `weekly` | `biweekly` | `monthly` | `quarterly`
  - `dayOfWeek`: 0-6 (domingo-sábado) para weekly/biweekly
  - `dayOfMonth`: 1-31 para monthly/quarterly
  - `startDate`, `endDate` (opcional)
  - `nextRunAt`, `lastRunAt`
  - `active`: boolean
  - `patientId`: opcional (null = todos os pacientes do tenant)

#### 2.2. Rotas CRUD
- **POST `/v1/scheduled-questionnaires`**: Criar agendamento
  - Valida template e paciente (se fornecido)
  - Calcula `nextRunAt` automaticamente
  - Requer role `admin` ou superior

- **GET `/v1/scheduled-questionnaires`**: Listar agendamentos
  - Paginação
  - Filtros: `patientId`, `templateId`, `active`
  - Inclui nome do template e paciente

- **PATCH `/v1/scheduled-questionnaires/:id`**: Atualizar agendamento
  - Recalcula `nextRunAt` se frequência/datas mudarem
  - Permite ativar/desativar

- **DELETE `/v1/scheduled-questionnaires/:id`**: Deletar (soft delete)

#### 2.3. Job Scheduler
- **Arquivo**: `src/modules/scheduled-questionnaires/job.ts`
- **Arquivo**: `src/modules/scheduled-questionnaires/scheduler.ts`
- Executa a cada hora (minuto 0) via `node-cron`
- Processa agendamentos com `nextRunAt <= now + 1h`
- Cria sessões de questionário automaticamente:
  - Se `patientId` definido: cria apenas para esse paciente
  - Se `patientId` null: cria para todos os pacientes ativos do tenant
- Atualiza `lastRunAt` e recalcula `nextRunAt`
- Iniciado automaticamente no `server.ts`

### 3. Metas e Objetivos

#### 3.1. Schema e Migração
- **Tabela `patient_goals`**:
  - `type`: `weight_loss` | `muscle_gain` | `performance` | `health` | `other`
  - `title`, `description`
  - `currentValue`, `targetValue`, `unit` (kg, cm, %, bpm, custom)
  - `startDate`, `targetDate`
  - `achievedAt`: timestamp quando meta foi alcançada

#### 3.2. Rotas CRUD
- **POST `/v1/goals`**: Criar meta
  - Valida paciente existe no tenant
  - Valida `targetDate > startDate`
  - Requer role `practitioner` ou superior

- **GET `/v1/goals`**: Listar metas
  - Paginação
  - Filtros: `patientId`, `type`, `achieved` (true/false)
  - Calcula `progressPercent` automaticamente
  - Inclui nome do paciente

- **GET `/v1/goals/:id`**: Obter meta específica
  - Inclui cálculo de progresso

- **PATCH `/v1/goals/:id`**: Atualizar meta
  - Permite atualizar `currentValue` para calcular progresso
  - Permite marcar como alcançada (`achievedAt`)

- **DELETE `/v1/goals/:id`**: Deletar (soft delete)

#### 3.3. Cálculo de Progresso
- `progressPercent = (currentValue / targetValue) * 100`
- Limitado entre 0 e 100%
- `null` se `currentValue` não definido

### 4. Dependências Adicionadas

- `node-cron`: ^3.0.3 (agendamento de jobs)
- `@types/node-cron`: ^3.0.11 (tipos TypeScript)

### 5. Arquivos Criados/Modificados

#### Novos Arquivos
- `prisma/migrations/20250219000000_fase8_portal_aluno_metas/migration.sql`
- `src/modules/patient-portal/schemas.ts`
- `src/modules/patient-portal/routes.ts`
- `src/modules/goals/schemas.ts`
- `src/modules/goals/routes.ts`
- `src/modules/scheduled-questionnaires/schemas.ts`
- `src/modules/scheduled-questionnaires/routes.ts`
- `src/modules/scheduled-questionnaires/scheduler.ts`
- `src/modules/scheduled-questionnaires/job.ts`

#### Arquivos Modificados
- `prisma/schema.prisma`: Adicionados modelos `ScheduledQuestionnaire` e `PatientGoal`, relação `userId` em `Patient`
- `src/http/middleware/auth.ts`: Suporte a `patientId` no token
- `src/plugins/auth.ts`: Suporte a `patientId` no token
- `src/bootstrap/app.ts`: Registro das novas rotas e skip paths
- `src/bootstrap/server.ts`: Inicialização do job scheduler
- `package.json`: Adicionadas dependências `node-cron` e `@types/node-cron`

### 6. Próximos Passos Sugeridos

1. **Frontend**: Criar interface do portal do paciente
2. **Notificações**: Enviar email/SMS quando questionário agendado for criado
3. **Dashboard**: Adicionar widgets de metas e progresso
4. **Relatórios**: Exportar evolução de metas ao longo do tempo
5. **Testes**: Adicionar testes unitários e de integração para as novas funcionalidades
