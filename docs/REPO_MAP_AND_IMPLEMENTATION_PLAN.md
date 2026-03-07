# Repo Map + Plano de Implementação + Commit Plan

## PARTE 1 — REPO MAP

### Stack
| Camada | Tecnologia |
|--------|------------|
| Backend | Node 20+, TypeScript (ESM), Fastify 5, Prisma 5, PostgreSQL |
| Frontend | React 18, Vite 5, TypeScript, Tailwind, React Query, React Router v6 |
| Auth | JWT (15min) + Refresh Token (30d, DB), opcional 2FA (speakeasy) |
| Jobs | node-cron (scheduled questionnaires), BullMQ ou setInterval (cleanup tokens) |
| Billing | Stripe (opcional) |
| AI | ruleBased / llmMock / llm (OpenAI/Anthropic, opcional) |

### Estrutura de pastas (raiz)
```
├── src/                    # Backend
│   ├── bootstrap/          # server.ts, app.ts (buildApp)
│   ├── config/              # env.ts, database.ts
│   ├── core/                # Hexagonal: domain, application, ports, infrastructure, presentation
│   ├── http/                # plugins (prisma, swagger), middleware (tenant, auth, rateLimit, errorHandler)
│   ├── modules/            # Legacy/feature: health, auth, billing, diet, patient-portal, patients-legacy,
│   │                       # progress-photos, scheduled-questionnaires, training-plans, training-executions
│   ├── schemas/             # Registro de schemas Zod/JSON
│   └── shared/              # errors, utils (audit, rbac, pagination), queue, types
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/                  # unit, integration, smoke, etc.
├── frontend/               # React app
│   └── src/
│       ├── api/            # client + módulos por domínio
│       ├── components/     # layout, ui, charts, session, gamification, icons
│       ├── features/      # auth, dashboard, patients, templates, sessions, diet, training-*, help, etc.
│       ├── routes/        # React Router + ProtectedRoute
│       ├── stores/        # authStore, onboardingStore, themeStore, localeStore
│       └── lib/, hooks/, i18n/, types/
├── docs/                   # CLAUDE.md, RELEASE_*, roadmaps
├── .github/workflows/      # ci, pr-checks, release, pages
├── docker-compose.yml      # api, frontend, db (Postgres 16)
├── Dockerfile              # API
└── frontend/Dockerfile     # Frontend
```

### Entry points
| Tipo | Arquivo | Comando |
|------|---------|---------|
| API HTTP | `src/bootstrap/server.ts` | `npm run dev` (tsx watch) / `npm run start` (node dist) |
| Frontend | `frontend/index.html` → `src/main.tsx` | `npm run dev` (Vite) / `npm run build` |
| Cron | `src/bootstrap/server.ts` | Inline: `startScheduledQuestionnairesJob()` (node-cron 0 * * * *) |
| Cleanup | `src/shared/queue/cleanupQueue.ts` ou `src/shared/utils/cleanup.js` | BullMQ (se REDIS_URL) ou setInterval 24h |

### Módulos relevantes
| Módulo | Backend | Frontend | Observação |
|--------|---------|----------|------------|
| Auth | core (AuthController), modules/auth (2FA) | api/auth, stores/authStore | JWT + refresh, 2FA opcional |
| Tenants | core TenantController, RLS (prisma plugin) | x-tenant-id no client | Multi-tenant por header |
| Patients | core PatientController, modules/patients-legacy (evolutions) | api/patients, features/patients | RBAC: Guards.readOnly / sessions |
| Plans (diet) | modules/diet/routes | api/diet, features/diet | DietPlan, DietEntry |
| Plans (training) | modules/training-plans, training-executions | api/training-*, features/training-plans | TrainingPlan, TrainingExecution |
| Progress photos | modules/progress-photos (routes, schemas) | api/progress-photos, PatientDetailPage, TrainingPlanDetailPage | **Só URL hoje** (sem upload de arquivo) |
| Insights | core InsightController | Session insights | IA/regras |
| Scheduled questionnaires | modules/scheduled-questionnaires + job | api/scheduled-questionnaires | Cron horário |

### Storage e uploads (estado atual)
- **S3/Cloudinary**: não utilizados no repositório.
- **Uploads**: não existe upload de arquivo. O módulo `progress-photos` aceita apenas `imageUrl` (string) no body do POST; o frontend usa um campo de texto para colar URL. Arquivos não são enviados ao servidor.

---

## PARTE 2 — PLANO DE IMPLEMENTAÇÃO PRIORIZADO

### ÉPICO P1 — PMF

#### P1.1 — Upload real de fotos de progresso (WEB + API)
| # | Task / Sub-task | Arquivos (path) | Tipo | Dependências | Riscos / Mitigação |
|---|------------------|-----------------|------|--------------|--------------------|
| 1.1.1 | Config e serviço de storage (local) | `src/config/env.ts` (UPLOAD_*), `src/modules/progress-photos/storageService.ts` (novo) | create/edit | — | Path fora do repo; .gitignore uploads/ |
| 1.1.2 | Rota multipart upload + GET file | `src/modules/progress-photos/routes.ts` (POST upload, GET :id/file) | edit | 1.1.1 | Tamanho máx; tipo MIME; tenant/patient check |
| 1.1.3 | Schemas e validação upload | `src/modules/progress-photos/schemas.ts` | edit | — | Limite size, extensões |
| 1.1.4 | Testes API upload + file | `tests/integration/progress-photos.integration.test.ts` ou novo | create | 1.1.2 | Fixture file; limpar dir após teste |
| 1.1.5 | OpenAPI/Swagger | `src/http/plugins/swagger.ts` ou schemas em routes | edit | 1.1.2 | multipart no schema |
| 1.1.6 | Frontend: componente upload (file input + preview) | `frontend/src/components/ui/FileUpload.tsx` ou em feature | create | — | A11y; feedback progress |
| 1.1.7 | PatientDetailPage: trocar URL por upload | `frontend/src/features/patients/PatientDetailPage.tsx` | edit | 1.1.6, API upload | Manter fallback URL opcional (deprecar depois) |
| 1.1.8 | TrainingPlanDetailPage: idem | `frontend/src/features/training-plans/TrainingPlanDetailPage.tsx` | edit | 1.1.6, API | Idem |
| 1.1.9 | API client upload (FormData) | `frontend/src/api/progress-photos.ts` | edit | — | Content-Type multipart |
| 1.1.10 | Permissões e RBAC | Já existem (Guards.sessions); revisar GET file com tenant | `src/modules/progress-photos/routes.ts` | edit | — | GET file só se photo do tenant |
| 1.1.11 | Instrumentação (logs/metrics) | `src/modules/progress-photos/routes.ts` (log upload, size) | edit | — | Mínimo: requestId + size |

**Feature flag**: opcional `FEATURE_PROGRESS_PHOTO_UPLOAD=true` (default true) para desligar rota de upload em rollout.  
**Rollout**: deploy API com novo endpoint; depois frontend; manter POST com imageUrl para compat.

---

#### P1.2 — Dashboard do aluno (Portal do Aluno WEB + API)
| # | Task / Sub-task | Arquivos prováveis | Tipo | Dependências |
|---|------------------|--------------------|------|--------------|
| 1.2.1 | API: endpoints dashboard aluno (resumo treinos/dieta/fotos) | `src/modules/patient-portal/` ou core | create/edit | patient-portal existente |
| 1.2.2 | Frontend: rotas e layout portal aluno | `frontend/src/features/patient-portal/`, routes | create/edit | auth patient |
| 1.2.3 | Telas: resumo, próximos treinos, fotos recentes | features/patient-portal | create | 1.2.1, 1.2.2 |

---

#### P1.3 — Notificações e lembretes (mínimo email)
| # | Sub-task | Arquivos prováveis | Tipo |
|---|----------|--------------------|------|
| 1.3.1 | Serviço de email (nodemailer ou SendGrid) | `src/shared/email/` ou config | create |
| 1.3.2 | Jobs: lembrete agendamento / treino | `src/modules/scheduled-questionnaires/job.ts` ou novo | edit/create |
| 1.3.3 | Preferências de notificação (opt-in) | prisma (User ou Tenant), API | create/edit |

---

#### P1.4 — Agenda do personal (WEB + API)
| # | Sub-task | Arquivos prováveis | Tipo |
|---|----------|--------------------|------|
| 1.4.1 | Modelo e migração (Event/Appointment) | prisma/schema.prisma, migrations | create |
| 1.4.2 | CRUD API agenda | src/modules/agenda/ ou core | create |
| 1.4.3 | UI calendário (lista/semana) | frontend/src/features/agenda | create |

---

#### P1.5 — Visão pré-consulta do aluno (WEB + API)
| # | Sub-task | Arquivos prováveis | Tipo |
|---|----------|--------------------|------|
| 1.5.1 | API: resumo aluno para consulta (sessões, planos, fotos) | core ou patient-portal | create/edit |
| 1.5.2 | Tela “Pré-consulta” no fluxo do personal | frontend features | create |

---

### ÉPICO P2 — Personal volta pro Excel

#### P2.1 — Builder visual de treinos
- Novos componentes drag-drop, blocos de exercício; API salvar estrutura (JSON ou tabela).

#### P2.2 — Registro rápido de sessão
- Atalho para marcar sessão como realizada (training-executions ou anamnesis); API + UI.

#### P2.3 — Relatório PDF bonito
- Serviço geração PDF (template paciente/periodo); rota GET PDF; botão “Exportar PDF” na UI.

---

### ÉPICO P3 — Diferencial

#### P3.1 — Alertas inteligentes
#### P3.2 — Metas conectadas
#### P3.3 — Comparativo antes/depois
- (Detalhamento em backlog; dependem de P1.)

---

## PARTE 3 — COMMIT PLAN (ordem P1 primeiro)

| # | Título | Descrição | Arquivos |
|---|--------|-----------|----------|
| 1 | chore(env): add upload storage config | Add UPLOAD_STORAGE_PATH, UPLOAD_MAX_SIZE_BYTES to env schema and .env.example | src/config/env.ts, .env.example |
| 2 | feat(progress-photos): add local storage service | Create storageService to save file to disk and return serving path | src/modules/progress-photos/storageService.ts |
| 3 | feat(progress-photos): add multipart upload route | POST /v1/progress-photos/upload (file + patientId, takenAt, notes), create ProgressPhoto with internal URL | src/modules/progress-photos/routes.ts, schemas.ts |
| 4 | feat(progress-photos): add GET :id/file to serve stored file | Stream file from disk for photo by id (tenant check) | src/modules/progress-photos/routes.ts |
| 5 | test(progress-photos): integration tests for upload and GET file | Tests for upload success, validation, GET file, tenant isolation | tests/integration/progress-photos-upload.integration.test.ts (new) |
| 6 | docs(api): document upload and file endpoints in OpenAPI | Update route schemas for multipart and file response | src/modules/progress-photos/routes.ts (schema blocks) |
| 7 | feat(frontend): add FileUpload component | Reusable file input with preview and size validation | frontend/src/components/ui/FileUpload.tsx (new) |
| 8 | feat(frontend): progress-photos API upload method | createProgressPhotoUpload(FormData) in api/progress-photos | frontend/src/api/progress-photos.ts |
| 9 | feat(patients): use file upload for progress photos in PatientDetailPage | Replace URL input with FileUpload; call upload API; keep optional URL fallback | frontend/src/features/patients/PatientDetailPage.tsx |
| 10 | feat(training-plans): use file upload for progress photos in TrainingPlanDetailPage | Same as PatientDetailPage | frontend/src/features/training-plans/TrainingPlanDetailPage.tsx |
| 11 | fix(progress-photos): ensure GET file respects tenant and returns 404 for wrong tenant | Re-check tenant on file serve | src/modules/progress-photos/routes.ts |
| 12 | chore: add uploads dir to .gitignore | Ignore ./uploads/ | .gitignore |
| 13 | chore(docs): add P1.1 upload checklist and env vars to docs | Document UPLOAD_* and manual verification steps | docs/RELEASE_P1_1_UPLOAD.md or REPO_MAP doc |

Commits 14–25 podem cobrir P1.2–P1.5 e depois P2/P3 conforme avanço.

---

## PARTE 4 — P1.1 IMPLEMENTATION CHECKLIST (após implementação)

- [ ] API: POST /v1/progress-photos/upload aceita multipart (file + patientId, takenAt, notes)
- [ ] API: GET /v1/progress-photos/:id/file retorna arquivo com tenant check
- [ ] API: POST /v1/progress-photos (body imageUrl) continua funcionando (compat)
- [ ] Testes de integração passando
- [ ] OpenAPI atualizado
- [ ] Frontend: upload de arquivo em PatientDetailPage e TrainingPlanDetailPage
- [ ] Frontend: galeria exibe fotos (URL interna ou externa)
- [ ] Permissões: apenas roles com permissão de sessões podem enviar upload
- [ ] Logs/métricas mínimas (tamanho upload, requestId)
- [ ] .gitignore inclui uploads/
- [ ] Verificação manual: upload de imagem, visualização, exclusão

---

## P1.1 Implementado (resumo)

- **API**: Env `UPLOAD_STORAGE_PATH`, `UPLOAD_MAX_SIZE_BYTES`; `storageService.ts` (salvar/ler do disco); `POST /v1/progress-photos/upload` (multipart), `GET /v1/progress-photos/:id/file`; migração `file_extension` em `progress_photos`.
- **Frontend**: `FileUpload`, `ProgressPhotoImage` (fetch com auth para URLs relativas); `createProgressPhotoUpload(formData)`; PatientDetailPage e TrainingPlanDetailPage com upload de arquivo + fallback URL.
- **Testes**: `tests/integration/progress-photos-upload.integration.test.ts` (requer DB rodando; rodar com `npx vitest run tests/integration/progress-photos-upload.integration.test.ts`).
