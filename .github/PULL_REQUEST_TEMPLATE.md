## Descrição

<!-- O que essa PR faz? Por que? -->

## Tipo de mudança

- [ ] `feat` — nova funcionalidade
- [ ] `fix` — correção de bug
- [ ] `refactor` — refatoração sem mudança de comportamento
- [ ] `perf` — melhoria de performance
- [ ] `docs` — documentação
- [ ] `chore` — manutenção, CI, dependências

## Módulo afetado

**Backend**
- [ ] `src/core/` — auth, users, patients, templates, sessions, insights, goals, audit, quota
- [ ] `src/modules/diet/` — planos de dieta, registros alimentares, gamificação
- [ ] `src/modules/training-plans/` — planos de treino
- [ ] `src/modules/training-executions/` — treinos realizados
- [ ] `src/modules/scheduled-questionnaires/` — agendamentos
- [ ] `src/modules/progress-photos/` — fotos de progresso
- [ ] `src/modules/billing/` — Stripe, assinatura
- [ ] `src/modules/patient-portal/` — portal do paciente
- [ ] `prisma/` — schema, migrations

**Frontend**
- [ ] `frontend/src/features/patients/` — pacientes
- [ ] `frontend/src/features/sessions/` — avaliações / anamnese
- [ ] `frontend/src/features/templates/` — modelos de questionário
- [ ] `frontend/src/features/diet/` — dieta e gamificação
- [ ] `frontend/src/features/training-plans/` — treinos
- [ ] `frontend/src/features/goals/` — metas
- [ ] `frontend/src/features/dashboard/` — dashboard
- [ ] `frontend/src/features/auth/` — autenticação, 2FA
- [ ] `frontend/src/features/billing/` — assinatura
- [ ] `frontend/src/components/ui/` — design system
- [ ] Infra / CI

## Checklist

- [ ] Testes passando (`npm run test`)
- [ ] Lint ok (`npm run lint`)
- [ ] TypeScript sem erros (`npx tsc --noEmit`)
- [ ] Sem `any` novo introduzido (ou justificado com comentário)
- [ ] Migrations adicionadas se o schema Prisma mudou (`npm run prisma:migrate:dev`)
- [ ] Variáveis de ambiente documentadas em `.env.example` se adicionadas
- [ ] `invalidateQueries` adicionado se houve mutação de dados (frontend)
- [ ] Sem `window.confirm` novo introduzido (usar `ConfirmModal`)
- [ ] RLS: queries com `tenantId` incluído em todos os `findMany` / `findFirst`

## Screenshots (se mudança de UI)

<!-- Antes / Depois — use comparação lado a lado se possível -->

## Observações

<!-- Contexto extra, trade-offs, dívida técnica deixada para depois -->
