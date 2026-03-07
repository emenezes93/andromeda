# Release R2 — “Encontrabilidade e Acessibilidade”

## 2.1 Objetivo

Reorganizar navegação para refletir tarefas reais e tornar a interface mais legível e inclusiva (contraste/tipografia/foco), reduzindo “perda de tempo procurando” e aumentando conforto no uso diário, além de iterar R1 com dados.

---

## 2.2 Entregáveis (checklist)

| Item | Status |
|------|--------|
| M2 + Backlog #4 — Menu/taxonomia orientada a tarefas (máx. 5–7 entradas, tooltips, redirects) | ✅ |
| M4 + Backlog #7 — Pacote de acessibilidade (WCAG AA nos fluxos críticos, fonte base, foco visível) | ✅ |
| Ajustes M1/F1 — Melhorias guiadas por dados (etapas com maior abandono, regras do “próximas ações”) | Contínuo |

---

## 2.3 WBS (resumo)

- **Produto**: IA/taxonomia do menu; plano de migração (redirects, rollout).
- **Design/UX**: Protótipos do novo menu; auditoria de acessibilidade (tokens, contraste, foco).
- **Front-end**: Novo menu + tooltips + redirects; ajustes de foco/teclado e tamanho base.
- **Back-end**: Compatibilidade de rotas/deep-links.
- **QA**: Teste de navegação (encontrabilidade) + checklist acessibilidade.
- **Data**: Cliques por tarefa; “não encontrei” (proxy: navegação repetida); eventos de navegação.
- **Suporte**: Central “o que mudou” + artigo “onde encontro X agora?” + roteiro do tour.

---

## 2.5 Definition of Done

- **Navegação**: Nova com redirects funcionando e comunicação entregue.
- **Acessibilidade**: Fluxos críticos atendem WCAG AA (contraste/foco/legibilidade).
- **Dados**: Instrumentação para cliques por tarefa e tickets “não achei”; métricas indicam melhora (ou baseline estabelecido).

---

## 2.6 Métricas e eventos

### Eventos implementados (R2)

| Evento | Onde |
|--------|------|
| `nav_item_clicked` | Clique em item do menu (item: path, origin: 'sidebar' \| 'mobile') |
| `page_viewed` | Mudança de rota (route, context opcional) |
| `tour_started` | Abertura do tour “menu por tarefas” (tourId: 'r2-menu') |
| `tour_completed` | Usuário clicou “Entendi” no tour |
| `tour_skipped` | Usuário fechou o tour sem concluir |

Reutilizar eventos R1 para comparar antes/depois.

### Métricas-alvo

1. Cliques médios para: abrir paciente / iniciar sessão / acessar relatórios  
2. NPS (ou CSAT) de usabilidade pós-mudança  
3. Tickets “não encontrei X”  
4. Taxa de ativação/uso de “próximas ações” após ajustes  

### Hipóteses

- **H4**: Menu por tarefas reduz esforço e aumenta engajamento.  
- **H5**: Acessibilidade melhora eficiência e reduz fricção.  

---

## 2.7 Plano de validação

- **Usabilidade**: Teste moderado com tarefas (8 usuários: profissionais variados) comparando “encontrar X” antes/depois.  
- **Técnico**: Regressão de rotas + verificação de redirects + monitoramento de erros 404/rotas inválidas.  
- **QA**: Checklist acessibilidade (foco/teclado/contraste) + regressão.  

---

## 2.8 Comunicação

### In-app

- **Título**: “O menu mudou (para ficar mais simples)”  
- **Texto**: “Organizamos por tarefas: Pacientes, Agenda, Relatórios e mais. Faça um tour de 30s.”  
- Banner dispensável (`releaseR2BannerDismissed`); botão “Fazer tour” abre modal com resumo do menu.  

### Release notes

- Menu reorganizado por tarefas (Início, Pacientes, Avaliações, Questionários, Planos, Relatórios, Ajuda; Administração no final).  
- Melhorias de legibilidade (fontes/contraste) e foco visível (WCAG AA).  
- Ajustes no onboarding e Próximas Ações baseados em dados.  

### Suporte

- **Artigo**: “Onde encontro X agora?” na Central de Ajuda (`/help#onde-encontro`).  
- Conteúdo: mapeamento “onde estava → onde está” + referência ao tour de 30s.  
- Roteiro do tour e imagens do novo menu para macros/CS.  

---

## Materiais para suporte (FAQ)

Na **Central de Ajuda** (`/help`), artigo:

- **Onde encontro X agora? (O que mudou no menu)**  
  - ID: `onde-encontro` (categoria Conta e login).  
  - Acesso direto: `/help#onde-encontro`.  
  - Tags: menu, navegação, tour, R2, encontrabilidade.  
  - Conteúdo: mapeamento templates → Questionários; avaliações/sessões → Avaliações; planos (dieta, treino, agendamentos) em Planos; audit/IA em Relatórios; administração no final. Referência ao “Fazer tour” no dashboard.  

**Playbook CS**: Encaminhar “onde está X?” e “o menu mudou” para o artigo “Onde encontro X agora?” ou sugerir o tour no dashboard.  

---

## Checklist QA (pré-release)

- [ ] Navegação: todos os itens do menu (incl. Planos e Relatórios expandidos) levam à rota correta; redirect `/dashboard` → `/`
- [ ] Tooltips visíveis no hover (desktop) nos itens do menu
- [ ] Banner R2 no dashboard: título, mensagem, “Fazer tour”, dispensar
- [ ] Tour: abrir → conteúdo “Menu por tarefas”; “Entendi” fecha e dispensa banner; “Ver artigo” leva a `/help#onde-encontro`; fechar sem “Entendi” dispara skip
- [ ] Acessibilidade: foco visível em links/botões do menu; contraste e fonte base conforme design system
- [ ] Eventos: em dev, `console.debug` mostra `nav_item_clicked`, `page_viewed`, `tour_started`, `tour_completed`, `tour_skipped`
- [ ] Help: `/help#onde-encontro` abre o artigo “Onde encontro X agora?”

---

## Rollout

- **Comunicação in-app**: Banner R2 no dashboard (“O menu mudou…”) + tour opcional de 30s; dispensável por usuário (`releaseR2BannerDismissed`).  
- **Rollout gradual**: Opcional; comunicar “o que mudou” e disponibilizar artigo + tour para reduzir confusão.  
