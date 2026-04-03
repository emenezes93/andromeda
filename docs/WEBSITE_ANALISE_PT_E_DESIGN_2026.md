# Análise do site (landing) — Português e design

Data: 2026-03. Escopo: `website/` (Fit Insight).

---

## 1. Erros de português (pt-BR)

### 1.1 Ortografia / acentuação

| Local | Atual | Correção |
|-------|--------|----------|
| **Features.tsx** (título do card) | Evolucao visual | Evolução visual |
| **ForProfessionals.tsx** (tag mockup) | Avaliacao pendente | Avaliação pendente |
| **ForProfessionals.tsx** (tag mockup) | 3d sem treinar | 3 dias sem treinar |
| **ForPatients.tsx** (label) | Nivel | Nível |
| **ForPatients.tsx** (treino) | Triceps | Tríceps |
| **ForPatients.tsx** (label) | 3 de 5 exercicios | 3 de 5 exercícios |
| **ForPatients.tsx** (quick action) | Evolucao | Evolução |
| **ForPatients.tsx** (parágrafo) | refeicoes / evolucao / gamificacao / aderencia | refeições / evolução / gamificação / aderência |

### 1.2 Redação e consistência

- **SocialProof:** "Confiado por profissionais" — aceitável; alternativas: "Recomendado por" ou "A escolha de profissionais".
- **SocialProof:** O número "4.8" com label "Avaliação" podia ser confundido com a quantidade "Avaliações"; **corrigido** para "Nota média".
- **Header:** Link "Sobre" apontava para `#depoimentos`. **Corrigido:** label alterado para "Depoimentos" para coincidir com o destino.

---

## 2. Design e UX

### 2.1 Navegação e conteúdo

- **Header:** **Corrigido** — label alterado de "Sobre" para "Depoimentos" para coincidir com `#depoimentos`.
- **Pricing:** CTA "Falar com vendas" (plano Pro) usa o mesmo `getSignupUrl()` dos outros planos. Se a ideia é contato comercial, usar outro link (ex.: mailto ou página de contato) ou manter e documentar.

### 2.2 Acessibilidade

- **Skip link:** **Corrigido** — adicionado `focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary` para indicador de foco visível além da cor.

### 2.3 Footer

- Links "Empresa" e "Legal" ainda com `href="#"`. Quando houver páginas/URLs reais, atualizar (e, se aplicável, usar `getAppUrl()` para links internos).

### 2.4 Consistência visual

- Espaçamento entre seções: `py-26 sm:py-30` — consistente.
- CTAs primários (Cadastre-se grátis, Começar grátis) — uso de `getSignupUrl()` uniforme.
- Paleta (primary, accent, dark, surface, content, border) — uso coerente nos componentes.

### 2.5 Responsividade e componentes

- Header com menu mobile (hambúrguer), touch targets 44px e aria-expanded — ok.
- Grid de planos: `sm:grid-cols-2 lg:grid-cols-4` — comportamento esperado em telas pequenas/médias/grandes.
- Cards de features e depoimentos com `bento-card` e reveal — sem inconsistências aparentes.

---

## 3. Resumo de ações

| Prioridade | Ação | Status |
|------------|------|--------|
| Alta | Corrigir todas as formas sem acento (Evolução, Avaliação, Nível, Tríceps, exercícios, refeições, evolução, gamificação, aderência, "3 dias sem treinar"). | Feito |
| Média | Ajustar skip link: manter foco visível (ring) em vez de só outline-none. | Feito |
| Média | Alinhar label do menu: "Sobre" → "Depoimentos" se o destino for `#depoimentos`. | Feito |
| Baixa | Considerar "Nota média" no SocialProof para o "4.8". | Feito |
| Baixa | Definir destino do CTA "Falar com vendas" (vendas/contato) e links do footer quando existirem. | Pendente (quando houver página/contato) |

---

## 4. Arquivos revisados

- `website/index.html`
- `website/src/App.tsx`
- `website/src/components/Header.tsx`
- `website/src/components/Hero.tsx`
- `website/src/components/SocialProof.tsx`
- `website/src/components/Features.tsx`
- `website/src/components/ForProfessionals.tsx`
- `website/src/components/ForPatients.tsx`
- `website/src/components/Pricing.tsx`
- `website/src/components/CTASection.tsx`
- `website/src/components/Testimonials.tsx`
- `website/src/components/Footer.tsx`
