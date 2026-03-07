# Release R1 — “Ativação e Confiança”

## 2.1 Objetivo

Entregar uma primeira experiência mais curta e guiada, aumentar confiança em salvar/enviar/excluir e criar um “assistente” que direcione o próximo passo, com instrumentação de funis para iterações rápidas.

---

## 2.2 Entregáveis (checklist)

| Item | Status |
|------|--------|
| M5 + Backlog #3 — Estados de loading, toasts padronizados, mensagens de erro úteis e confirmações destrutivas (com “desfazer” quando possível) | ✅ |
| M3 + Backlog #2 — Microcopy em perguntas sensíveis + escalas com rótulos claros + opção “Prefiro não responder” onde fizer sentido | ✅ |
| M1 (MVP) + Backlog #1 — Onboarding em micro-etapas com barra de progresso, estimativa e “pular por agora”, com retomada | ✅ |
| F1 (MVP) + Backlog #5 — Painel “Próximas ações” com no máx. 5 itens, deep-links e estado vazio positivo | ✅ |
| Instrumentação básica — Eventos e funis para onboarding, questionários, ações críticas e uso do “Próximas ações” | ✅ |

---

## 2.5 Definition of Done

**Funcional**
- [x] Onboarding com progresso, estimativa, skip e retomada funcionando end-to-end
- [x] Ações críticas sempre mostram loading + sucesso/erro claros; destrutivas exigem confirmação específica
- [x] “Próximas ações” abre o fluxo correto (deep-link) e tem estado vazio

**Qualidade**
- [ ] Instrumentação ativa e validada (eventos aparecem no dashboard) — *validar em staging/prod*
- [ ] Fluxos críticos passam em QA (0 blockers; 0 regressões de alta severidade)
- [ ] Crash/erros monitorados pós-release com alerta básico

---

## 2.6 Métricas e eventos (instrumentação)

### Eventos implementados

| Evento | Onde |
|--------|------|
| `onboarding_started` | Primeira vez na tela de onboarding (passo 0) |
| `onboarding_step_view` | Cada visualização de passo (stepId, stepIndex) |
| `onboarding_step_complete` | Conclusão de passo (ação principal) |
| `onboarding_step_skip` | “Fazer depois” em um passo |
| `onboarding_finish` | Conclusão total ou “Pular tudo” (completedAll: boolean) |
| `onboarding_resume` | Retomada a partir de um passo salvo |
| `questionnaire_start` | Início do fluxo de questionário (sessionId) |
| `questionnaire_progress` | Avanço no questionário (completionPercent) |
| `questionnaire_complete` | Assinatura/envio final |
| `form_submit_success` / `form_submit_error` | Formulários (formId, action) |
| `action_critical_success` / `action_critical_error` | Ações críticas genéricas |
| `dashboard_first_action` | Clique em um item de Próximas ações (actionType, targetId) |
| `next_actions_viewed` | Dashboard exibido com painel Próximas ações (count) |

### Métricas-alvo (3–6)

1. Taxa de conclusão do onboarding e abandono por etapa  
2. Tempo até primeira ação após login  
3. Taxa de conclusão de questionários + drop-off por página  
4. Taxa de sucesso/erro em salvar/enviar/excluir (e retries)  
5. Uso do “Próximas ações” (view → click → completion)  

### Hipóteses

- **H1**: Onboarding progressivo aumenta conclusão e ativa D7  
- **H2**: Feedbacks reduzem retries e tickets  
- **H3**: Próximas ações reduz tempo até primeira ação e aumenta DAU  

---

## 2.8 Release notes (3–6 bullets)

- Onboarding mais rápido e com etapas claras (barra de progresso, estimativa de tempo, “pular por agora” e retomada depois)
- Feedbacks visuais em salvar/enviar e confirmações em ações destrutivas
- Questionários com explicações em perguntas sensíveis e opção “Prefiro não responder” quando disponível
- Novo painel de Próximas Ações no dashboard (até 5 itens com links diretos; estado vazio “Você está em dia!”)
- Mensagens de erro mais claras em caso de falha de rede ou servidor

---

## Materiais para suporte (FAQ)

As três perguntas abaixo estão na **Central de Ajuda** (menu Ajuda ou `/help`), buscáveis por título ou tags:

1. **Por que estou vendo “perfil incompleto”?**  
   - Artigo: `r1-perfil-incompleto` (categoria Conta e login).  
   - Tags: onboarding, perfil, configuração, pular.

2. **Como sei que salvou?**  
   - Artigo: `r1-como-sei-que-salvou` (categoria Avaliações e questionários).  
   - Tags: salvar, feedback, toast, confirmação.

3. **O que são Próximas Ações?**  
   - Artigo: `r1-proximas-acoes` (categoria Conta e login).  
   - Tags: dashboard, próximas ações, tarefas, foco.

**Playbook CS**: Redirecionar dúvidas de onboarding, “salvou?” e “o que são próximas ações?” para a Central de Ajuda (link direto ou busca por essas expressões).

---

## Checklist QA (pré-release)

- [ ] Login → onboarding (completar e pular) → dashboard
- [ ] Dashboard: Próximas ações (com e sem itens); clique em um item leva ao fluxo correto
- [ ] Salvar paciente / enviar questionário: loading no botão, toast de sucesso ou erro
- [ ] Exclusão (ex.: remover meta/execução): modal de confirmação com texto específico; sucesso/erro visível
- [ ] Questionário: pergunta com `description` exibe microcopy; “Prefiro não responder” quando `allowPreferNotToAnswer`
- [ ] Erro de rede: mensagem “Verifique sua conexão ou tente novamente em instantes”
- [ ] Eventos: em dev, `console.debug` mostra `onboarding_started`, `next_actions_viewed`, `dashboard_first_action` etc. (validar em staging com ferramenta de analytics)

---

## Rollout

- **Comunicação in-app**: Banner “Novidades” no dashboard (duas mensagens + link para Ajuda), dispensável uma vez por usuário (`releaseR1BannerDismissed`).
- **Feature flag / %**: Opcional; se usado, controlar exibição do banner e do painel Próximas ações por segmento.
