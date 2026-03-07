# Relatório de Análise UI/UX — Anamnese Inteligente PaaS

**Data:** Março 2025  
**Escopo:** Frontend (React + Vite), design system, usabilidade e legibilidade.  
**Objetivo:** Avaliação severa e prática da usabilidade e do entendimento da plataforma.

---

## 1. Resumo executivo

A plataforma tem **base sólida** (tokens, acessibilidade básica, feedback por toasts, fluxos críticos funcionais), mas sofre de **inconsistências de hierarquia**, **sobrecarga de informação em telas centrais**, **navegação densa** e **falta de padrão único em listas e formulários**. A leitura e o entendimento são **medianos**: funcionam para usuários já familiarizados; para novos usuários, a curva de aprendizado e a descoberta de funções são prejudicadas.

| Dimensão            | Nota (1–5) | Comentário breve                                      |
|--------------------|------------|--------------------------------------------------------|
| Consistência visual | 3,5        | Tokens bons; uso desigual em páginas e componentes.   |
| Hierarquia / leitura | 3        | H1 duplicados, títulos genéricos, pouco agrupamento.  |
| Usabilidade (fluxos) | 3,5      | Fluxo de anamnese bom; listas e detalhes confusos.    |
| Navegação           | 3          | Sidebar longa, submenus, muitos CTAs por página.      |
| Formulários         | 3,5        | Input/Button acessíveis; layouts longos e repetitivos.|
| Feedback / erro     | 4          | Toasts, estados de loading e erro bem utilizados.     |
| Responsividade      | 3,5        | Mobile tratado; tabelas e cards podem quebrar.       |
| Acessibilidade      | 4          | Focus, sr-only, live regions; alguns gaps.            |

---

## 2. Pontos fortes

### 2.1 Design system e tokens
- **CSS variables** para cores, radius, sombras e **dark mode** bem integrado.
- **Tipografia** com escala semântica (`text-body-sm`, `text-heading`, etc.) e line-height definido.
- **Contraste** considerado (WCAG AA citado em comentários; tokens de conteúdo vs. superfície).
- **Focus visible** e utilitário `.sr-only` e skip-link para conteúdo principal.

### 2.2 Feedback e estados
- **Toasts** com variantes (success, error, info, warning), ação opcional e integração com handler global de erro da API.
- **Loading** tratado (skeleton em listas, spinner em fluxos, soft refresh com indicador).
- **Erro** com mensagem + “Tentar novamente” ou “Voltar” de forma consistente.

### 2.3 Fluxo de anamnese (AnamnesisFlowPage)
- Barra de progresso com percentual e tempo estimado.
- Aviso prévio sobre assinatura ao final.
- “Prefiro não responder” e botão “Pergunta anterior” reduzem ansiedade.
- Step atual destacado; `role="progressbar"` e `aria-live` para leitores de tela.

### 2.4 Componentes reutilizáveis
- **Input** com `label`, `error`, `hint` e `aria-describedby`/`aria-invalid`.
- **Button** com variantes e estado de loading acessível (sr-only “Carregando...”).
- **Card** com `title` e padding consistente; **Breadcrumbs** com `aria-current`.
- **Pagination** e **ConfirmModal** presentes e usados em listas/fluxos.

### 2.5 Encontrabilidade e ajuda
- Central de ajuda com busca e categorias.
- Tour (R2) e banners de release para novidades.
- Link “Ajuda” no footer e em avisos.

---

## 3. Problemas críticos e severos

### 3.1 Hierarquia e duplicação de títulos
- **PageLayout** injeta um **H1** quando a rota tem `title` (ex.: “Pacientes”, “Novo paciente”).
- Várias páginas repetem o mesmo texto em **título de Card** ou em **h2** (ex.: formulário “Novo paciente” com H1 “Novo paciente” + Card “Novo paciente”).
- Em **PatientDetailPage** a rota não passa `title`; o primeiro cabeçalho é **h2** (nome do paciente). **Não há H1** na página, prejudicando estrutura e SEO/acessibilidade.
- **Recomendação:** Uma única fonte de verdade por página: ou H1 no layout (e Cards sem repetir o título da página), ou H1 na página e layout sem H1. Garantir sempre um H1 por página.

### 3.2 Dashboard sobrecarregado
- Muitos blocos em sequência: saudação, período, **até 3 banners de release**, CTA onboarding, Próximas ações, 4 cards de estatísticas, “Meus alunos”, “Pacientes que precisam de atenção”, Notificações, Uso do plano, Conquistas, 2 gráficos, tabela de sessões recentes.
- **Próximas ações** e **Pacientes que precisam de atenção** têm funções parecidas (ações contextuais); não fica claro quando usar cada um.
- Muitos CTAs (links e botões) competem entre si; não há prioridade visual clara.
- **Recomendação:** Agrupar por “Hoje / Ações” vs “Visão geral / Métricas” vs “Atividade recente”; colapsar ou rotacionar banners; reduzir CTAs acima da dobra ou hierarquizar por importância.

### 3.3 Página de detalhe do paciente (PatientDetailPage)
- **Muitas abas:** Dados, Avaliações, Planos de Treino, Treinos Realizados, Fotos, Metas — com contadores que carregam sob demanda. Usuário pode não perceber onde está a informação desejada.
- **Barra de ações** no topo com 5+ botões (Editar, Hub, Nova avaliação, Dieta, Voltar) em linha; em mobile vira wrap e poluição visual.
- Formulários **inline** (ex.: nova execução, nova foto) dentro das abas aumentam complexidade e risco de abandono.
- **Recomendação:** Agrupar ações primárias (ex.: “Nova avaliação”) e secundárias (Editar, Hub, Dieta) em um menu de ações ou padrão “primary + overflow”; considerar abas em dois níveis ou seções colapsáveis em vez de 6 abas no mesmo nível.

### 3.4 Navegação lateral (sidebar)
- **Muitos itens** de primeiro nível (Início, Pacientes, Avaliações, Questionários, Planos com 3 subitens, Relatórios com 2 subitens, Ajuda) + usuário (badge, alertas, idioma, tema).
- Submenus “Planos” e “Relatórios” dependem de expandir; usuários podem não descobrir “Histórico de atividades” ou “Agendamentos”.
- **Recomendação:** Reduzir itens visíveis (agrupando “Questionários” e “Avaliações” ou “Planos” em um único destino com subpáginas); ou usar mega-menu / painel ao hover para subitens; manter no máximo 5–7 itens principais.

### 3.5 Listas: inconsistência de padrão
- **Pacientes:** grid de cards com busca, contador, paginação e “Export CSV”.
- **Avaliações (Sessions):** tabela com filtros (status, template, paciente), contador e “Nova avaliação”.
- **Templates:** padrão pode divergir (lista vs. cards).
- Falta um **padrão único** para “lista com filtros + ação principal + resultado (tabela ou cards) + paginação”.
- **Recomendação:** Definir um layout padrão para listas (ex.: barra com busca/filtros + ação primária; depois resultado em tabela responsiva ou cards; paginação e contador sempre no mesmo lugar) e replicar em Pacientes, Avaliações, Questionários, etc.

### 3.6 Formulários longos
- **PatientFormPage** (e equivalentes) têm muitos campos em uma única página (nome, nascimento, gênero, CPF, email, telefone, profissão, objetivo, queixa, notas, consentimento).
- Pouco agrupamento visual (seções com subtítulos) ou steps; scroll longo e sensação de “formulário infinito”.
- **Recomendação:** Agrupar em seções (Dados pessoais, Contato, Objetivo e queixa, Observações) com headings e, se possível, steps ou accordion para reduzir carga cognitiva.

### 3.7 Tabelas em viewports pequenos
- Dashboard e Sessions list usam **tabelas** com várias colunas; `overflow-x-auto` existe, mas em mobile a leitura fica difícil e o contexto (template, status, data) se perde ao rolar.
- **Recomendação:** Em breakpoint pequeno, trocar por lista de cards (uma “linha” por card) ou por tabela com colunas prioritárias (ex.: data, nome, status) e detalhes em expansão ou em página de detalhe.

---

## 4. Problemas moderados

### 4.1 Uso desigual de Breadcrumbs
- PatientDetailPage e PatientFormPage usam **Breadcrumbs**; outras páginas (Dashboard, listas, SessionDetail) não.
- Quem entra por link direto ou após refresh perde contexto de “onde estou” em algumas telas.
- **Recomendação:** Usar Breadcrumbs em todas as páginas de conteúdo (exceto Dashboard e Login), com regra: Início > Seção > Subpágina > Item (quando aplicável).

### 4.2 Rótulos e microcopy
- Mistura de termos: “Avaliações” vs “Questionários” vs “Sessões”; “Planos” (dieta/treino) vs “Agendamentos”.
- Alguns botões genéricos (“Voltar”, “Ver”) sem contexto; “Ver” na tabela de sessões pode ser “Ver detalhes” ou “Ver insights”.
- **Recomendação:** Glossário interno e rótulos únicos por conceito; botões com texto específico (ex.: “Ver detalhes”, “Ver insights”, “Continuar questionário”).

### 4.3 Select nativos sem estilo unificado
- Vários `<select>` (período no dashboard, status/template em Sessions, gênero em formulários) usam classes locais (`rounded-button border border-border...`) em vez de um componente **Select** do design system.
- **Recomendação:** Criar componente `Select` (ou estender Input) com a mesma linguagem visual do Input/Card e usar em todo o app.

### 4.4 Densidade de informação em cards
- Cards de paciente na listagem mostram nome, gênero, CPF, email e contadores; em telas pequenas o texto pode truncar ou quebrar de forma estranha.
- **Recomendação:** Em mobile, priorizar nome + um indicador (ex.: “X avaliações”) e mover CPF/email para a página de detalhe ou tooltip.

### 4.5 Estado vazio
- Empty states existem (ex.: “Nenhum paciente”, “Nenhuma sessão”) com CTA, mas a mensagem e o desenho variam entre páginas.
- **Recomendação:** Padronizar componente “Empty state” (ilustração ou ícone + título + descrição + CTA principal) e reutilizar em listas e seções vazias.

---

## 5. Leitura e entendimento

### O que funciona
- **Cores semânticas** (success, error, warning) e badges ajudam a escanear status.
- **Tipografia** com tamanhos e pesos distintos para título vs. corpo.
- **Espaçamento** em cards e entre seções (`space-y-6`, `gap-4`) evita amontoamento.

### O que atrapalha
- **Excesso de elementos** na mesma tela (dashboard, detalhe do paciente) dificulta saber “por onde começar”.
- **Falta de hierarquia clara** entre “informação principal” e “secundária” em algumas listas e detalhes.
- **Títulos duplicados** (H1 + Card title) e ausência de H1 em detalhe de paciente confundem leitura lógica e leitores de tela.
- **Terminologia** inconsistente atrasa o modelo mental do usuário (“é avaliação ou questionário?”).

---

## 6. Praticidade da usabilidade

### Fluxos que funcionam bem
- **Login** (incl. 2FA): claro, com feedback de erro e ThemeToggle visível.
- **Nova avaliação → Fluxo de anamnese → Assinatura → Insights:** progresso visível e reversível (voltar pergunta).
- **Lista de pacientes:** busca com debounce, export e “Novo paciente” bem posicionados.

### Fluxos que custam mais
- **Encontrar “Histórico de atividades” ou “Uso de IA”:** exigem expandir “Relatórios” na sidebar.
- **Registrar evolução do paciente:** depende de ver o card “Última evolução há X dias” na página do paciente; quem não desce a página pode não ver.
- **Trocar entre “dados do paciente”, “avaliações”, “treinos”, “fotos”, “metas”:** muitas abas e contadores que carregam sob demanda; custo cognitivo alto.

---

## 7. Recomendações prioritárias

1. **Hierarquia e H1:** Corrigir duplicação de títulos e garantir um único H1 por página; em detalhes (ex.: paciente), usar H1 para o nome do recurso.
2. **Dashboard:** Reduzir blocos acima da dobra; agrupar por “Ações”, “Métricas” e “Atividade”; colapsar ou limitar banners.
3. **Patient detail:** Reduzir botões no header (agrupar em “Ações” ou overflow); considerar menos abas ou agrupamento (ex.: “Dados e avaliações” vs “Treino e fotos” vs “Metas”).
4. **Sidebar:** Reduzir itens de primeiro nível ou agrupar em mega-menu; manter submenus descobríveis (não só por expandir).
5. **Listas:** Padronizar layout (filtros + ação + resultado + paginação) e, em mobile, preferir cards ou lista compacta em vez de tabela larga.
6. **Formulários:** Agrupar campos em seções com títulos; considerar steps para formulários muito longos.
7. **Componente Select e Empty state:** Unificar selects e empty states no design system.
8. **Glossário e rótulos:** Fixar termos (Avaliação vs Questionário vs Sessão) e usar em toda a UI; botões com texto específico.

---

## 8. Conclusão

A plataforma é **utilizável e acessível na base**, com design system coerente e fluxos críticos (login, anamnese, feedback) bem resolvidos. Os principais problemas são **organização da informação** (dashboard e detalhe do paciente), **navegação densa**, **hierarquia de títulos** e **inconsistência entre listas e formulários**. Melhorar hierarquia, reduzir ruído nas telas centrais e padronizar listas, formulários e navegação tende a aumentar de forma relevante a **praticidade** e o **entendimento** da plataforma, especialmente para novos usuários.

---

*Relatório gerado com base na análise do código-fonte do frontend (PageLayout, Dashboard, Patients, Sessions, AnamnesisFlow, formulários, componentes de UI e design tokens).*
