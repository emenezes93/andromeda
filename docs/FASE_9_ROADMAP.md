# Fase 9 – Planos de treino, histórico de treinos, fotos de progresso

## Escopo

- **Planos de treino:** CRUD de planos vinculados ao paciente (nome, descrição, estrutura em JSON, datas).
- **Histórico de treinos executados:** Registrar quando o paciente executou um treino (data/hora, duração, plano opcional).
- **Fotos de progresso:** CRUD de fotos (URL da imagem + data da foto + notas); upload de arquivo fica em camada externa (ex.: S3 + presigned URL).

---

## 1. Schema e migração

**Arquivo:** `prisma/migrations/20250220000000_fase9_planos_treino_fotos/migration.sql`

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `training_plans` | Planos de treino por paciente. `plan_json` (JSONB) guarda a estrutura (dias, exercícios, séries, reps). |
| `training_executions` | Registro de cada treino executado (data/hora, duração, notas, vínculo opcional com plano). |
| `progress_photos` | Fotos de progresso: `image_url`, `taken_at`, `notes`. Soft delete com `deleted_at`. |

### Modelos Prisma

- **TrainingPlan:** `tenantId`, `patientId`, `name`, `description`, `planJson`, `startDate`, `endDate`, `active`, `createdAt`, `updatedAt`, `deletedAt`.
- **TrainingExecution:** `tenantId`, `patientId`, `trainingPlanId` (opcional), `executedAt`, `durationMinutes`, `notes`, `completed`, `createdAt`.
- **ProgressPhoto:** `tenantId`, `patientId`, `imageUrl`, `takenAt`, `notes`, `createdAt`, `deletedAt`.

---

## 2. API – Planos de treino

**Prefixo:** `/v1/training-plans`

| Método | Rota | Descrição | Role |
|--------|------|-----------|------|
| POST | `/v1/training-plans` | Criar plano | practitioner+ |
| GET | `/v1/training-plans` | Listar (paginação, filtro `patientId`, `active`) | viewer+ |
| GET | `/v1/training-plans/:id` | Obter um plano | viewer+ |
| PATCH | `/v1/training-plans/:id` | Atualizar plano | practitioner+ |
| DELETE | `/v1/training-plans/:id` | Soft delete | practitioner+ |

**Body de criação (exemplo):**

```json
{
  "patientId": "...",
  "name": "Treino A/B - 4x/semana",
  "description": "Foco em membros superiores e inferiores",
  "planJson": {
    "days": [
      { "dayOfWeek": 1, "exercises": [{ "name": "Supino", "sets": 3, "reps": "10" }] },
      { "dayOfWeek": 3, "exercises": [{ "name": "Agachamento", "sets": 4, "reps": "8" }] }
    ]
  },
  "startDate": "2025-02-20",
  "endDate": "2025-04-20",
  "active": true
}
```

---

## 3. API – Histórico de treinos executados

**Prefixo:** `/v1/training-executions`

| Método | Rota | Descrição | Role |
|--------|------|-----------|------|
| POST | `/v1/training-executions` | Registrar execução | practitioner+ |
| GET | `/v1/training-executions` | Listar (filtros: `patientId`, `trainingPlanId`, `from`, `to`) | viewer+ |
| GET | `/v1/training-executions/:id` | Obter uma execução | viewer+ |
| DELETE | `/v1/training-executions/:id` | Remover execução | practitioner+ |

**Body de criação (exemplo):**

```json
{
  "patientId": "...",
  "trainingPlanId": "...",
  "executedAt": "2025-02-20T10:00:00.000Z",
  "durationMinutes": 45,
  "notes": "Treino leve, foco em técnica",
  "completed": true
}
```

---

## 4. API – Fotos de progresso

**Prefixo:** `/v1/progress-photos`

| Método | Rota | Descrição | Role |
|--------|------|-----------|------|
| POST | `/v1/progress-photos` | Criar registro (envia `imageUrl`; upload em outro fluxo) | practitioner+ |
| GET | `/v1/progress-photos` | Listar (filtros: `patientId`, `from`, `to`) | viewer+ |
| GET | `/v1/progress-photos/:id` | Obter uma foto | viewer+ |
| PATCH | `/v1/progress-photos/:id` | Atualizar (url, data, notas) | practitioner+ |
| DELETE | `/v1/progress-photos/:id` | Soft delete | practitioner+ |

**Body de criação (exemplo):**

```json
{
  "patientId": "...",
  "imageUrl": "https://bucket.s3.../patient-id/2025-02-20.jpg",
  "takenAt": "2025-02-20",
  "notes": "Frente e lateral"
}
```

**Nota:** O upload do arquivo (multipart ou presigned URL) pode ser implementado depois; a API só persiste a URL e metadados.

---

## 5. Arquivos criados/alterados

### Novos

- `prisma/migrations/20250220000000_fase9_planos_treino_fotos/migration.sql`
- `src/modules/training-plans/schemas.ts`
- `src/modules/training-plans/routes.ts`
- `src/modules/training-executions/schemas.ts`
- `src/modules/training-executions/routes.ts`
- `src/modules/progress-photos/schemas.ts`
- `src/modules/progress-photos/routes.ts`

### Alterados

- `prisma/schema.prisma` – modelos `TrainingPlan`, `TrainingExecution`, `ProgressPhoto` e relações em `Tenant` e `Patient`.
- `src/bootstrap/app.ts` – registro de `trainingPlansRoutes`, `trainingExecutionsRoutes`, `progressPhotosRoutes`.

---

## 6. Próximos passos sugeridos

1. **Portal do paciente:** Endpoints ou uso das mesmas rotas com role `patient` para o paciente ver seus planos, execuções e fotos.
2. **Upload de imagens:** Endpoint de upload (ex.: multipart) ou integração com storage (S3) + presigned URL e depois `POST /v1/progress-photos` com a URL retornada.
3. **Dashboard:** Widgets com totais de treinos na semana e evolução de fotos ao longo do tempo.
4. **Testes:** Testes unitários e de integração para os três módulos.

---

**Data:** 2026-02-20
