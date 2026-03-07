# Branding Book — Anamnese Inteligente PaaS (Andromeda)

**Versao:** 1.0 | **Data:** Marco 2026
**Produto:** Plataforma SaaS multi-tenant para profissionais de saude e fitness

---

## 1. IDENTIDADE DA MARCA

### 1.1 Nome e Tagline

- **Nome do produto:** Anamnese Inteligente
- **Nome interno/codigo:** Andromeda
- **Short name (PWA):** Anamnese PaaS
- **Tagline:** "Questionarios adaptativos e insights em saude"
- **Descricao longa:** Plataforma de anamnese inteligente: questionarios adaptativos, insights em saude e acompanhamento de pacientes.

### 1.2 Personalidade da Marca

| Atributo | Descricao |
|----------|-----------|
| **Tom** | Profissional, acolhedor, confiavel |
| **Voz** | Direta e clara, sem jargao tecnico excessivo; empatica quando lida com dados sensiveis de saude |
| **Posicionamento** | Ferramenta inteligente que potencializa o profissional — nao substitui, empodera |
| **Valores** | Precisao, privacidade (LGPD), acessibilidade, simplicidade |
| **Publico** | Personal trainers, nutricionistas, fisioterapeutas e seus pacientes/alunos |

### 1.3 Linguagem

- **Idiomas:** Portugues brasileiro (pt-BR) primario, Ingles (en-US) secundario
- **Glossario de termos na UI:**

| Termo na UI | Significado tecnico |
|-------------|---------------------|
| **Avaliacao** | Sessao de anamnese com um paciente (Session) |
| **Questionario** | Template de perguntas reutilizavel (AnamnesisTemplate) |
| **Anamnese** | O fluxo de perguntas e respostas durante uma avaliacao |
| **Plano** | Plano de dieta ou de treino atribuido a um paciente |
| **Agendamentos** | Questionarios agendados para envio recorrente |
| **Insights** | Analise de IA gerada a partir das respostas |

---

## 2. LOGOTIPO E ICONE

### 2.1 Marca Principal (IconPulse)

O logo e um **pulso ECG estilizado** (eletrocardiograma) dentro de um retangulo arredondado, representando saude + tecnologia.

**Construcao SVG (favicon.svg):**
- ViewBox: 32x32
- Retangulo de fundo: `rx="8"` (cantos arredondados), preenchido com gradiente linear diagonal
  - Gradiente: `#0ea5e9` (sky-500) → `#0284c7` (sky-600) em 45 graus
- Traçado ECG: Representa onda P, complexo QRS e onda T de um eletrocardiograma
  - `stroke="white"`, `stroke-width="1.25"`, `stroke-linecap="round"`, `stroke-linejoin="round"`
  - Path: `M5 18h3v-4h2v8h2V12h2v6h2v-4h3v6h2`

**Componente IconPulse (simplificado para uso inline):**
- Path simplificado: `M6 18h4v-2h2v6h2v-8h2v4h4`
- `stroke-width="1.5"`, fundo `currentColor` com classe `text-primary`

**Tamanhos padrao:**
- Favicon: SVG responsivo (qualquer tamanho)
- Login page: `size-14` (56px)
- Sidebar: `size-8` (32px)
- Apple touch icon: SVG

**Comportamentos:**
- Na tela de login: animacao `login-logo-glow` — pulsacao suave com drop-shadow primario
- Fundo: cor primaria (`--color-primary`)
- Traco: branco ou `currentColor`

### 2.2 Regras de Uso

- O logo deve sempre usar a cor primaria como fundo
- Em fundos escuros (dark mode), a cor primaria ajusta automaticamente (`#38bdf8`)
- Nunca usar o logo em fundos que comprometam o contraste (< 3:1)
- Espaco minimo ao redor: 8px (25% do tamanho do icone)

---

## 3. PALETA DE CORES

### 3.1 Cores Primarias

A identidade visual usa **azul saude** (sky blue) como cor primaria — transmite confianca, profissionalismo e calma.

| Token | Light Mode | Dark Mode | Uso |
|-------|-----------|-----------|-----|
| `--color-primary` | `#0ea5e9` (Sky 500) | `#38bdf8` (Sky 400) | Botoes, links, icones ativos, foco |
| `--color-primary-hover` | `#0284c7` (Sky 600) | `#0ea5e9` (Sky 500) | Hover em botoes e links |
| `--color-primary-subtle` | `#e0f2fe` (Sky 50) | `#0c4a6e` (Sky 900) | Backgrounds sutis, badges, hover ghost |
| `--color-primary-light` | `#bae6fd` (Sky 200) | `#075985` (Sky 800) | Bordas de badges, destaques leves |

**Cor tema (meta tag):** `#0ea5e9`
**Cor de fundo PWA:** `#f0f9ff` (surface-calm)

### 3.2 Cores de Superficie

| Token | Light Mode | Dark Mode | Uso |
|-------|-----------|-----------|-----|
| `--color-surface` | `#ffffff` | `#0f172a` (Slate 900) | Fundo de cards, modais, formularios |
| `--color-surface-muted` | `#f8fafc` (Slate 50) | `#1e293b` (Slate 800) | Fundo de tabelas, hover de linhas |
| `--color-surface-calm` | `#f0f9ff` (Sky 50) | `#1e293b` (Slate 800) | Fundo da pagina (body) |

### 3.3 Cores de Borda

| Token | Light Mode | Dark Mode | Uso |
|-------|-----------|-----------|-----|
| `--color-border` | `#e2e8f0` (Slate 200) | `#334155` (Slate 700) | Bordas de cards e inputs |
| `--color-border-muted` | `#f1f5f9` (Slate 100) | `#1e293b` (Slate 800) | Divisores sutis entre linhas |
| `--color-border-soft` | `#cbd5e1` (Slate 300) | `#475569` (Slate 600) | Bordas de botoes secondary |

### 3.4 Cores de Conteudo (Texto)

| Token | Light Mode | Dark Mode | Contraste (light) | Uso |
|-------|-----------|-----------|:--:|-----|
| `--color-content` | `#0f172a` (Slate 900) | `#f1f5f9` (Slate 100) | ~16:1 | Titulos, texto principal |
| `--color-content-muted` | `#475569` (Slate 600) | `#cbd5e1` (Slate 300) | ~5.7:1 | Labels, texto secundario |
| `--color-content-subtle` | `#56687a` | `#94a3b8` (Slate 400) | ~4.5:1 | Placeholders, metadados |

### 3.5 Cores Semanticas (Feedback)

| Funcao | Cor (Light) | Cor (Dark) | Background Light | Background Dark |
|--------|------------|-----------|-----------------|----------------|
| **Success** | `#059669` (Emerald 600) | `#10b981` (Emerald 500) | `#d1fae5` | `#064e3b` |
| **Error** | `#dc2626` (Red 600) | `#ef4444` (Red 500) | `#fee2e2` | `#7f1d1d` |
| **Warning** | `#d97706` (Amber 600) | `#f59e0b` (Amber 500) | `#fef3c7` | `#78350f` |
| **Info** | `#0369a1` (Sky 700) | `#3b82f6` (Blue 500) | `#e0f2fe` | `#1e3a8a` |

**Regra critica:** NUNCA usar classes Tailwind brutas de cor (como `red-500`, `green-600`, `blue-*`). Sempre usar os tokens semanticos: `text-error`, `bg-error-light`, `border-error`, `text-success`, `bg-success-light`, etc.

### 3.6 Personalização por Tenant

Cada organizacao pode definir:
- `logoUrl` — Logo customizado
- `brandColor` — Cor de marca (padrao: `#6366f1` Indigo)

---

## 4. TIPOGRAFIA

### 4.1 Fonte Principal

**Inter** (Google Fonts) — Sans-serif geometrica, excelente legibilidade em telas.

```
font-family: 'Inter', system-ui, sans-serif
```

Pesos carregados: **400 (Regular)**, **500 (Medium)**, **600 (Semibold)**, **700 (Bold)**

Fallback: `system-ui, sans-serif`

### 4.2 Escala Tipografica

| Token | Tamanho | Line-height | Uso |
|-------|---------|:-----------:|-----|
| `display` | 2.25rem (36px) | 1.2 | Titulo da pagina de login |
| `heading-lg` | 1.875rem (30px) | 1.25 | Numeros grandes no dashboard (KPIs) |
| `heading` | 1.5rem (24px) | 1.3 | H1 de paginas |
| `heading-sm` | 1.25rem (20px) | 1.4 | H2, titulos de cards |
| `body-lg` | 1.125rem (18px) | 1.6 | Texto de destaque |
| `body` | 1rem (16px) | 1.6 | Texto corrido, botoes lg |
| `body-sm` | 0.875rem (14px) | 1.5 | Labels, tabelas, badges, botoes sm/md, metadata |

### 4.3 Pesos e Hierarquia

| Nivel | Peso | Token | Exemplo |
|-------|------|-------|---------|
| Titulos de pagina | Bold (700) | `font-bold` | "Anamnese Inteligente" no login |
| Titulos de secao | Semibold (600) | `font-semibold` | "Visao geral", titulos de cards |
| Labels e botoes | Medium (500) | `font-medium` | "Entrar", "Nova avaliacao" |
| Texto corrido | Regular (400) | `font-normal` | Paragrafos, descricoes |

### 4.4 Base e Acessibilidade

- **Tamanho base:** 16px (1rem) — atende WCAG AAA
- **Tamanho minimo:** 14px (0.875rem) para texto denso (tabelas, badges)
- **Anti-aliasing:** `-webkit-font-smoothing: antialiased`
- **Scroll:** `scroll-smooth` no html
- **Contraste minimo:** 4.5:1 para texto normal, 3:1 para texto grande (WCAG AA)

---

## 5. ESPACAMENTO E GRID

### 5.1 Unidades de Espacamento

Base: sistema de 4px (0.25rem) do Tailwind.

| Token | Valor | Uso |
|-------|-------|-----|
| `touch` | 44px | Altura minima para alvos de toque (WCAG 2.5.5) |
| `sidebar` | 14rem (224px) | Largura da sidebar |

### 5.2 Grid de Layout

- **Largura maxima do conteudo:** definida pelo `PageLayout` (margem lateral responsiva)
- **Dashboard cards:** `grid sm:grid-cols-2 lg:grid-cols-4 gap-4`
- **Graficos:** `grid lg:grid-cols-2 gap-6`
- **Cards de paciente (lista):** `grid sm:grid-cols-2 lg:grid-cols-3 gap-4`
- **Formularios:** coluna unica, max-width controlado

### 5.3 Espacamento entre Secoes

- **Entre blocos do dashboard:** `space-y-8` (32px)
- **Entre campos de formulario:** `space-y-4` (16px)
- **Dentro de cards:** padding `sm` (12px), `md` (16-20px)
- **Entre items de lista:** `space-y-2` (8px) ou `divide-y`

---

## 6. BORDAS E CANTOS

### 6.1 Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-button` | 0.5rem (8px) | Botoes, badges, toasts, inputs |
| `--radius-card` | 0.75rem (12px) | Cards, modais |
| `--radius-input` | 0.5rem (8px) | Inputs, selects |

Casos especiais:
- Login card: `rounded-2xl` (16px) — mais arredondado para efeito "flutuante"
- Avatar/icones circulares: `rounded-full`
- Icone do logo (ECG pulse): `rx="8"` no SVG

### 6.2 Bordas

- **Cards:** `border border-border` (1px, cor `--color-border`)
- **Cards com destaque:** `border-l-4 border-l-primary` (borda esquerda colorida)
- **Badges:** `border` (1px) com cor semantica
- **Outline button:** `border-2 border-primary`
- **Inputs:** `border border-border` com `border-error` no estado de erro

---

## 7. SOMBRAS

| Token | Light Mode | Dark Mode | Uso |
|-------|-----------|-----------|-----|
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.05)` | `0 1px 3px rgba(0,0,0,0.3)` | Cards em repouso |
| `--shadow-card-hover` | `0 4px 6px rgba(0,0,0,0.07)` | `0 4px 6px rgba(0,0,0,0.4)` | Cards interativos em hover |
| `--shadow-soft` | `0 2px 8px rgba(14,165,233,0.08)` | `0 2px 8px rgba(56,189,248,0.15)` | Botao tactile, card do login |
| `--shadow-focus` | `0 0 0 2px surface, 0 0 0 4px primary` | idem | Ring de foco (2px gap + 2px ring) |

---

## 8. ICONOGRAFIA

### 8.1 Sistema de Icones

**Biblioteca:** Lucide React (consistente, fino, 24px base)
**Tamanho padrao:** `size-5` (20px) com `shrink-0`

### 8.2 Mapeamento de Icones

| Icone | Componente Lucide | Contexto |
|-------|-------------------|----------|
| Dashboard | `LayoutGrid` | Menu principal, navegacao |
| Questionarios | `FileText` | Templates de anamnese |
| Avaliacoes | `Clock` | Sessoes/avaliacoes |
| Pacientes | `Users` | Lista e gestao de pacientes |
| Usuario | `User` | Perfil individual |
| Metas | `Target` | Goals do paciente |
| IA/Insights | `Brain` | Uso de IA, insights |
| Treino | `Dumbbell` | Planos de treino |
| Dieta | `Apple` | Planos de dieta |
| Agendamentos | `CalendarClock` | Questionarios recorrentes |
| Organizacoes | `Building2` | Gestao de tenants |
| Assinatura | `CreditCard` | Billing/pagamento |
| Seguranca | `Shield` | 2FA, configuracoes |
| Ajuda | `HelpCircle` | Central de ajuda |
| Notificacoes | `Bell` (SVG custom) | Sino de alertas |
| Auditoria | `ClipboardCheck` | Historico de atividades |
| Logout | `LogOut` | Sair da conta |
| Tema claro | `Sun` | Theme toggle |
| Tema escuro | `Moon` | Theme toggle |
| Menu | `Menu` | Hamburger mobile |
| Fechar | `X` | Fechar modal/menu |
| Expandir | `ChevronDown` | Submenus |

### 8.3 Icone Customizado: Sino de Notificacoes

SVG customizado (nao Lucide) com stroke de 2px, viewBox 24x24. Usado no `AlertsBell` com badge de contador.

### 8.4 Regras de Uso

- Sempre com `aria-hidden` quando acompanhados de texto
- Cor herda do contexto (`currentColor`)
- Em containers com fundo colorido: usar `text-{cor}/10` para background e `text-{cor}` para o icone
- Exemplo de container de icone: `flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary`

---

## 9. COMPONENTES DO DESIGN SYSTEM

### 9.1 Button

**Variantes:**

| Variante | Aparencia | Uso |
|----------|-----------|-----|
| `primary` | Fundo primario, texto branco | Acao principal (salvar, criar, entrar) |
| `secondary` | Fundo surface, borda soft, texto content | Acao secundaria (cancelar, voltar) |
| `ghost` | Sem fundo, texto muted, hover sutil | Acoes terciarias (filtros, links) |
| `outline` | Borda primaria 2px, fundo transparente | Destaque alternativo (CTA secundario) |
| `tactile` | Fundo primario + textura vidro + sombra soft | CTA premium (continuar anamnese) |
| `danger` | Fundo error, texto branco | Acoes destrutivas (excluir) |

**Tamanhos:**

| Tamanho | Altura minima | Padding | Fonte |
|---------|:------------:|---------|-------|
| `sm` | 36px | `px-3 py-1.5` | `text-body-sm` (14px) |
| `md` | 44px (touch) | `px-4 py-2.5` | `text-body-sm` (14px) |
| `lg` | 48px | `px-5 py-3` | `text-body` (16px) |

**Estados:**
- **Hover:** Mudanca de cor de fundo (primary-hover) + `transition-calm` (200ms)
- **Active:** `opacity-95` (primary) ou `scale(0.98) + inset shadow` (tactile)
- **Disabled:** `opacity-50 + pointer-events-none`
- **Loading:** Spinner circular (4x4, border-2, animacao spin) + texto sr-only "Carregando..."
- **Focus:** Ring 2px primario com offset 2px

**Micro-interacao Tactile:**
```
hover: translateY(-1px) + shadow expandida
active: translateY(1px) scale(0.98) + shadow inset
transition: 120ms cubic-bezier(0.34, 1.56, 0.64, 1) — efeito "bounce"
textura: linear-gradient overlay para efeito vidro/mate
```

### 9.2 Card

- **Cantos:** `rounded-card` (12px)
- **Sombra:** `shadow-card` em repouso, `shadow-card-hover` em hover (cards interativos)
- **Borda:** `border border-border` (1px)
- **Padding:** `none` | `sm` (12px) | `md` (16-20px)
- **Titulo opcional:** `heading-sm font-semibold text-content` no topo
- **Destaque lateral:** `border-l-4 border-l-{cor}` para indicar categoria (primary, success, warning)

### 9.3 Badge

- **Altura minima:** 24px
- **Padding:** `px-2 py-0.5`
- **Fonte:** `text-body-sm font-medium`
- **Cantos:** `rounded-button` (8px)
- **Borda:** 1px com cor semantica

| Variante | Background | Texto | Borda |
|----------|-----------|-------|-------|
| `default` | `surface-muted` | `content-muted` | `border` |
| `primary` | `primary-subtle` | `primary` | `primary-light` |
| `success` | `success-light` | `success` | `success` |
| `warning` | `warning-light` | `warning` | `warning` |
| `error` | `error-light` | `error` | `error` |

### 9.4 Input

- **Borda:** `border border-border` → `border-primary` no focus → `border-error` em erro
- **Cantos:** `rounded-input` (8px)
- **Padding:** `px-3 py-2`
- **Fonte:** `text-body` (16px — evita zoom no iOS)
- **Label:** `text-body-sm font-medium text-content-muted` acima do campo
- **Erro:** `text-body-sm text-error` abaixo do campo, com `aria-invalid` e `aria-describedby`
- **Focus:** `ring-2 ring-primary ring-offset-2`

### 9.5 Toast

- **Posicao:** Fixo em `bottom-4 right-4 z-50`
- **Dimensoes:** `min-w-[280px] max-w-[400px]`
- **Layout:** `flex items-start gap-3`
- **Padding:** `px-4 py-3`
- **Cantos:** `rounded-card` (12px)
- **Background:** `bg-surface`
- **Sombra:** `shadow-soft`
- **Borda lateral:** `border-l-4` com cor semantica (success/error/primary/warning)
- **Auto-dismiss:** 4 segundos (8 segundos quando tem botao de acao)
- **Entrada:** Slide-in da direita (300ms ease-out, `translate-x-full` → `translate-x-0`)
- **Saida:** Slide-out para direita (200ms ease-in)
- **Icones por variante:** `✓` success, `✕` error, `ℹ` info, `⚠` warning
- **Botao de fechar:** `×` no canto, `h-6 w-6`, hover `bg-surface-muted`
- **API:** `toast.success('msg')` / `toast.error('msg')` / `toast.info('msg')`

### 9.6 Modal (ConfirmModal)

- **Overlay:** Fundo escurecido semi-transparente
- **Card central:** `rounded-card bg-surface shadow-card-hover`
- **Titulo:** `heading-sm font-semibold`
- **Botoes:** Primario (confirmar) + Ghost (cancelar)
- **Variante danger:** Botao de confirmacao em `error`
- **Animacao:** Fade-in suave

### 9.7 Skeleton (Loading)

- **Cor:** `bg-surface-muted` com animacao `animate-pulse`
- **Cantos:** Arredondados para simular conteudo
- **Variantes:** `Skeleton` (retangulo generico), `SkeletonCard` (card completo)

### 9.8 Pagination

- **Botoes:** `rounded-button` com numeros de pagina
- **Ativo:** `bg-primary text-white`
- **Inativo:** `bg-surface text-content-muted hover:bg-surface-muted`
- **Prev/Next:** Com icones de seta
- **Aria label:** Para acessibilidade

### 9.9 EmptyState

- **Icone ou ilustracao** centralizado
- **Titulo:** `heading-sm font-semibold`
- **Descricao:** `text-body-sm text-content-muted`
- **CTA:** Botao primario opcional (ex.: "Criar primeiro paciente")
- **Espacamento:** Centrado com padding generoso

---

## 10. PADROES DE LAYOUT

### 10.1 Estrutura Geral (PageLayout)

```
+---+----------------------------------------+
| S |  Header (titulo + acoes)               |
| I |----------------------------------------|
| D |                                         |
| E |  Conteudo principal                     |
| B |  (lazy-loaded, com Suspense spinner)    |
| A |                                         |
| R |                                         |
+---+----------------------------------------+
```

- **Sidebar:** Fixa a esquerda, largura `14rem` (224px), `bg-surface`, borda direita
- **Mobile:** Sidebar oculta; hamburger no topo esquerdo; overlay ao abrir
- **Header:** Titulo da pagina (H1) + acoes contextuais
- **Conteudo:** Fundo `surface-calm`, padding responsivo

### 10.2 Sidebar

- **Logo:** `IconPulse` (32px) + texto "Anamnese" em `font-semibold`
- **Itens de menu:** Icone (20px) + label, `py-2 px-3 rounded-button`
- **Item ativo:** `bg-primary-subtle text-primary font-medium`
- **Item hover:** `hover:bg-surface-muted`
- **Submenus:** Expandiveis com `ChevronDown`, indentados
- **Footer:** Badge do usuario (role) + tema + idioma + alertas + logout

### 10.3 Pagina de Login

Tela full-screen centrada com efeito visual imersivo:

- **Fundo:** `bg-surface-calm` com 2 blobs animados (circulos `bg-primary/20` com `blur-3xl`)
- **Animacao dos blobs:** `login-bg-blob` — 8s ease-in-out infinite, scale + translate suaves
- **Card central:** `max-w-md`, `rounded-2xl`, `bg-surface/95 backdrop-blur-sm`, `shadow-soft`
- **Logo:** `IconPulse` tamanho 14 (56px) com animacao `login-logo-glow` (3s infinite, drop-shadow pulsante)
- **Titulo:** `text-display font-bold` (36px)
- **Entrada dos elementos:** Animacao `login-fade-in-up` (0.6s, cubic-bezier) com stagger delays (0.08s, 0.16s, 0.24s)
- **Theme toggle:** Posicao absoluta top-right
- **Botao "Entrar":** `size-lg`, largura total, com micro-animacao `hover:scale-[1.01] active:scale-[0.99]`

### 10.4 Pagina de Signup

Similar ao login com campos adicionais:
- Nome completo, email, senha
- Nome da clinica/empresa
- Copy: "Teste gratis por 14 dias, sem cartao de credito"
- Link: "Ja tem conta? Entrar"

### 10.5 Dashboard

Composicao em blocos verticais:

1. **Saudacao** — "Bom dia/Boa tarde/Boa noite, [Nome]" + subtitulo + seletor de periodo + botao nova avaliacao
2. **Banner de trial** (condicional) — Fundo warning-subtle, borda warning, CTA "Assine agora"
3. **Estado vazio** (condicional) — Card com icone grande, titulo, 3 CTAs empilhados
4. **CTA de onboarding** (condicional) — Banner com borda primary/30
5. **Proximas acoes** — Card com border-l-4 primary, lista de ate 5 deep-links
6. **4 cards de metricas** — Grid 4 colunas, cada um com icone em container arredondado + numero grande `heading-lg font-bold tabular-nums`
7. **Analytics Dashboard Card** — Metricas de engajamento
8. **Students Overview Card** — Aderencia treino/dieta
9. **Pacientes com atencao** — Card com border-l-4 warning, lista de nomes
10. **Notificacoes** — Widget de alertas
11. **Uso do plano** — Barra de quota
12. **Conquistas** — Card de gamificacao
13. **Graficos** — 2 colunas (sessoes por dia + sessoes por template)
14. **Atividade recente** — Tabela (desktop) / cards (mobile)

### 10.6 Paginas de Lista

Padrao: Barra de acoes → Filtros → Grid/Tabela → Paginacao

- **Barra de acoes:** Titulo + botao primario ("Novo paciente", "Nova avaliacao")
- **Filtros:** Selects em linha + busca com debounce (400ms)
- **Resultados:** Cards em grid (pacientes) ou tabela com hover (sessoes)
- **Paginacao:** Componente padrao com numeros + prev/next
- **Empty state:** Centralizado com CTA

### 10.7 Paginas de Formulario

- Layout de coluna unica, max-width controlado
- Campos agrupados com `space-y-4`
- Botoes de acao no final: Salvar (primary) + Cancelar (secondary/ghost)
- `useUnsavedChanges` avisa ao sair com dados nao salvos
- Erro inline abaixo de cada campo em `text-error`

### 10.8 Paginas de Detalhe

- **Breadcrumbs** no topo (quando aplicavel)
- **Header:** Nome do recurso + badges de status + barra de acoes
- **Tabs** para subsecoes (dados, avaliacoes, treinos, fotos, metas)
- **Cards informativos** dentro de cada tab

---

## 11. ANIMACOES E MICROINTERACOES

### 11.1 Transicoes Padrao

| Token | Duracao | Easing | Uso |
|-------|---------|--------|-----|
| `transition-calm` | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Hover em cards, links, botoes |
| `duration-fast` | 150ms | Padrao | Tooltips, pequenas mudancas |
| `duration-slow` | 300ms | Padrao | Modais, paineis |

Propriedades animadas por `transition-calm`: `color`, `background-color`, `border-color`, `box-shadow`

### 11.2 Animacoes Especiais

| Animacao | Duracao | Uso |
|----------|---------|-----|
| `login-fade-in-up` | 0.6s | Entrada dos elementos na tela de login |
| `login-logo-glow` | 3s infinite | Pulso suave no logo do login |
| `login-bg-blob` | 8s infinite | Blobs de fundo na tela de login |
| `breath-in/out` | 4s | Exercicio de respiracao na pagina de insights |
| `progress-shine` | 3s infinite | Brilho na barra de progresso de gamificacao |
| `animate-spin` | Padrao Tailwind | Spinner de loading |
| `animate-pulse` | Padrao Tailwind | Skeleton placeholders |

### 11.3 Micro-interacao do Botao Tactile

```
Repouso:  shadow-soft + textura vidro (linear-gradient overlay)
Hover:    translateY(-1px) + shadow expandida (12px blur, 20% opacidade primary)
Active:   translateY(1px) scale(0.98) + shadow inset (8px blur interna)
Timing:   120ms cubic-bezier(0.34, 1.56, 0.64, 1) — leve "bounce"
```

### 11.4 Respeito a Preferencias do Usuario

```css
@media (prefers-reduced-motion: reduce) {
  /* Todas as animacoes reduzidas a 0.01ms */
  /* Classe .motion-reduce:animate-none em elementos individuais */
}
```

---

## 12. DARK MODE

### 12.1 Implementacao

- **Metodo:** Classe `.dark` no `<html>` (Tailwind `darkMode: 'class'`)
- **Toggle:** Componente `ThemeToggle` com icones `Sun`/`Moon`
- **Persistencia:** `localStorage` via hook `useTheme`
- **Transicao:** `background-color 200ms ease, color 200ms ease` no body e html

### 12.2 Principios

- Cores invertidas mantendo contraste WCAG AA
- Surfaces escurecem (Slate 800-900), conteudo clareia (Slate 100-300)
- Primaria fica levemente mais clara (#0ea5e9 → #38bdf8) para manter contraste
- Sombras ficam mais fortes (opacidade 0.3-0.4 vs 0.05-0.07) para compensar fundo escuro
- Feedback semantico ajusta tom (ex.: error: #dc2626 → #ef4444)
- Blobs na tela de login mantidos com opacidade ajustada

---

## 13. ACESSIBILIDADE (WCAG AA)

### 13.1 Padroes Implementados

- **Contraste minimo:** 4.5:1 para texto, 3:1 para texto grande e componentes UI
- **Focus visible:** Ring 2px primaria com offset 2px (`--shadow-focus`)
- **Skip link:** "Ir para conteudo principal" — invisivel exceto com foco de teclado
- **Screen reader:** Classe `.sr-only` para labels ocultos visualmente
- **ARIA:** `role="alert"` em mensagens de erro, `aria-live` em progress bars, `aria-describedby` em inputs, `aria-label` em botoes sem texto
- **Touch targets:** Minimo 44px (`min-h-touch`) em todos os botoes e links interativos
- **Reduced motion:** Respeitado via media query

### 13.2 Padroes Semanticos

- Um unico `<h1>` por pagina (via PageLayout ou titulo do recurso)
- Hierarquia H1 → H2 → H3 sem pular niveis
- `<nav>`, `<main>`, `<section>` com `aria-labelledby`
- Tabelas com `<thead>` e `<th>` para headers
- Listas com `<ul>/<li>` para items navegaveis

---

## 14. RESPONSIVIDADE

### 14.1 Breakpoints

| Breakpoint | Largura | Uso |
|------------|---------|-----|
| Base (mobile) | < 640px | Layout de coluna unica, sidebar oculta, tabelas viram cards |
| `sm` | >= 640px | Grid 2 colunas em cards |
| `md` | >= 768px | Tabelas mostradas, sidebar visivel |
| `lg` | >= 1024px | Grid 3-4 colunas, graficos lado a lado |

### 14.2 Comportamento Mobile

- **Sidebar:** Oculta; hamburger icon no header; overlay com backdrop ao abrir
- **Tabelas:** Substituidas por lista de cards empilhados
- **Cards de metricas:** 1 coluna (base) → 2 colunas (sm) → 4 colunas (lg)
- **Botoes:** Full-width em formularios mobile
- **Touch:** Alvos minimos de 44px

---

## 15. GAMIFICACAO VISUAL

### 15.1 Niveis

| Nivel | XP Necessario | Cor sugerida |
|-------|:------------:|--------------|
| Iniciante | 0-199 | `content-muted` (neutro) |
| Dedicado | 200-499 | `primary` (azul) |
| Avancado | 500-999 | `warning` (dourado) |
| Elite | 1000+ | `success` (verde) |

### 15.2 Badges

7 tipos de badges com icone + titulo + descricao. Badges desbloqueados tem:
- `badge-unlocked`: hover com `scale(1.05)` + `shadow primary/20`
- Badges bloqueados: opacidade reduzida + grayscale

### 15.3 Milestones de Sessoes (AchievementsCard)

6 niveis de conquista por sessoes completadas:

| Milestone | Icone | Nome |
|:---------:|:-----:|------|
| 1 | 🌱 | Iniciante |
| 5 | 📋 | Em progresso |
| 10 | ⭐ | Praticante |
| 25 | 🏅 | Avancado |
| 50 | 🎯 | Expert |
| 100 | 💯 | Mestre |

### 15.4 Barra de Progresso

```css
.progress-bar-gradient {
  background: linear-gradient(90deg, primary 0%, sky-400 50%, primary 100%);
  background-size: 200% 100%;
  animation: progress-shine 3s ease-in-out infinite; /* brilho que percorre */
}
```

Container da barra: `h-2.5 overflow-hidden rounded-full bg-surface-muted`
Preenchimento: `h-full rounded-full transition-all duration-700 ease-out`

### 15.5 Card de Conquistas

```css
.card-achievements {
  background: linear-gradient(145deg, surface 0%, surface-muted 100%);
  border-color: primary-light;
  box-shadow: 0 2px 8px primary/6, 0 1px 2px black/4;
}
```

- Container: `rounded-2xl border p-5`
- Icone trofeu: `size-12 rounded-xl bg-primary/10`
- Numero grande: `text-3xl font-bold tabular-nums text-primary`
- Badge "Esta semana": `rounded-full bg-primary-subtle px-3 py-1.5 text-body-sm font-medium text-primary`

---

## 16. GRAFICOS E VISUALIZACAO DE DADOS

### 16.1 Biblioteca

**Recharts** — Biblioteca React para graficos SVG

### 16.2 Tipos de Grafico

| Tipo | Componente | Uso |
|------|-----------|-----|
| Linha | `LineChart` | Evolucao ao longo do tempo (peso, medidas, sessoes/dia) |
| Pizza/Donut | `PieChart` | Distribuicao por categoria (sessoes por template) |
| Radar | `RadarChart` | Analise multidimensional (riscos da IA) |
| Barras | `RisksBarChart` | Niveis de risco (readiness, stress, dropout, sleep) |

### 16.3 Paleta de Cores para Graficos

- Linha primaria: `--color-primary`
- Area sob a linha: `primary/10` (opacidade 10%)
- Grid: `--color-border-muted`
- Labels: `--color-content-muted`
- Multiplas series: Usar cores semanticas (success, warning, error) + primary

### 16.4 Color Coding de Riscos (Insights IA)

| Nivel | Faixa | Cor | Uso |
|-------|:-----:|-----|-----|
| Baixo | 0-33 | `success` (verde) | Readiness alto, stress baixo |
| Medio | 34-66 | `warning` (amarelo) | Alerta moderado |
| Alto | 67-100 | `error` (vermelho) | Risco critico, atencao imediata |

---

## 17. IMPRESSAO (PRINT)

### 17.1 Estilos de Impressao

```css
@media print {
  /* Headers usam design tokens para manter consistencia */
  h1: 20px bold, color content
  p: 14px, color content-muted
  meta: 12px, color content-subtle
  hr: 1px solid border
}
```

### 17.2 Relatorios PDF

Gerados via `@react-pdf/renderer`:
- Bio do paciente
- Resumo de sessoes
- Graficos de evolucao
- Dados de treino/dieta

---

## 18. PWA (Progressive Web App)

### 18.1 Manifest

```json
{
  "name": "Anamnese Inteligente PaaS",
  "short_name": "Anamnese PaaS",
  "display": "standalone",
  "theme_color": "#0ea5e9",
  "background_color": "#f0f9ff",
  "lang": "pt-BR"
}
```

### 18.2 Meta Tags

- `theme-color`: `#0ea5e9`
- `apple-mobile-web-app-capable`: `yes`
- `apple-mobile-web-app-status-bar-style`: `default`
- Preconnect para Google Fonts

---

## 19. RESUMO DOS TOKENS

### Referencia rapida para desenvolvedores

**Cores:** Sempre via CSS variables → classes Tailwind semanticas. NUNCA usar `red-*`, `green-*`, `blue-*` direto.

**Radius:** `rounded-button` (8px), `rounded-card` (12px), `rounded-input` (8px)

**Sombras:** `shadow-card`, `shadow-card-hover`, `shadow-soft`, `shadow-focus`

**Transicoes:** `transition-calm` (200ms ease)

**Fonte:** Inter, tamanhos via tokens (`text-body-sm`, `text-heading`, etc.)

**Touch:** `min-h-touch` (44px) em todo elemento interativo

**Espacamento:** `sidebar` (224px), `touch` (44px); restante via escala Tailwind 4px

---

---

## 20. PADROES DE NOTIFICACAO E ALERTAS

### 20.1 AlertsBell (Sino de Notificacoes)

- **Botao:** `min-h-touch min-w-[40px]`, `rounded-button`, cor `text-content-muted`
- **Badge de contagem:** `absolute -right-0.5 -top-0.5`, circulo `h-4 min-w-4 rounded-full bg-error`
  - Texto: `text-[10px] font-bold text-white`
  - Mostra "99+" se acima de 99
- **Dropdown:** `absolute right-0 top-full z-50 mt-1 w-80`, `rounded-card border bg-surface shadow-card`, `max-h-[320px] overflow-y-auto`
- **Item de alerta:** `px-3 py-2.5`, hover `bg-surface-muted`, indicador de nao lido `h-2 w-2 rounded-full bg-primary`
- **Severidade por cor:** high=error, medium=warning, low/info=default

### 20.2 NotificationsWidget (Dashboard)

- **Container:** `rounded-card border border-warning/40 bg-warning/5 p-4`
- **Badge contador:** `h-6 w-6 rounded-full bg-warning text-white text-xs font-bold`
- **Limite visual:** Max 3 items por grupo, com overflow "+N adicionais"
- **Grupos:** Metas vencendo + Sessoes paradas
- **Links de acao por tipo:**
  - Inatividade: `bg-primary-subtle text-primary`
  - Meta vencendo: `bg-warning-subtle text-warning`
  - Queda de aderencia: `bg-error-light text-error`

### 20.3 PlanUsageCard

- **Container:** Card com padding md, `space-y-4`
- **Badges:** Tier do plano + status de IA (habilitada/desabilitada)
- **Barras de uso:** `QuotaUsageBar` mostrando pacientes e sessoes vs limites
- **CTA de upgrade:** `rounded-lg bg-primary-subtle/40 px-3 py-2.5` com botao "Upgrade →"

---

## 21. ONBOARDING WIZARD

### 21.1 Estrutura Visual

- **Pagina:** Full-screen centrada, mesma estetica do login (`bg-surface-calm`)
- **Card do step:** `rounded-2xl border border-border-muted bg-surface/95 p-8 shadow-soft text-center space-y-6`
- **Padding generoso:** 32px (p-8) para respiro visual

### 21.2 Barra de Progresso (StepProgress)

- **Container:** `flex gap-1.5`
- **Segmentos:** `h-1.5 flex-1 rounded-full transition-all duration-300`
- Ativo/completo: `bg-primary`
- Inativo: `bg-surface-muted`

### 21.3 Steps (8 etapas)

1. Boas-vindas
2. Templates prontos (5 pre-carregados)
3. Criar template
4. Cadastrar paciente
5. Iniciar avaliacao
6. Criar plano de treino
7. Cadastrar primeiro aluno
8. Checklist final

### 21.4 Checklist Step

- **Barra de progresso:** `h-2 w-full rounded-full bg-surface-muted` com fill `bg-primary transition-all duration-500`
- **Item completo:** `✓` verde `text-success` + texto com strikethrough
- **Item pendente:** Circulo vazio `h-5 w-5 rounded-full border-2 border-border`
- **Item carregando:** Spinner `size-5 animate-spin border-2 border-primary border-t-transparent`

### 21.5 Controles

- **Skip All:** `text-body-sm text-content-subtle hover:text-content` no canto superior direito
- **Contador:** "Passo X de Y" com tempo estimado no step 0

---

*Documento gerado com base na analise do codigo-fonte: index.css (design tokens), tailwind.config.js (mapeamento), index.html (meta tags), manifest.json (PWA), favicon.svg (logo), 20+ componentes UI, 15+ paginas de features, iconografia completa, e relatorio UI/UX existente.*
