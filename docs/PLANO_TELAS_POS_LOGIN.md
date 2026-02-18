# Plano de desenvolvimento – Telas pós-login

Documento de planejamento das próximas telas do frontend após o login, alinhado à API e ao [FRONTEND_PROPOSAL](FRONTEND_PROPOSAL.md).

---

## Estado atual

| Item | Status |
|------|--------|
| Login | ✅ Implementado |
| Dashboard (home) | ✅ Implementado (links para Templates e Sessões) |
| Layout (header, nav, logout) | ✅ PageLayout com Dashboard, Templates, Sessões |
| Rota protegida | ✅ ProtectedRoute |
| API client (token, tenant, refresh) | ✅ `api/client.ts` |
| **Templates** | 🔲 Placeholder (“em breve”) |
| **Sessões** | 🔲 Placeholder (“em breve”) |
| **Fluxo anamnese (engine)** | 🔲 Não existe |
| **Insights (IA)** | 🔲 Não existe |
| **Audit** | 🔲 Não existe |
| **Usuários / Tenants** | 🔲 Não existe (admin/owner) |

---

## Ordem de implementação e fases

### Fase 1 – Templates e Sessões (base do fluxo)
1. **Templates** – listar, criar, ver detalhe  
2. **Sessões** – listar, criar (escolher template)

### Fase 2 – Fluxo da anamnese
3. **Fluxo anamnese** – tela “em sessão”: próxima pergunta (engine) + enviar respostas até concluir

### Fase 3 – Insights e Audit
4. **Insights (IA)** – gerar e visualizar (resumo, riscos, recomendações)  
5. **Audit** – listagem com filtros e paginação

### Fase 4 – Admin (opcional / depois)
6. **Usuários** – listar/criar (owner/admin)  
7. **Tenants** – listar/criar (owner)

---

## Detalhamento por tela

### 1. Templates

**Objetivo:** Gerenciar questionários (templates) do tenant.

**Rotas**
- `GET /v1/anamnesis/templates` – listagem paginada  
- `POST /v1/anamnesis/templates` – criar template  
- `GET /v1/anamnesis/templates/:id` – detalhe

**Telas no frontend**

| Rota | Nome | Descrição |
|------|------|-----------|
| `/templates` | Lista de templates | Tabela/cards paginados, botão “Novo template” |
| `/templates/new` | Criar template | Formulário: nome + `schemaJson` (editor JSON ou formulário estruturado) |
| `/templates/:id` | Detalhe do template | Nome, preview do schema (perguntas), opcional: editar |

**Componentes sugeridos**
- `TemplatesListPage` – lista + paginação + link “Novo”
- `TemplateFormPage` – form criar (nome + schema)
- `TemplateDetailPage` – exibir template; pode ter link para “Nova sessão com este template”
- `api/templates.ts` – `listTemplates()`, `createTemplate()`, `getTemplate(id)`

**Critérios de aceite**
- [ ] Listar templates com paginação (page, limit)
- [ ] Criar template (nome + schemaJson válido)
- [ ] Ver detalhe de um template
- [ ] Tratamento de erro (403, 404, validação) com feedback ao usuário

**Dependências:** Nenhuma (primeira tela “real” pós-dashboard).

---

### 2. Sessões

**Objetivo:** Listar sessões de anamnese e iniciar novas.

**Rotas**
- `GET /v1/anamnesis/sessions` – listagem paginada (filtros opcionais)  
- `POST /v1/anamnesis/sessions` – criar sessão (`templateId`)  
- `GET /v1/anamnesis/sessions/:id` – detalhe  
- `POST /v1/anamnesis/sessions/:id/answers` – enviar respostas (merge)

**Telas no frontend**

| Rota | Nome | Descrição |
|------|------|-----------|
| `/sessions` | Lista de sessões | Tabela/cards: id, template, status/progresso, data, link “Continuar” ou “Ver” |
| `/sessions/new` | Nova sessão | Seleção de template (dropdown da lista de templates), botão “Iniciar” |
| `/sessions/:id` | Detalhe / continuar | Ver dados da sessão; se não concluída, CTA “Continuar anamnese” → leva ao fluxo (Fase 2) |

**Componentes sugeridos**
- `SessionsListPage` – lista + paginação + “Nova sessão”
- `NewSessionPage` – select template → POST session → redirect para `/sessions/:id` ou fluxo
- `SessionDetailPage` – resumo da sessão + botão “Continuar” ou “Ver insights”
- `api/sessions.ts` – `listSessions()`, `createSession(templateId)`, `getSession(id)`, `submitAnswers(sessionId, answersJson)`

**Critérios de aceite**
- [ ] Listar sessões com paginação
- [ ] Criar sessão escolhendo um template
- [ ] Ver detalhe da sessão (e se já tem insights, link para tela de insights)
- [ ] Redirecionar para o fluxo de perguntas quando “Continuar”

**Dependências:** Templates (para listar templates no “Nova sessão”).

---

### 3. Fluxo da anamnese (engine)

**Objetivo:** Durante uma sessão, exibir a próxima pergunta (engine), coletar resposta e repetir até conclusão.

**Rotas**
- `POST /v1/anamnesis/engine/next-question` – body: `{ sessionId, currentAnswers }` → `{ nextQuestion, completionPercent, reason }`

**Telas no frontend**

| Rota | Nome | Descrição |
|------|------|-----------|
| `/sessions/:id/flow` | Fluxo da anamnese | Uma pergunta por vez; input conforme tipo (number, single, text); botão “Próxima”; barra de progresso; ao concluir, redirecionar para sessão ou insights |

**Fluxo**
1. Usuário em “Continuar” na sessão → entra em `/sessions/:id/flow`
2. Carregar respostas já enviadas (se houver) ou começar vazio
3. Chamar `next-question` com `sessionId` e `currentAnswers`
4. Se `nextQuestion === null` → sessão concluída: enviar `currentAnswers` via `POST .../answers` (se ainda não enviou), depois redirect para `/sessions/:id` ou `/sessions/:id/insights`
5. Se há pergunta → exibir pergunta (título, tipo, opções se single), usuário responde → adicionar ao `currentAnswers` local → voltar ao passo 3 (ou enviar batch e depois 3)
6. Estratégia de envio: enviar respostas ao backend a cada N perguntas ou ao concluir (POST answers faz merge); manter estado local sincronizado

**Componentes sugeridos**
- `AnamnesisFlowPage` – container do fluxo (progresso, área da pergunta, botão próximo)
- `QuestionBlock` – exibe uma pergunta (number → input number; single → radio/select; text → textarea)
- `api/engine.ts` – `getNextQuestion(sessionId, currentAnswers)`
- Reutilizar `api/sessions.ts` → `submitAnswers(sessionId, answersJson)`

**Critérios de aceite**
- [ ] Exibir uma pergunta por vez com base no engine
- [ ] Coletar resposta (number, single, text) e avançar
- [ ] Barra ou indicador de progresso (completionPercent)
- [ ] Ao concluir, enviar respostas e redirecionar (sessão ou insights)
- [ ] Tratar pergunta condicional (engine já retorna só as que aplicam)

**Dependências:** Sessões (sessão criada e `sessionId`).

---

### 4. Insights (IA)

**Objetivo:** Gerar e visualizar análise da sessão (resumo, riscos, recomendações).

**Rotas**
- `POST /v1/ai/insights` – body: `{ sessionId }` → cria/retorna insight  
- `GET /v1/ai/insights/:sessionId` – retorna insight da sessão

**Telas no frontend**

| Rota | Nome | Descrição |
|------|------|-----------|
| `/sessions/:id/insights` | Insights da sessão | Botão “Gerar insights” (se ainda não existir); exibir summary, risksJson (readiness, stress, etc.), recommendationsJson em cards/lista |

**Componentes sugeridos**
- `SessionInsightsPage` – verificar se já tem insight (GET); se não, botão “Gerar” (POST) → loading → exibir resultado
- Cards ou lista para: resumo textual, métricas de risco (0–100), lista de recomendações
- `api/ai.ts` – `generateInsights(sessionId)`, `getInsights(sessionId)`

**Critérios de aceite**
- [ ] Gerar insights (POST) quando a sessão ainda não tiver
- [ ] Exibir summary, riscos (readiness, dropoutRisk, stress, sleepQuality) e recomendações
- [ ] Layout claro (cards ou seções)
- [ ] Link a partir do detalhe da sessão (“Ver insights”)

**Dependências:** Sessões (e idealmente fluxo concluído com respostas).

---

### 5. Audit

**Objetivo:** Listar ações auditadas (quem fez o quê, quando).

**Rotas**
- `GET /v1/audit` – query: `page`, `limit`, opcional: `action`, `entity`, etc.

**Telas no frontend**

| Rota | Nome | Descrição |
|------|------|-----------|
| `/audit` | Log de auditoria | Tabela paginada: data, ação, entidade, ator, detalhes; filtros opcionais (ação, entidade) |

**Componentes sugeridos**
- `AuditListPage` – tabela + paginação + filtros (action, entity)
- `api/audit.ts` – `listAudit(params)`

**Critérios de aceite**
- [ ] Listar eventos com paginação
- [ ] Filtros por ação e/ou entidade (se a API suportar)
- [ ] Exibir data, ação, entidade, ator de forma legível

**Dependências:** Nenhuma (apenas permissão de leitura).

---

### 6. Usuários (admin/owner)

**Objetivo:** Gerenciar usuários do tenant (listar, criar).

**Rotas**
- `GET /v1/users` – listagem paginada  
- `POST /v1/users` – criar usuário (body: email, name, password, role)

**Telas no frontend**

| Rota | Nome | Descrição |
|------|------|-----------|
| `/users` | Usuários | Lista + “Novo usuário”; form: email, nome, senha, role |

**Critérios de aceite**
- [ ] Listar usuários do tenant (com checagem de role)
- [ ] Criar usuário (owner/admin)
- [ ] Item de nav “Usuários” apenas para roles permitidos

**Dependências:** RBAC no frontend (esconder menu/rotas por role).

---

### 7. Tenants (owner)

**Objetivo:** Gerenciar tenants (apenas owner).

**Rotas**
- `GET /v1/tenants` – listagem  
- `POST /v1/tenants` – criar tenant

**Telas no frontend**

| Rota | Nome | Descrição |
|------|------|-----------|
| `/tenants` | Tenants | Lista + “Novo tenant” (owner only) |

**Critérios de aceite**
- [ ] Listar tenants (owner)
- [ ] Criar tenant
- [ ] Menu “Tenants” só para owner

**Dependências:** RBAC; normalmente após Usuários.

---

## Navegação e layout

- **Nav atual:** Dashboard, Templates, Sessões.  
- **Incluir quando existir tela:**  
  - **Insights** – pode ser apenas link no detalhe da sessão (“Ver insights”), sem item global no header.  
  - **Audit** – item “Audit” no header (para quem tiver permissão).  
  - **Usuários** – item “Usuários” (admin/owner).  
  - **Tenants** – item “Tenants” (owner).
- **Dashboard:** manter atalhos para Templates e Sessões; opcional: último template, última sessão, ou “Continuar sessão X”.

---

## API clients a criar no frontend

| Arquivo | Funções principais |
|---------|--------------------|
| `api/templates.ts` | listTemplates(query), createTemplate(body), getTemplate(id) |
| `api/sessions.ts` | listSessions(query), createSession(templateId), getSession(id), submitAnswers(id, answersJson) |
| `api/engine.ts` | getNextQuestion(sessionId, currentAnswers) |
| `api/ai.ts` | generateInsights(sessionId), getInsights(sessionId) |
| `api/audit.ts` | listAudit(params) |
| `api/users.ts` | listUsers(query), createUser(body) |
| `api/tenants.ts` | listTenants(), createTenant(body) |

---

## Resumo da ordem sugerida

1. **Templates** – listar, criar, detalhe + `api/templates.ts`  
2. **Sessões** – listar, criar, detalhe + `api/sessions.ts`  
3. **Fluxo anamnese** – `/sessions/:id/flow` + engine + `api/engine.ts`  
4. **Insights** – `/sessions/:id/insights` + `api/ai.ts`  
5. **Audit** – `/audit` + `api/audit.ts`  
6. **Usuários** (e nav por role)  
7. **Tenants** (owner)

Cada fase pode ser um PR: primeiro endpoints no front, depois telas e rotas, depois ajustes de UX (loading, toasts, tratamento de erro).
