# Release R3 — “Escala e Autonomia”

## 2.1 Objetivo

Garantir performance e eficiência em volume (clínicas grandes) com paginação, filtros e busca, além de permitir autoatendimento com central de ajuda in-app, reduzindo tickets e acelerando a resolução de dúvidas.

---

## 2.2 Entregáveis (checklist)

| Item | Status |
|------|--------|
| M6 + Backlog #6 — Listas com paginação, busca e filtros (server-side), com metas de p95 definidas | ✅ (paginação/busca/filtros existentes; instrumentação R3) |
| F2 + Backlog #8 — Central de ajuda in-app (FAQ com busca, artigos por contexto, link para suporte) | ✅ |
| Polimentos finais — Ajustes de UX e estabilidade baseados em telemetria | Contínuo |

---

## 2.3 WBS (resumo)

- **Produto**: Escopo mínimo de filtros; “top 20 dúvidas” para help center.
- **Design/UX**: UI de filtros (aplicar/limpar/sem resultados); help center UI + artigos contextuais.
- **Front-end**: Paginação + busca + filtros + estados vazios; help center (busca, lista, artigo, “isso ajudou?”, link suporte).
- **Back-end**: Paginação e filtros server-side com índices; monitoramento p95.
- **QA**: Teste de performance (listas grandes); teste do help center (busca, artigos, ticket).
- **Data**: Eventos de performance e uso de filtros; métricas do help center (deflection).
- **Suporte**: Produzir artigos; triagem de tickets (categorias e links).

---

## 2.5 Definition of Done

- **Listas**: p95 dentro do benchmark acordado e sem travamentos perceptíveis; filtros e busca retornam resultados corretos e rápidos.
- **Help center**: Acessível e mensurável (uso, “resolveu?”, criação de ticket / link para suporte).

---

## 2.6 Métricas e eventos

### Eventos implementados (R3)

| Evento | Onde |
|--------|------|
| `list_loaded` | Após carregar lista (listType, ms, size, page) — Pacientes e Avaliações |
| `filter_applied` | Ao aplicar filtro (listType, filterType, count) — Avaliações (status, template) |
| `search_performed` | Após busca (listType, success) — Pacientes (busca por nome) |
| `help_center_open` | Abertura da central de ajuda (já existente) |
| `help_center_search` | Busca na central (query) (já existente) |
| `help_article_view` | Visualização de artigo (já existente) |
| `help_article_resolved` | Feedback “isso resolveu?” (articleId, resolved) (já existente) |
| `help_helpful_yes` | Usuário clicou “Sim” no artigo |
| `help_helpful_no` | Usuário clicou “Não” no artigo |
| `help_ticket_created` | Usuário clicou “Contatar suporte” (articleId?, source) |

### Métricas-alvo

1. p95 de carregamento de listas e endpoints de busca/filtro  
2. Tempo para encontrar paciente/sessão (teste cronometrado)  
3. Taxa de uso de filtros (aplicação/limpeza)  
4. Deflection do help center (% resolveu sem ticket = help_helpful_yes / (help_helpful_yes + help_helpful_no))  
5. Redução de tickets repetitivos  

### Hipóteses

- **H6**: Performance e filtros aumentam produtividade e retenção em clínicas grandes.  
- **H7**: Help center reduz tickets e melhora satisfação.  

---

## 2.7 Plano de validação

- **Usabilidade**: Sessão com 5 “power users” (clínicas grandes) executando tarefas de busca e filtro.  
- **Técnico**: Benchmark antes/depois (p95, erros, timeouts) + carga leve.  
- **Checklist QA**: Regressão + testes de massa + validação de eventos.  

---

## 2.8 Comunicação

### In-app

- **Banner R3** (dispensável, `releaseR3BannerDismissed`):  
  - “Busca e filtros melhorados” — “Encontre pacientes e sessões mais rápido, mesmo com listas grandes.”  
  - “Ajuda dentro do app” — “Consulte artigos e resolva dúvidas sem sair daqui.”  
  - Link “Ir para central de ajuda”.  

### Release notes

- Paginação e filtros nas listas (Pacientes, Avaliações).  
- Busca mais rápida (Pacientes por nome).  
- Central de ajuda com FAQ e busca; feedback “Isso resolveu?” e link para contatar suporte.  
- Melhorias gerais de estabilidade.  

### Suporte

- Guia “como usar filtros” + artigos principais + novo fluxo de triagem.  
- E-mail de suporte configurável via `VITE_SUPPORT_EMAIL` (frontend); fallback para placeholder.  

---

## Help center e deflection

- **“Isso resolveu sua dúvida?”**: Sim / Não.  
- **“Não”**: Exibe link “Contatar suporte” (mailto com `VITE_SUPPORT_EMAIL` ou fallback).  
- **Eventos**: `help_helpful_yes`, `help_helpful_no`, `help_ticket_created` (ao clicar no link) para cálculo de deflection.  

---

## Checklist QA (pré-release)

- [ ] Lista de Pacientes: busca por nome, paginação, list_loaded e search_performed no console (dev)
- [ ] Lista de Avaliações: filtros status e template, “Limpar filtros”, list_loaded e filter_applied no console
- [ ] Central de ajuda: busca, categoria, abrir artigo; “Sim” / “Não”; ao clicar “Não”, link “Contatar suporte” visível; ao clicar no link, help_ticket_created disparado
- [ ] Banner R3 no dashboard: título, duas mensagens, link para ajuda, dispensar
- [ ] Eventos em dev: list_loaded, filter_applied, search_performed, help_helpful_yes, help_helpful_no, help_ticket_created

---

## Rollout

- **Comunicação in-app**: Banner R3 no dashboard; dispensável por usuário (`releaseR3BannerDismissed`).  
- **Configuração**: Definir `VITE_SUPPORT_EMAIL` no build para o link “Contatar suporte” na central de ajuda.  
