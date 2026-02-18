# Análise do projeto e novas funcionalidades sugeridas

Documento de análise do Anamnese Inteligente PaaS e propostas de funcionalidades para agregar valor ao produto.

---

## 1. Visão atual do produto

O sistema é um **PaaS multi-tenant** para:

- **Questionários adaptativos de saúde** (templates com regras condicionais e engine de próxima pergunta).
- **Sessões de anamnese** vinculadas a template e opcionalmente a paciente.
- **Insights por IA** (regras ou mock/LLM): resumo, riscos (0–100), recomendações.
- **Cadastro de pacientes** com evoluções (peso, IMC, pressão, etc.).
- **Auditoria** de ações e **gestão de usuários** por tenant (owner/admin).

**Stack:** API Fastify + Prisma + PostgreSQL; frontend React + Vite + Tailwind; gráficos (Recharts), animações (Lottie, breathwork).

---

## 2. Gaps e oportunidades (resumido)

| Área | O que falta ou pode evoluir |
|------|-----------------------------|
| Admin | Gestão de tenants (owner); edição de roles em lote; desativação de usuário. |
| Paciente/Sessão | Vincular sessão a paciente na criação; histórico “sessões do paciente”; lembrete de evolução. |
| Dados | Export (PDF/JSON) de sessão + insights; dashboard com métricas por período; relatórios por template. |
| IA | Modo LLM real (OpenAI/Anthropic); regras configuráveis por tag; sugestões no fluxo. |
| UX | Skeletons; confirmação em ações destrutivas; a11y; modo escuro; notificações in-app. |
| Plataforma | Testes no frontend; métricas Prometheus; health com dependências; API pública/versionada. |

---

## 3. Novas funcionalidades propostas (por tema)

### 3.1 Admin e operação

| # | Funcionalidade | Descrição | Prioridade |
|---|----------------|-----------|------------|
| 1 | **Gestão de Tenants (owner)** | Listar tenants, criar, editar nome/status (active/suspended). Rota `/tenants`, menu só para owner. API: `GET /v1/tenants`, `POST /v1/tenants`, `PATCH /v1/tenants/:id`. | Alta |
| 2 | **Desativar / reativar usuário** | Soft delete ou flag “ativo” no membership. Owner/admin desativa usuário (não remove); usuário deixa de fazer login. Lista de usuários com filtro “ativos / inativos”. | Média |
| 3 | **Alterar role em lote** | Na lista de usuários, seleção múltipla e ação “Alterar papel para X” (respeitando hierarquia RBAC). | Baixa |
| 4 | **Configurações do tenant** | Tela de configurações por tenant: nome da clínica, fuso, idioma da interface, logo (upload ou URL). API: `GET/PATCH /v1/tenants/:id/settings` ou campos em `Tenant`. | Média |

---

### 3.2 Paciente e jornada clínica

| # | Funcionalidade | Descrição | Prioridade |
|---|----------------|-----------|------------|
| 5 | **Vincular paciente na criação da sessão** | Em “Nova sessão”, além do template, permitir escolher paciente (opcional). Já existe `patientId` em sessão; garantir uso no frontend e em listagens. | Alta |
| 6 | **Aba “Sessões” no detalhe do paciente** | Em `/patients/:id`, listar sessões daquele paciente (com link para detalhe/insights). API: `GET /v1/patients/:id/sessions` ou filtrar `GET /v1/anamnesis/sessions?patientId=`. | Alta |
| 7 | **Lembrete de evolução** | Sugestão na tela do paciente: “Última evolução há X dias; registrar nova?”. Pode ser só UI com cálculo de diferença em relação à última `recordedAt`. | Média |
| 8 | **Histórico de insights por paciente** | Agregar insights das sessões do paciente (timeline ou lista) para ver evolução de riscos/recomendações ao longo do tempo. | Média |
| 9 | **Agendamento (futuro)** | Modelo `Appointment` (patientId, datetime, type, status). Tela de agenda por profissional ou por paciente. Integração opcional com calendário. | Baixa |

---

### 3.3 Dados, relatórios e export

| # | Funcionalidade | Descrição | Prioridade |
|---|----------------|-----------|------------|
| 10 | **Export de sessão (PDF/JSON)** | Botão “Exportar” no detalhe da sessão ou na tela de insights. API: `GET /v1/anamnesis/sessions/:id/export?format=json|pdf`. PDF com respostas + resumo + riscos + recomendações (template HTML → PDF no backend ou lib no frontend). | Alta |
| 11 | **Dashboard com métricas por período** | Filtro “Últimos 7/30/90 dias”. Cards: total de sessões, concluídas, insights gerados; gráficos já existentes (sessões por dia/template) respeitando o período. Pode ser só frontend com dados atuais ou endpoint `GET /v1/stats/dashboard?from=&to=`. | Alta |
| 12 | **Relatório por template** | Listagem de quantas sessões por template no período; taxa de conclusão; tempo médio (se armazenarmos datas de conclusão). Tela ou seção no dashboard. | Média |
| 13 | **Export de lista de pacientes (CSV)** | Botão na lista de pacientes: exportar CSV (nome, email, última evolução, nº sessões). Backend gera CSV ou frontend monta a partir de `listPatients` paginado. | Média |

---

### 3.4 IA e produto

| # | Funcionalidade | Descrição | Prioridade |
|---|----------------|-----------|------------|
| 14 | **AI_MODE=llm (provedor real)** | Integrar OpenAI ou Anthropic: env vars `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`. Serviço em `ai/llm-provider.ts` que monta prompt com template + respostas e retorna JSON (summary, risks, recommendations) com validação Zod e retry. | Alta |
| 15 | **Regras de IA configuráveis** | Regras por tag (ex.: tag “stress” → contribui para risco de estresse) e thresholds para recomendações. Configuração por tenant ou global em arquivo/DB. | Média |
| 16 | **Sugestões no fluxo da anamnese** | Durante o preenchimento, sugerir respostas ou próximas perguntas com base em histórico do paciente ou em padrões (ex.: “Pacientes com perfil similar escolheram X”). Pode começar com sugestões estáticas por tipo de pergunta. | Baixa |
| 17 | **Comparativo de sessões (antes/depois)** | Para o mesmo paciente, comparar dois insights (duas sessões) e destacar melhora ou piora em readiness, stress, sono, etc. | Baixa |

---

### 3.5 UX e acessibilidade

| # | Funcionalidade | Descrição | Prioridade |
|---|----------------|-----------|------------|
| 18 | **Skeletons de carregamento** | Em listas (templates, sessões, pacientes, usuários, auditoria) e em detalhes: skeleton alinhado ao layout em vez de só spinner. | Média |
| 19 | **Confirmação em ações destrutivas** | Modal “Tem certeza?” antes de remover usuário, desativar tenant, excluir template (se houver delete). | Média |
| 20 | **Acessibilidade (a11y)** | ESLint com `eslint-plugin-jsx-a11y`; testes com axe-core em telas críticas (login, fluxo anamnese, formulários). | Média |
| 21 | **Modo escuro** | Toggle no layout; variáveis CSS para tema claro/escuro; persistir preferência em `localStorage`. | Baixa |
| 22 | **Notificações in-app** | Centro de notificações (sino) com itens como “Novo usuário convidado”, “Sessão X concluída”, “Insight gerado para sessão Y”. Modelo `Notification` ou tabela simples; polling ou WebSocket. | Baixa |

---

### 3.6 Plataforma e DevOps

| # | Funcionalidade | Descrição | Prioridade |
|---|----------------|-----------|------------|
| 23 | **Testes no frontend** | Vitest + React Testing Library; testes de integração das páginas principais e do fluxo login → lista; testes de componente para formulários críticos. | Alta |
| 24 | **Health com dependências** | Endpoint `/ready` verificar Prisma (query simples) e, se configurado, Redis/LLM. Retornar 503 se alguma dependência falhar. | Média |
| 25 | **Métricas Prometheus** | Contadores/latência por rota; gauge de sessões ativas; endpoint `/metrics` para scraping. | Média |
| 26 | **Versionamento de API** | Manter `/v1/` explícito; documentar política de depreciação; em futuras breaking changes, introduzir `/v2/` e manter v1 por um período. | Baixa |
| 27 | **Webhooks (tenant)** | Configuração por tenant: URL de webhook; eventos (sessão concluída, insight gerado). POST para a URL com payload JSON. Útil para integrações com EHR ou outros sistemas. | Baixa |

---

### 3.7 Segurança e conformidade

| # | Funcionalidade | Descrição | Prioridade |
|---|----------------|-----------|------------|
| 28 | **Política de senha (reforço)** | Já existe complexidade no registro/criação de usuário. Reforçar: histórico de senhas (não reutilizar últimas N), expiração opcional (ex.: 90 dias). | Média |
| 29 | **2FA (opcional)** | Segundo fator (TOTP) para owner/admin. Campo `totpSecret` no User ou tabela dedicada; fluxo de ativação e checagem no login. | Baixa |
| 30 | **LGPD / consentimento** | Campo “Consentimento LGPD” no paciente (data, versão do termo); tela de termo de uso e checkbox no cadastro; registro em auditoria. | Média |

---

## 4. Priorização sugerida (roadmap)

**Curto prazo (1–2 sprints)**  
- Gestão de Tenants (owner)  
- Vincular paciente na criação da sessão + aba Sessões no paciente  
- Export de sessão (PDF/JSON)  
- Dashboard com filtro de período  
- AI_MODE=llm (provedor real)  
- Testes no frontend (base)

**Médio prazo (3–6 meses)**  
- Desativar/reativar usuário; configurações do tenant  
- Lembrete de evolução; histórico de insights por paciente  
- Relatório por template; export CSV de pacientes  
- Regras de IA configuráveis  
- Skeletons; confirmação em ações destrutivas; a11y  
- Health com dependências; métricas Prometheus  

**Longo prazo / backlog**  
- Alterar role em lote; sugestões no fluxo; comparativo de sessões  
- Modo escuro; notificações in-app  
- Versionamento de API; webhooks  
- Política de senha reforçada; 2FA; LGPD/consentimento  
- Agendamento

---

## 5. Resumo

- O produto já cobre bem: auth, templates, sessões, engine, insights, pacientes, evoluções, auditoria e usuários.  
- As **novas funcionalidades** propostas focam em: completar admin (tenants), aprofundar a jornada paciente-sessão-insights, dados e export, IA real e configurável, UX e a11y, e plataforma (testes, health, métricas).  
- A priorização acima pode ser ajustada conforme impacto de negócio e capacidade do time.

---

*Documento alinhado a `PLANO_PROXIMAS_FUNCOES.md`, `PROMPT_MELHORIAS.md` e `AVALIACAO_PROJETO_INSIGHTS_E_MELHORIAS.md`.*
