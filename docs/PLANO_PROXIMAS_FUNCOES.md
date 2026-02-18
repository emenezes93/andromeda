# Plano – Próximas funções da aplicação

Documento de planejamento das próximas funcionalidades do Anamnese Inteligente PaaS (API + frontend), alinhado ao [PLANO_TELAS_POS_LOGIN](PLANO_TELAS_POS_LOGIN.md) e ao backlog em [PROMPT_MELHORIAS](PROMPT_MELHORIAS.md).

---

## Estado atual (o que já existe)

| Área | API | Frontend |
|------|-----|----------|
| Auth | Login, refresh, logout, register | Login, token + tenant no client |
| Dashboard | — | Home com cards, gráficos (sessões por dia/template) |
| Templates | Listar (paginado), criar, obter, atualizar | Lista, criar, editar, detalhe |
| Sessões | Listar (paginado), criar, obter, enviar respostas | Lista, nova sessão, detalhe |
| Fluxo anamnese | Engine (next-question) | Tela por pergunta, barra de progresso, envio final |
| Insights (IA) | Gerar e obter por sessionId | Gerar e exibir (resumo, KPIs, gráficos, recomendações, breathwork) |
| Auditoria | Listar com filtros e paginação | Lista paginada com filtros (ação, entidade, período) |
| Pacientes | CRUD + evoluções | Lista, formulário, detalhe, evolução |
| **Usuários** | POST criar, GET listagem (tenant), GET :id | ✅ Lista, convidar; menu só para owner/admin |
| **Tenants** | POST criar, GET :id (do tenant atual) | ❌ Falta: GET /v1/tenants (owner), rota `/tenants`, menu Tenants |

---

## Visão das próximas funções (por prioridade)

### 1. Admin – Usuários e Tenants (Fase 4 do plano original)

Objetivo: permitir que owner/admin gerenciem usuários do tenant e que owner gerencie tenants.

#### 1.1 Usuários (admin/owner) — ✅ Implementado

- **Backend:** `GET /v1/users` (listagem por tenant), `POST /v1/users`, `GET /v1/users/:id` (e ações de papel/remover conforme rotas).
- **Frontend:** Rota `/users` e `/users/invite`; lista de usuários (tabela, alterar role, remover); convite com email, nome, senha, role; item “Usuários” no menu apenas para owner/admin.
- **Critérios de aceite:**
  - [x] Listar usuários do tenant (com paginação).
  - [x] Criar/convidar usuário (owner/admin) com role.
  - [x] Menu e rotas de usuários visíveis apenas para owner/admin.

#### 1.2 Tenants (owner)

- **Backend (se necessário):**
  - Hoje: `POST /v1/tenants`, `GET /v1/tenants/:id` (só retorna o tenant do usuário).
  - **Possível extensão:** `GET /v1/tenants` (listagem de todos os tenants) apenas para role `owner`, para exibir tela de gestão multi-tenant.
- **Frontend:**
  - Rota `/tenants` (protegida: apenas owner).
  - Lista de tenants (nome, status, id).
  - Formulário “Novo tenant”: nome, status (active/suspended).
  - Item “Tenants” no menu apenas para owner.
- **Critérios de aceite:**
  - [ ] Listar tenants (owner).
  - [ ] Criar tenant (owner).
  - [ ] Menu Tenants só visível para owner.

**Ordem sugerida:** primeiro Usuários (mais usado no dia a dia do tenant), depois Tenants (mais administrativo).

---

### 2. Segurança e robustez (backlog PROMPT_MELHORIAS)

Itens de alta prioridade que impactam produção:

| Item | Descrição | Onde |
|------|-----------|------|
| Complexidade de senha | Regras para registro e criação de usuário (mín 8 chars, maiúscula, minúscula, número, especial) | Auth + Users schemas (Zod) |
| CORS restritivo | Usar `CORS_ORIGINS` em vez de `*` em produção | env, app (já pode existir) |
| Refresh token + rotação | Tokens de longa duração com rotação; logout revoga refresh | Auth (pode já estar parcial) |
| Rate limit por usuário | Limitar por userId quando autenticado | rateLimit plugin |
| Helmet | Headers de segurança HTTP | app (pode já existir) |

Implementar conforme prioridade de segurança do time (ex.: complexidade de senha e CORS primeiro).

---

### 3. UX e completude do fluxo

- **Tratamento de erro global (frontend):** toasts ou banner para erros de API (401, 403, 404, 500) e mensagens amigáveis.
- **Loading e feedback:** skeletons ou estados de carregamento consistentes em listas e formulários.
- **Auditoria:** filtros na UI (ação, entidade, período) já existem na API; expor filtros no frontend.
- **Templates:** edição de template existente (PUT/PATCH) se a API suportar; senão, apenas criar e visualizar.
- **Sessões:** filtro por template ou status na listagem, se a API suportar.

---

### 4. Dados e relatórios (médio prazo)

- **Export de sessão:** endpoint e tela para exportar uma sessão (respostas + insights) em PDF ou JSON.
- **Dashboard com métricas:** cards com totais (sessões no mês, templates ativos, último insight gerado); pode consumir endpoints novos ou agregar dados existentes.
- **Filtros inteligentes (health):** na lista de sessões, filtrar por “especialidade” (template), nome do paciente (se houver campo), tipo de exame (template), conforme [recomendações de dashboards de saúde].

---

### 5. IA e produto (backlog futuro)

- **AI_MODE=llm:** integrar provedor real (OpenAI/Anthropic) para insights em texto livre; hoje há ruleBased e llmMock.
- **Symptom tags / sugestões:** na anamnese, sugerir tags ou respostas com base em histórico/IA para reduzir digitação.
- **Jornada do paciente:** unificar em um único fluxo (agendamento → anamnese → teleconsulta → resultados) se o produto evoluir nessa direção.

---

## Resumo da ordem sugerida

1. **Usuários (admin/owner)** – listar + criar; menu por role; API: adicionar listagem se não existir.
2. **Tenants (owner)** – listar + criar; menu só para owner; API: adicionar listagem para owner se não existir.
3. **Segurança** – complexidade de senha, CORS, refresh/logout e rate limit conforme backlog.
4. **UX** – toasts/erro global, filtros na auditoria, loading consistente.
5. **Dados/relatórios** – export de sessão, dashboard com métricas, filtros nas listagens.

Cada bloco pode ser quebrado em tarefas menores e entregue em PRs separados (API primeiro, depois frontend).

---

## API clients a adicionar no frontend

| Arquivo | Funções | Quando |
|---------|---------|--------|
| `api/users.ts` | listUsers(query), createUser(body), getUserId(id) | Fase Usuários |
| `api/tenants.ts` | listTenants(), createTenant(body), getTenant(id) | Fase Tenants |

---

## Navegação (layout) após Fase 4

- **Dashboard** – todos
- **Templates** – todos (com permissão de leitura no tenant)
- **Sessões** – todos
- **Auditoria** – todos (ou restringir por role se desejado)
- **Usuários** – owner, admin
- **Tenants** – owner

No `PageLayout`, usar `user.role` (do authStore) para exibir ou ocultar itens do menu.
