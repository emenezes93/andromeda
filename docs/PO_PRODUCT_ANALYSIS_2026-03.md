# Relatorio de Analise de Produto (PO) — Andromeda / Anamnese Inteligente PaaS

**Data:** Marco 2026
**Autor:** Product Owner (analise assistida por IA)
**Versao da plataforma:** v2 (branch develop)

---

## 1. Resumo Executivo

A plataforma **Andromeda** e um PaaS multi-tenant voltado para **profissionais de saude e educacao fisica** (personal trainers, nutricionistas, fisioterapeutas). Oferece questionarios adaptativos de anamnese, insights por IA, gestao completa de pacientes, planos de treino e dieta, fotos de progresso, metas e gamificacao.

**Maturidade atual:** A plataforma apresenta um nivel de **produto funcional completo (MVP+)**, com 10+ dominios implementados, arquitetura hexagonal no core, CI/CD robusto, 3 releases de UX documentadas e entregues, e cobertura de testes em multiplas camadas.

| Dimensao | Score (1-10) | Justificativa |
|----------|:---:|---|
| Completude funcional | 8 | 10+ dominios; cobre jornada completa do profissional |
| Arquitetura tecnica | 9 | Hexagonal + DI container + RLS multi-tenant + RBAC |
| Qualidade de codigo | 8 | TypeScript strict, Zod validation, 54 arquivos de teste |
| UX/UI | 7 | Design system com tokens, dark mode, a11y, 3 releases UX |
| DevOps/CI | 8 | 5 workflows GH Actions, Docker, Dependabot, security scan |
| Documentacao | 7 | 7 docs, releases detalhadas, glossario, CLAUDE.md completo |
| Prontidao para mercado | 6 | Falta: analytics real, onboarding de trial, billing completo |

**Score geral: 7.6/10** — Produto tecnicamente maduro com gaps de go-to-market.

---

## 2. Inventario de Funcionalidades

### 2.1 Dominios do Backend (22 modelos Prisma)

| Dominio | Modelos | Status |
|---------|---------|--------|
| Multi-tenancy | Tenant, Membership | Core (hexagonal) |
| Autenticacao | User, RefreshToken, PasswordHistory | Core + 2FA (TOTP) |
| Pacientes | Patient, PatientEvolution | Core (hexagonal) |
| Anamnese | AnamnesisTemplate, AnamnesisSession, AnamnesisAnswer | Core (hexagonal) |
| IA / Insights | AiInsight, AiUsageMetric, AiCostAlert | Core (3 modos: rule-based, llmMock, llm) |
| Metas | PatientGoal | Core (hexagonal) |
| Treino | TrainingPlan, TrainingExecution | Modulo legacy |
| Dieta | DietPlan, DietEntry | Modulo legacy |
| Fotos de progresso | ProgressPhoto | Modulo legacy |
| Agendamentos | ScheduledQuestionnaire | Modulo legacy |
| Alertas | Alert | Modulo legacy |
| Notificacoes | PatientNotification | Modulo legacy |
| Billing | (via Stripe no Tenant) | Modulo legacy |
| Auditoria | AuditLog | Core (hexagonal) |
| Idempotencia | IdempotencyKey | Shared utility |
| Quotas | (PlanUsageSummary) | Core (hexagonal) |

### 2.2 Use Cases Implementados (51 total)

**Core hexagonal (51 use cases):**
- Auth: Login, Register, Refresh, Logout (4)
- Users: Create, Get, List, Update, Delete, SetActive, UpdateRole, ExportUserData (8)
- Tenants: Create, Get, List, Update, Activate, Suspend (6)
- Patients: Create, Get, List, Update, Delete, GetTimeline, GetHubSummary (7)
- Templates: Create, Get, List, Update, Delete (5)
- Sessions: Create, Get, List, Answer, GetNextQuestion, GenerateFillLink, Sign + 3 Public variants (10)
- Insights: Generate, GetBySession (2)
- Goals: Create, Get, List, Update, Delete (5)
- Stats: GetDashboardStats, GetTemplateReport, GetStudentsOverview (3)
- Audit: ListAuditLogs (1)

**Modulos legacy (endpoints adicionais):**
- Training Plans: CRUD + aderencia
- Training Executions: CRUD + coach notes
- Diet Plans: CRUD + stats + gamificacao (streak, XP, level, badges)
- Progress Photos: CRUD + upload de arquivos
- Scheduled Questionnaires: CRUD + scheduler
- Alerts: CRUD + motor de alertas
- Patient Portal: login/register separado para pacientes
- Billing: webhook Stripe + subscription management
- 2FA: setup, verify, disable, backup codes

### 2.3 Frontend — Paginas (35+ rotas)

| Area | Paginas | Funcionalidade |
|------|---------|----------------|
| Auth | Login, Security (2FA) | Login com 2FA, gestao de seguranca |
| Dashboard | DashboardPage, StudentsOverviewCard | KPIs, proximas acoes, visao geral dos alunos |
| Templates | List, Form, Edit, Detail, Report (5) | CRUD visual, form builder, relatorio agregado |
| Sessoes | List, New, Detail, Flow, Insights (5) | CRUD, fluxo adaptativo, insights IA |
| Pacientes | List, Form, Detail, Evolution, Timeline, Hub, Report (7) | CRUD completo, evolucao, hub 360 |
| Metas | GoalForm (1) | Criar/editar metas vinculadas a sessoes |
| Treino | List, Form, Detail (3) | Planos de treino + execucoes |
| Dieta | List, Form, Detail, Dashboard (4) | Planos + dashboard com gamificacao |
| Agendamentos | List, Form (2) | Questionarios recorrentes |
| Admin | Users, Invite, Tenants, TenantForm (4) | Gestao de equipe e organizacoes |
| Outros | Subscription, Audit, AiUsage, Terms, Help, Onboarding, Settings (7) | Billing, auditoria, IA, LGPD, ajuda |

### 2.4 Componentes UI Reutilizaveis

- **Layout:** PageLayout (sidebar responsiva + hamburger mobile)
- **Data viz:** LineChart, PieChart, RadarChart (Recharts)
- **Forms:** Input, Select, Button (5 variantes), FileUpload, PatientSearchSelect
- **Feedback:** Toast (4 variantes), ConfirmModal, EmptyState, Skeleton/SkeletonCard
- **Nav:** Breadcrumbs, Pagination, TimelineItem
- **Misc:** Badge (5 variantes), SessionStatusBadge, AlertsBell, ThemeToggle, LottieAnimation, ProgressPhotoImage

---

## 3. Proposta de Valor Entregue

### 3.1 Para o Profissional de Saude (usuario primario)

| Valor | Como e entregue |
|-------|-----------------|
| **Avaliacao inteligente** | Motor adaptativo com logica condicional + deepening heuristico; perguntas se ajustam em tempo real |
| **Insights automaticos** | 3 modos de IA (rule-based, mock, LLM real) geram sumario, riscos e recomendacoes |
| **Visao 360 do paciente** | Hub com evolucao corporal, aderencia de treino, dieta, alertas e metas — tudo em uma tela |
| **Gestao de treinos** | Planos estruturados + registro de execucoes + calculo de aderencia automatico |
| **Gestao nutricional** | Planos de dieta com macros + diario alimentar + gamificacao (streak, XP, badges) |
| **Acompanhamento visual** | Fotos de progresso com timeline e upload real |
| **Alertas proativos** | Motor detecta inatividade, queda de aderencia, risco de dropout, metas proximas do prazo |
| **Questionarios recorrentes** | Agendamento automatico (semanal/quinzenal/mensal/trimestral) com link publico |
| **Multi-equipe** | RBAC (owner/admin/practitioner/viewer) + convite de membros |
| **Auditoria completa** | Logs de todas as acoes com filtros por acao/entidade/usuario |

### 3.2 Para o Paciente/Aluno

| Valor | Como e entregue |
|-------|-----------------|
| **Preenchimento facil** | Link publico (/fill/:token) sem necessidade de conta; fluxo step-by-step com progresso |
| **Portal do aluno** | Login separado com acesso a planos, notificacoes e evolucao |
| **Gamificacao** | Streak de dieta, XP, niveis (Iniciante/Dedicado/Avancado/Elite), 7 tipos de badges |
| **Privacidade** | Consentimento LGPD rastreado, pagina de termos, exportacao de dados |

### 3.3 Para o Negocio (SaaS)

| Valor | Como e entregue |
|-------|-----------------|
| **Multi-tenant isolado** | RLS no PostgreSQL; dados 100% isolados entre organizacoes |
| **Billing integrado** | Stripe webhooks, tiers (free/paid), limites por plano (quotas) |
| **Controle de custos IA** | Metricas de uso, alertas de custo, limite por tenant |
| **Escalabilidade** | Docker, BullMQ/Redis opcional, paginacao server-side |

---

## 4. Maturidade por Area

### 4.1 Seguranca (Score: 9/10)

- JWT + Refresh Token com rotacao
- 2FA via TOTP + backup codes
- Protecao brute-force (loginAttempts + lockedUntil)
- Password history (impede reutilizacao)
- RLS no banco (isolamento por tenant)
- RBAC com hierarquia de roles
- Rate limiting (global + auth)
- Helmet + CORS configuravel
- Idempotencia para operacoes criticas
- Auditoria completa
- Testes de seguranca dedicados (`tests/security/`)

### 4.2 Testes (Score: 8/10)

| Camada | Qtd Arquivos | Cobertura |
|--------|:---:|---|
| Unit | 20 | Entities, services, use cases, schemas, RBAC, pagination |
| Integration | 18 | Auth, sessions, patients, templates, tenants, goals, stats, AI, training, notifications, photos |
| E2E | 1 | Fluxo completo |
| Performance | 1 | API benchmarks |
| Smoke | 1 | Health check |
| Functional | 1 | Training flows |
| Regression | 1 | Training regression |
| UAT | 1 | Practitioner journey |
| Security | 1 | Training security |
| **Frontend** | 3 | LoginPage, PatientFormPage, TemplatesListPage, AnamnesisFlowPage |
| **Total** | **54** | |

**Gap:** Cobertura frontend e limitada (3 arquivos de teste). Recomenda-se aumentar testes de componentes e integracao no frontend.

### 4.3 CI/CD (Score: 8/10)

| Workflow | Trigger | Funcao |
|----------|---------|--------|
| ci.yml | push main | Full test suite + coverage + Docker build |
| pr-checks.yml | PR to main | Lint + typecheck + unit tests + PR title validation |
| release.yml | tag push | Semantic release |
| pages.yml | push main | GitHub Pages |
| stale.yml | schedule | Auto-close issues/PRs inativas |
| dependabot.yml | weekly | Auto-update deps |

**Gap:** Frontend lint falha em PRs do Dependabot (issue conhecida). SonarQube configurado mas depende de secrets.

### 4.4 UX/UI (Score: 7/10)

Conforme o UI/UX Analysis Report (marco 2025):

| Dimensao | Nota |
|----------|:---:|
| Consistencia visual | 3.5/5 |
| Hierarquia/leitura | 3/5 |
| Usabilidade (fluxos) | 3.5/5 |
| Navegacao | 3/5 |
| Formularios | 3.5/5 |
| Feedback/erro | 4/5 |
| Responsividade | 3.5/5 |
| Acessibilidade | 4/5 |

**3 releases de UX entregues:**
- **R1 "Ativacao e Confianca"** — Onboarding wizard, toasts, proximas acoes, microcopy
- **R2 "Encontrabilidade e Acessibilidade"** — Menu por tarefas, WCAG AA, tour
- **R3 "Escala e Autonomia"** — Paginacao, filtros, busca, central de ajuda in-app

---

## 5. Diferenciais Competitivos

1. **Motor adaptativo de anamnese** — Unico no mercado de personal trainers; logica condicional + deepening heuristico
2. **IA plugavel (3 modos)** — De rule-based gratuito a LLM real; fallback entre provedores
3. **Hub 360 do paciente** — Consolida evolucao corporal, treino, dieta, metas e alertas em uma tela
4. **Gamificacao nutricional** — Streak, XP, niveis e badges incentivam aderencia do paciente
5. **Multi-tenant com RLS** — Isolamento real no banco; nao apenas filtro no app
6. **Arquitetura hexagonal** — Core desacoplado; facil de testar e evoluir

---

## 6. Gaps e Riscos

### 6.1 Gaps Funcionais (prioritizados)

| # | Gap | Impacto | Esforco | Prioridade |
|---|-----|---------|---------|:---:|
| G1 | **Analytics/telemetria real** — Eventos implementados no frontend mas sem backend de analytics (apenas console.debug) | Alto — sem dados para iterar | M | P0 |
| G2 | **Onboarding de trial / self-service** — Nao ha fluxo de signup publico; criacao de tenant e manual | Alto — bloqueia growth | M | P0 |
| G3 | **Notificacoes push/email** — PatientNotification existe mas sem delivery (sem push, sem email) | Medio — paciente nao sabe de novidades | M | P1 |
| G4 | **Billing completo** — Stripe integrado mas falta: trial period, upgrade/downgrade UI, invoices | Medio — bloqueia monetizacao | G | P1 |
| G5 | **Testes frontend** — Apenas 3 arquivos de teste; risco de regressao | Medio — qualidade | M | P1 |
| G6 | **Migracao legacy -> core** — 9 modulos ainda em arquitetura legacy | Baixo (funciona) — debito tecnico | G | P2 |
| G7 | **i18n incompleto** — translations.ts existe mas cobertura parcial | Baixo — limita internacionalizacao | M | P2 |
| G8 | **Relatorios exportaveis** — PatientReport e TemplateReport existem mas sem export PDF/CSV | Medio — profissionais precisam imprimir | M | P2 |

### 6.2 Riscos Tecnicos

| Risco | Mitigacao atual | Acao recomendada |
|-------|----------------|------------------|
| WSL1 limita dev local | Documentado em MEMORY.md | Migrar para WSL2 ou dev 100% Docker |
| Prisma nao injeta tenantId automaticamente | Documentado + RLS | Code review rigoroso; lint rule customizada |
| Frontend lint falhando no CI | Issue conhecida | Corrigir antes de mergear Dependabot PRs |
| Secrets de CI nao configurados (SonarQube) | Pipeline pula step | Configurar SONAR_TOKEN em prod |

---

## 7. Metricas de Produto Recomendadas (North Star)

### 7.1 Engajamento

| Metrica | Definicao | Meta inicial |
|---------|-----------|:---:|
| **DAU/MAU** | Usuarios ativos diarios / mensais | > 30% |
| **Sessoes de anamnese/semana** | Questionarios completados por profissional | > 3 |
| **Taxa de conclusao de questionario** | Iniciados vs completados | > 75% |

### 7.2 Retencao

| Metrica | Definicao | Meta inicial |
|---------|-----------|:---:|
| **D7 retention** | % usuarios que voltam apos 7 dias | > 40% |
| **D30 retention** | % usuarios que voltam apos 30 dias | > 25% |
| **Churn mensal** | % tenants que cancelam | < 5% |

### 7.3 Valor

| Metrica | Definicao | Meta inicial |
|---------|-----------|:---:|
| **Pacientes por profissional** | Media de pacientes ativos | > 15 |
| **Features usadas** | Modulos distintos utilizados/tenant | > 4 de 8 |
| **NPS** | Net Promoter Score | > 40 |

---

## 8. Roadmap Sugerido (proximo trimestre)

### Sprint 1-2: Go-to-Market Foundation
- [ ] Implementar analytics real (Mixpanel, PostHog ou similar) com os eventos ja mapeados
- [ ] Fluxo de signup publico (trial 14 dias) com onboarding automatico
- [ ] Corrigir frontend lint no CI
- [ ] Aumentar cobertura de testes frontend (meta: 15 arquivos)

### Sprint 3-4: Monetizacao e Retencao
- [ ] Billing completo: trial, upgrade/downgrade, invoices, cancelamento
- [ ] Notificacoes por email (SendGrid/SES) para pacientes
- [ ] Export PDF/CSV de relatorios (paciente, template, evolucao)
- [ ] Push notifications via web (PWA service worker)

### Sprint 5-6: Escala e Diferenciacao
- [ ] Migracao de 3 modulos legacy para hexagonal (training, diet, progress-photos)
- [ ] Dashboard de analytics para o profissional (metricas dos seus pacientes)
- [ ] IA: prompts customizaveis por template (campo llmPrompt ja existe no schema)
- [ ] App mobile (React Native ou PWA completo)

---

## 9. Conclusao

A plataforma **Andromeda** construiu uma base tecnica **excepcional** para um produto SaaS de saude. O investimento em arquitetura hexagonal, seguranca, multi-tenancy e IA plugavel e raro nesse estagio. O produto ja entrega **valor real** para profissionais com a jornada completa: avaliacao -> insights -> planos -> acompanhamento -> alertas.

**O principal gap nao e tecnico, e de go-to-market.** A plataforma esta pronta para usuarios, mas falta o funil de aquisicao (signup publico, trial, analytics). Resolver G1 e G2 e a maior alavanca de valor no curto prazo.

**Recomendacao:** Focar as proximas 2-4 semanas em **signup self-service + analytics + billing completo** antes de adicionar novas features. O produto ja tem profundidade; agora precisa de distribuicao.

---

*Relatorio gerado com base na analise de: 22 modelos Prisma, 51 use cases, 35+ rotas frontend, 54 arquivos de teste, 7 documentos de produto, 5 workflows CI/CD, 3 releases UX documentadas.*
