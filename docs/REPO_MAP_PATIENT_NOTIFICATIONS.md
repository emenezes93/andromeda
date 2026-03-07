# Repo Map + Plano — PatientNotification + Alert (Personal ↔ Aluno)

## PASSO 1 — REPO MAP (resumo objetivo)

| Área | Path / localização |
|------|--------------------|
| **API v1 (patient-portal)** | `src/modules/patient-portal/routes.ts` — rotas `/v1/patient-portal/*` (login, register, me, my-sessions, my-evolutions, my-goals, my-training-plans, my-diet-plans, my-training-executions). Auth: JWT com `patientId` no payload. |
| **Registro de rotas** | `src/bootstrap/app.ts` — `patientPortalRoutes` registrado; rotas `/v1/patient-portal/login` e `register` em skip de auth. |
| **Entidades/Models (DB)** | `prisma/schema.prisma` — `Patient`, `Alert` (tenantId, patientId, type, severity, message, metadata, readAt, createdAt). **PatientNotification** não existe; será criado. |
| **Jobs/Cron** | `src/modules/scheduled-questionnaires/job.ts` — `startScheduledQuestionnairesJob(prisma, logger)`; chama `processScheduledQuestionnaires` em `scheduler.ts`. Executa ao subir e a cada hora (cron `0 * * * *`). |
| **Criação de sessão (scheduler)** | `src/modules/scheduled-questionnaires/scheduler.ts` — `processScheduledQuestionnaires`: para cada agendamento vencido, cria `AnamnesisSession` (um por paciente ou createMany para todos). Não emite notificação/alert hoje. |
| **TrainingPlan (create/update)** | `src/modules/training-plans/routes.ts` — POST `/v1/training-plans` (create), PATCH `/v1/training-plans/:id` (update). Prisma direto em `fastify.prisma`. |
| **DietPlan (create/update)** | `src/modules/diet/routes.ts` — POST `/v1/diet-plans` (create), PATCH `/v1/diet-plans/:id` (update). Prisma direto. |
| **Alert (uso no Hub/Dashboard)** | `src/modules/alerts/routes.ts` — GET/PATCH alerts; engine em `alerts/engine.ts`; frontend `AlertsBell`, PatientHubPage. |
| **Paginação** | `src/shared/utils/pagination.ts` — `page` + `limit`, `skipFor(page, limit)`, `MAX_LIMIT = 100`. Padrão: `page=1`, `limit=20`. Sem cursor; usar page/limit. |
| **Migrations** | `prisma/migrations/` — arquivos `YYYYMMDDHHMMSS_name/migration.sql`. Comando: `npx prisma migrate dev`. |
| **Testes** | `tests/unit/` (sem DB), `tests/integration/` (com DB, `buildApp()` + `app.inject()`). Vitest. |
| **OpenAPI/Swagger** | `src/http/plugins/swagger.ts`; schemas em `src/schemas/index.ts` e inline nas rotas. |

---

## PASSO 2 — PLANO DE IMPLEMENTAÇÃO (arquivo por arquivo)

| # | Arquivo | Objetivo | Tipo | Dependências / riscos |
|---|---------|----------|------|------------------------|
| 1 | `prisma/schema.prisma` | Adicionar model `PatientNotification` (id, tenantId, patientId, type, metadata, createdAt, readAt, archivedAt?) e relação em Patient | Edit | — |
| 2 | `prisma/migrations/YYYYMMDD_add_patient_notifications/migration.sql` | Tabela `patient_notifications` | Create | 1 |
| 3 | `src/modules/patient-notifications/service.ts` | `createPatientNotification(prisma, data)` + dedupe opcional | Create | 1,2 |
| 4 | `src/modules/training-plans/routes.ts` | Após create/update de plano: chamar createPatientNotification (plan_assigned / training_plan_assigned) | Edit | 3 |
| 5 | `src/modules/diet/routes.ts` | Após create/update de plano: chamar createPatientNotification (diet_plan_assigned) | Edit | 3 |
| 6 | `src/modules/patient-portal/routes.ts` | GET /me: adicionar hasUnreadNotifications (EXISTS readAt IS NULL) | Edit | 2 |
| 7 | `src/modules/patient-portal/routes.ts` | GET /my-notifications (page, limit), PATCH /my-notifications/mark-as-read (body: ids[] ou all) e/ou PATCH /my-notifications/:id/read | Edit | 2 |
| 8 | `src/modules/scheduled-questionnaires/scheduler.ts` | Após criar sessão(ões): criar PatientNotification (questionnaire_session_created) + Alert (reassessment_scheduled); idempotência por sessionId em metadata | Edit | 2, 3, Alert existente |
| 9 | Frontend (se existir AlertsBell/Hub) | Suporte ao type `reassessment_scheduled` (label + link) | Edit | — |
| 10 | Docs + OpenAPI | Tipos de PatientNotification e Alert; uso do app aluno; schemas nas rotas | Edit | — |

**Estratégia de rollout:** Sem feature flag; novos campos e rotas são aditivos. GET /me ganha campos opcionais (compatível).

**Compatibilidade:** GET /me passa a incluir `hasUnreadNotifications` (e opcionalmente `hasUnreadPlans`). Clientes antigos podem ignorar. Novas rotas não quebram nada.

---

## Tipos de PatientNotification (para documentação)

- `plan_assigned` ou `training_plan_assigned` — Plano de treino atribuído/atualizado. metadata: planType, planId, assignedByProfessionalId, assignedAt, title.
- `diet_plan_assigned` — Plano de dieta atribuído/atualizado. metadata: planId, assignedByProfessionalId, assignedAt.
- `questionnaire_session_created` — Reavaliação agendada criada. metadata: sessionId, questionnaireId, dueAt, createdAt.

## Tipos de Alert (personal) — novo

- `reassessment_scheduled` — Sessão de reavaliação criada pelo job. metadata: patientId, patientName, sessionId, questionnaireName, dueAt.

---

## Uso pelo app do aluno (sem push/websocket)

1. **GET /v1/patient-portal/me** — Verificar `hasUnreadNotifications`. Se true, exibir indicador (badge/sino).
2. **GET /v1/patient-portal/my-notifications?page=1&limit=20** — Listar notificações (ordenadas por createdAt desc).
3. **PATCH /v1/patient-portal/my-notifications/mark-as-read** — Marcar como lidas:
   - Body `{ "all": true }` — marca todas do paciente.
   - Body `{ "ids": ["id1", "id2"] }` — marca as indicadas.
4. **PATCH /v1/patient-portal/my-notifications/:id/read** — Marcar uma notificação como lida.

Após marcar como lida, o próximo GET /me retornará `hasUnreadNotifications: false` se não houver outras não lidas.

---

## Checklist final

- [x] Migration `20260305120000_add_patient_notifications` criada (tabela `patient_notifications`).
- [x] Model `PatientNotification` no Prisma; relação em `Patient` e `Tenant`.
- [x] Service `createPatientNotification` em `src/modules/patient-notifications/service.ts`.
- [x] P1: TrainingPlan create/update → PatientNotification (training_plan_assigned). DietPlan create/update → PatientNotification (diet_plan_assigned).
- [x] P2: GET /v1/patient-portal/me retorna `hasUnreadNotifications` (EXISTS readAt IS NULL).
- [x] P4: GET /v1/patient-portal/my-notifications (page, limit), PATCH mark-as-read (body: ids[] ou all), PATCH /my-notifications/:id/read.
- [x] P3: Scheduler ao criar sessão → PatientNotification (questionnaire_session_created) + Alert (reassessment_scheduled); idempotência por sessionId em metadata.
- [x] Frontend: AlertsBell usa link para `/sessions/:id` quando type reassessment_scheduled e metadata.sessionId existe.
- [x] Testes: `tests/integration/patient-notifications.integration.test.ts` (requer DB).
- [x] Documentação: tipos de PatientNotification e Alert; uso pelo app do aluno.
- [x] Endpoints protegidos por tenant/patient (paciente só acessa suas notificações).
- [x] Sem duplicação: update de plano gera 1 notificação por request; scheduler verifica existência por sessionId antes de criar.
