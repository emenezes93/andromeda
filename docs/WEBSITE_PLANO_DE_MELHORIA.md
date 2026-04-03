# Plano de melhoria — Site (landing) Fit Insight

Baseado na análise em `WEBSITE_ANALISE_UIUX_E_MELHORIAS.md`. Ordem de execução e critérios de conclusão.

---

## Fase 1 — Infraestrutura e conversão

| # | Tarefa | Critério de conclusão |
|---|--------|------------------------|
| 1.1 | Variável de ambiente `VITE_APP_URL` para URL da aplicação | `.env.example` no website; links de Entrar/Cadastre-se usam a variável |
| 1.2 | Todos os CTAs apontam para login ou signup reais | Nenhum `href="#"` em Entrar, Começar grátis, Assinar, etc. |

---

## Fase 2 — Acessibilidade (a11y)

| # | Tarefa | Critério de conclusão |
|---|--------|------------------------|
| 2.1 | Skip link "Pular para o conteúdo" | Link no topo do body, visível no foco, leva a `#main-content` |
| 2.2 | Main com id e aria-label | `<main id="main-content" aria-label="Conteúdo principal">` |
| 2.3 | Menu mobile com aria dinâmico | `aria-label` Abrir/Fechar menu e `aria-expanded` |
| 2.4 | Respeitar prefers-reduced-motion | Animações de mesh e text-gradient desligadas ou simplificadas quando `prefers-reduced-motion: reduce` |
| 2.5 | Contraste no footer | Texto secundário com contraste ≥ 4.5:1 (ex.: text-white/50 e text-white/40) |
| 2.6 | Footer com navegação semântica | Grupos de links em `<nav aria-label="...">` |
| 2.7 | IconPulse decorativo | `aria-hidden` onde o texto "Fit Insight" já identifica o link |

---

## Fase 3 — Conteúdo e credibilidade

| # | Tarefa | Critério de conclusão |
|---|--------|------------------------|
| 3.1 | Ortografia pt-BR em toda a landing | Acentuação correta: avaliação, saúde, questionários, grátis, preços, nós, única, etc. |
| 3.2 | Aviso de dados ilustrativos (hero/prova social) | Texto discreto tipo "Dados ilustrativos" ou remoção dos números fictícios; definido no plano |

---

## Fase 4 — SEO e polish

| # | Tarefa | Critério de conclusão |
|---|--------|------------------------|
| 4.1 | Meta description e og em pt-BR | index.html com descrição e og:description com acentos |
| 4.2 | og:image | Meta tag presente; asset pode ser adicionado depois em /brand/ |

---

## Ordem de execução (esta sessão)

1. Fase 1 (env + CTAs)
2. Fase 2 (skip link, main, menu, reduced motion, footer contraste e nav, IconPulse)
3. Fase 3 (ortografia)
4. Fase 4 (meta e og:image placeholder)

---

## Execução realizada

- **Fase 1:** `website/.env.example` com `VITE_APP_URL`; `website/src/config/app.ts` com `getLoginUrl()` e `getSignupUrl()`; todos os CTAs (Header, Hero, CTASection, Pricing) usam essas funções.
- **Fase 2:** Skip link "Pular para o conteúdo" em `App.tsx`; `<main id="main-content" aria-label="Conteúdo principal">`; menu mobile com `aria-label` dinâmico, `aria-expanded`, `aria-controls`, `id="mobile-menu"`, touch targets 44px; `index.css` com `@media (prefers-reduced-motion: reduce)`; footer com contraste aumentado (text-white/60, text-white/50) e blocos em `<nav aria-label="...">`; `IconPulse` com `aria-hidden` e suporte a `...rest`.
- **Fase 3:** Ortografia pt-BR corrigida em Hero, SocialProof, Features, ForProfessionals, ForPatients, Pricing, CTASection, Testimonials, Footer.
- **Fase 4:** Meta description e og:description com acentos; `og:image` apontando para `/og-image.png` (asset a adicionar em `/website/public` ou CDN).
- **Extras:** `website/src/vite-env.d.ts` para tipos do Vite; utilitários `.sr-only` e `.focus\:not-sr-only` em `index.css` para o skip link.
