# Plano de execução: 27 gaps e 20 melhorias

Planejamento para executar os **defeitos/gaps** e as **melhorias e novas funcionalidades** definidos em `BENCHMARK_PLATAFORMAS_E_MELHORIAS.md`, em fases ordenadas por dependência e impacto.

---

## 1. Mapeamento: gap → melhoria que o resolve

| Gap (defeito) | Categoria | Melhoria que resolve | Prioridade da melhoria |
|---------------|-----------|----------------------|------------------------|
| 1 | Conformidade | Termo de consentimento LGPD (M1) | Alta |
| 2 | Conformidade | Assinatura eletrônica na anamnese (M2) | Alta |
| 3 | Conformidade | Política/termos no app (link + aceite) – parte de M1 ou item explícito | Alta |
| 4 | Jornada paciente | Link público para o paciente preencher (M3) | Alta |
| 5 | Jornada paciente | Envio de link por e-mail/SMS (evolução de M3) | Média/longo |
| 6 | Jornada paciente | Lembrete de evolução (M8) | Média |
| 7 | Integração | Integração FHIR (M14) | Longo |
| 8 | Integração | Webhooks por tenant (M11) | Média |
| 9 | Integração | Política de versionamento API (doc + processo) | Média/longo |
| 10 | Dados | Export de sessão PDF/JSON (M4) | Alta |
| 11 | Dados | Dashboard com filtro de período (M6) | Média |
| 12 | Dados | Relatório por template (novo ou parte do dashboard) | Média |
| 13 | Dados | Export CSV de pacientes (novo) | Média |
| 14 | IA | AI_MODE=llm em produção (M5) | Alta |
| 15 | IA | Questionários CAT/IRT (evolução engine) | Longo |
| 16 | IA | Biblioteca de questionários (M13) | Longo |
| 17 | UX | Skeletons (M9) | Média |
| 18 | UX | Confirmação em ações destrutivas (M10) | Média |
| 19 | UX | A11y sistemática (M20) | Longo |
| 20 | UX | Modo escuro (M20) | Longo |
| 21 | Plataforma | Frontend no CI (já feito ou reforçar) | Alta |
| 22 | Plataforma | Testes no frontend (novo) | Alta |
| 23 | Plataforma | Health com dependências (M12) | Média |
| 24 | Plataforma | Métricas Prometheus (M19) | Longo |
| 25 | Segurança | 2FA TOTP (M17) | Longo |
| 26 | Segurança | Política de senha (histórico/expiração) | Longo |
| 27 | Segurança | Desativar/reativar usuário (M18) | Longo |

*M1 a M20 = melhorias numeradas na seção 3 do benchmark.*

---

## 2. Fases de execução

### Fase 1 – Fundação e plataforma (2–3 sprints)

**Objetivo:** Estabilizar CI, qualidade e segurança básica da operação.

| # | Entregável | Resolve gap(s) | Melhoria | Esforço |
|---|------------|----------------|----------|---------|
| 1.1 | Frontend no CI (job no workflow: lint + build) | 21 | — | Pequeno |
| 1.2 | Testes automatizados no frontend (Vitest + RTL; login, listas, fluxo anamnese crítico) | 22 | — | Médio |
| 1.3 | Health com dependências: `/ready` verifica Prisma (e opcional Redis/LLM) | 23 | M12 | Pequeno |
| 1.4 | Confirmação em ações destrutivas: modal “Tem certeza?” (remover usuário, desativar tenant) | 18 | M10 | Pequeno |

**Ordem sugerida:** 1.1 → 1.3 → 1.4 → 1.2.

---

### Fase 2 – Conformidade e jurídico (2 sprints)

**Objetivo:** Termo LGPD, política/termos acessíveis e assinatura eletrônica.

| # | Entregável | Resolve gap(s) | Melhoria | Esforço |
|---|------------|----------------|----------|---------|
| 2.1 | Termo de consentimento LGPD: tela/etapa no cadastro do paciente (e opcional antes da 1ª sessão); gravar versão + data; auditoria | 1 | M1 | Médio |
| 2.2 | Política de privacidade e termos de uso: página ou link externo; rodapé do app com link; aceite/versão no cadastro se necessário | 3 | (M1 / explícito) | Pequeno |
| 2.3 | Assinatura eletrônica na anamnese: nome + checkbox + timestamp; armazenar na sessão; passo antes de concluir (logado e público) | 2 | M2 | Médio |

**Ordem sugerida:** 2.2 → 2.1 → 2.3. *Detalhamento técnico em `PLANO_EXECUCAO_ITEM_2_E_3.md` (Item 2).*

---

### Fase 3 – Jornada do paciente (2–3 sprints)

**Objetivo:** Paciente preenche em casa; vínculo sessão–paciente e lembrete de evolução.

| # | Entregável | Resolve gap(s) | Melhoria | Esforço |
|---|------------|----------------|----------|---------|
| 3.1 | Link público para preencher: token na sessão, rotas públicas `/v1/public/fill/:token`, página `/fill/:token` (sem login) | 4 | M3 | Grande |
| 3.2 | Vincular paciente na criação da sessão + aba “Sessões” no detalhe do paciente | — | M7 | Médio |
| 3.3 | Lembrete de evolução na tela do paciente: “Última evolução há X dias. Registrar nova?” + botão | 6 | M8 | Pequeno |

**Ordem sugerida:** 3.1 → 3.2 → 3.3. *Detalhamento do link público em `PLANO_EXECUCAO_ITEM_2_E_3.md` (Item 3).*  
*Envio de link por e-mail/SMS (gap 5) pode ser evolução posterior de 3.1.*

---

### Fase 4 – Dados, relatórios e export (2 sprints)

**Objetivo:** Export de sessão, dashboard com período, relatório por template e CSV de pacientes.

| # | Entregável | Resolve gap(s) | Melhoria | Esforço |
|---|------------|----------------|----------|---------|
| 4.1 | Export de sessão: endpoint `GET .../sessions/:id/export?format=pdf|json` e botão na UI (PDF com respostas + resumo + riscos + recomendações) | 10 | M4 | Médio |
| 4.2 | Dashboard com filtro de período (7/30/90 dias); cards e gráficos respeitando o período; opcional `GET /v1/stats/dashboard?from=&to=` | 11 | M6 | Médio |
| 4.3 | Relatório por template: sessões no período, taxa de conclusão, tempo médio (se houver dado); tela ou seção no dashboard | 12 | — | Médio |
| 4.4 | Export CSV da lista de pacientes (nome, email, última evolução, nº sessões); botão na lista | 13 | — | Pequeno |

**Ordem sugerida:** 4.1 → 4.2 → 4.3 → 4.4.

---

### Fase 5 – IA em produção (1 sprint)

**Objetivo:** Insights com LLM real em produção.

| # | Entregável | Resolve gap(s) | Melhoria | Esforço |
|---|------------|----------------|----------|---------|
| 5.1 | AI_MODE=llm: integração OpenAI/Anthropic, env vars, validação Zod, retry; ativar e testar em produção | 14 | M5 | Médio |

*Regras de IA configuráveis (M16), CAT/IRT (gap 15) e biblioteca de questionários (gap 16 / M13) ficam para fases posteriores.*

---

### Fase 6 – UX (1–2 sprints)

**Objetivo:** Skeletons, a11y e modo escuro.

| # | Entregável | Resolve gap(s) | Melhoria | Esforço |
|---|------------|----------------|----------|---------|
| 6.1 | Skeletons de carregamento nas listas (templates, sessões, pacientes, usuários) e em detalhes | 17 | M9 | Médio |
| 6.2 | A11y: eslint-plugin-jsx-a11y; testes com axe-core em telas críticas (login, anamnese, formulários) | 19 | M20 | Médio |
| 6.3 | Modo escuro: toggle no layout, variáveis CSS, persistência em localStorage | 20 | M20 | Pequeno |

**Ordem sugerida:** 6.1 → 6.3 → 6.2.

---

### Fase 7 – Integração e observabilidade (1–2 sprints)

**Objetivo:** Webhooks, health já coberto na Fase 1, e preparação para observabilidade.

| # | Entregável | Resolve gap(s) | Melhoria | Esforço |
|---|------------|----------------|----------|---------|
| 7.1 | Webhooks por tenant: configuração URL + eventos (sessão concluída, insight gerado); POST com payload JSON; retry e log | 8 | M11 | Grande |
| 7.2 | Documentar política de versionamento da API (/v1/, depreciação, changelog) | 9 | — | Pequeno |
| 7.3 | Métricas Prometheus: contadores/latência por rota; endpoint `/metrics` | 24 | M19 | Médio |

**Ordem sugerida:** 7.1 → 7.2 → 7.3. *FHIR (gap 7 / M14) fica para longo prazo.*

---

### Fase 8 – Segurança e governança (1–2 sprints)

**Objetivo:** Desativar usuário, 2FA e política de senha.

| # | Entregável | Resolve gap(s) | Melhoria | Esforço |
|---|------------|----------------|----------|---------|
| 8.1 | Desativar/reativar usuário: flag “ativo” no membership; desativado não faz login; lista com filtro ativos/inativos | 27 | M18 | Médio |
| 8.2 | 2FA (TOTP) para owner/admin: ativação nas configurações; checagem no login | 25 | M17 | Grande |
| 8.3 | Política de senha: não reutilizar últimas N; expiração opcional (ex.: 90 dias) | 26 | — | Médio |

**Ordem sugerida:** 8.1 → 8.3 → 8.2.

---

### Fase 9 – Longo prazo / backlog

**Objetivo:** Itens de maior esforço ou dependentes de decisão de produto.

| # | Entregável | Resolve gap(s) | Melhoria | Esforço |
|---|------------|----------------|----------|---------|
| 9.1 | Envio de link por e-mail/SMS para o paciente preencher (evolução do link público) | 5 | (M3) | Grande |
| 9.2 | Biblioteca de questionários validados (PHQ-9, GAD-7, etc.): catálogo, import ou “usar como base” | 16 | M13 | Grande |
| 9.3 | Integração FHIR (Questionnaire / QuestionnaireResponse) | 7 | M14 | Muito grande |
| 9.4 | Portal do paciente (área logada para o paciente: sessões, evoluções, termos) | — | M15 | Grande |
| 9.5 | Regras de IA configuráveis por tag e thresholds (por tenant ou global) | — | M16 | Médio |
| 9.6 | Questionários adaptativos no estilo CAT/IRT (menos perguntas, mesma precisão) | 15 | — | Muito grande |

---

## 3. Visão por prioridade (alta / média / longo prazo)

### Alta prioridade (concluir nas Fases 1–5)

- **Plataforma:** Frontend no CI (1.1), testes frontend (1.2), health com dependências (1.3).
- **Conformidade:** Termo LGPD (2.1), política/termos (2.2), assinatura eletrônica (2.3).
- **Paciente:** Link público (3.1).
- **Dados:** Export PDF/JSON da sessão (4.1).
- **IA:** AI_MODE=llm em produção (5.1).
- **UX:** Confirmação em ações destrutivas (1.4).

### Média prioridade (Fases 3–7)

- Aba Sessões no paciente + vincular paciente (3.2), lembrete de evolução (3.3).
- Dashboard com período (4.2), relatório por template (4.3), export CSV pacientes (4.4).
- Skeletons (6.1), webhooks (7.1), health já em 1.3.
- A11y e modo escuro (6.2, 6.3) podem ser média ou longo conforme capacidade.

### Longo prazo (Fases 7–9)

- Prometheus (7.3), política de versionamento (7.2).
- Desativar usuário (8.1), política de senha (8.3), 2FA (8.2).
- Biblioteca de questionários (9.2), FHIR (9.3), portal do paciente (9.4), regras de IA (9.5), CAT/IRT (9.6), envio e-mail/SMS (9.1).

---

## 4. Cronograma sugerido (referência)

| Fase | Conteúdo principal | Sprints (estimativa) |
|------|--------------------|----------------------|
| 1 | CI frontend, health, confirmação destrutiva, testes frontend | 2–3 |
| 2 | Termo LGPD, política/termos, assinatura eletrônica | 2 |
| 3 | Link público, aba Sessões + vincular paciente, lembrete evolução | 2–3 |
| 4 | Export PDF/JSON, dashboard período, relatório template, CSV pacientes | 2 |
| 5 | AI_MODE=llm em produção | 1 |
| 6 | Skeletons, a11y, modo escuro | 1–2 |
| 7 | Webhooks, versionamento API, Prometheus | 1–2 |
| 8 | Desativar usuário, política senha, 2FA | 1–2 |
| 9 | Backlog longo prazo | Contínuo |

**Total estimado (Fases 1–8):** ~12–18 sprints (6–9 meses com time pequeno). Ajustar conforme capacidade e prioridade de negócio.

---

## 5. Dependências entre fases

- **Fase 1** não depende de outras; recomendada primeiro.
- **Fase 2** pode ser paralela ao final da Fase 1 (termo/assinatura independem de link público).
- **Fase 3** (link público) pode ser desenvolvida em paralelo à Fase 2; assinatura (2.3) integra bem ao fluxo do link (3.1) após ambos prontos.
- **Fase 4** depende apenas de sessões e insights existentes.
- **Fase 5** (LLM) independe das outras.
- **Fases 6–8** podem ser ordenadas por prioridade de produto (ex.: 8.1 desativar usuário antes de 2FA se gestão de pessoas for mais urgente).

---

## 6. Checklist resumido (27 gaps)

| # | Gap | Fase que resolve |
|---|-----|------------------|
| 1 | Sem termo LGPD | Fase 2 |
| 2 | Sem assinatura eletrônica | Fase 2 |
| 3 | Sem link política/termos | Fase 2 |
| 4 | Paciente não acessa / sem link preencher em casa | Fase 3 |
| 5 | Sem envio convite e-mail/SMS | Fase 9 |
| 6 | Sem lembrete de evolução | Fase 3 |
| 7 | Sem FHIR/EHR | Fase 9 |
| 8 | Sem webhooks tenant | Fase 7 |
| 9 | API sem política versionamento | Fase 7 |
| 10 | Sem export PDF/JSON sessão | Fase 4 |
| 11 | Dashboard sem filtro período | Fase 4 |
| 12 | Sem relatório por template | Fase 4 |
| 13 | Sem export CSV pacientes | Fase 4 |
| 14 | LLM não ativo | Fase 5 |
| 15 | Sem CAT/IRT | Fase 9 |
| 16 | Sem biblioteca questionários | Fase 9 |
| 17 | Sem skeletons | Fase 6 |
| 18 | Sem confirmação ações destrutivas | Fase 1 |
| 19 | Sem a11y sistemática | Fase 6 |
| 20 | Sem modo escuro | Fase 6 |
| 21 | Frontend fora do CI | Fase 1 |
| 22 | Sem testes frontend | Fase 1 |
| 23 | Health sem dependências | Fase 1 |
| 24 | Sem Prometheus | Fase 7 |
| 25 | Sem 2FA | Fase 8 |
| 26 | Sem política senha (histórico/expiração) | Fase 8 |
| 27 | Sem desativação usuário | Fase 8 |

---

*Documento de planejamento alinhado a `BENCHMARK_PLATAFORMAS_E_MELHORIAS.md`. Detalhes técnicos do Item 2 (assinatura) e Item 3 (link público) em `PLANO_EXECUCAO_ITEM_2_E_3.md`.*
