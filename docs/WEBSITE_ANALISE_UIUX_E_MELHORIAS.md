# Análise do site (landing) — UI/UX, boas práticas e melhorias

**Escopo:** pasta `website/` (landing Fit Insight).  
**Abordagem:** análise fria e severa, com sugestões objetivas de melhoria.

---

## 1. Pontos positivos

- **Estrutura clara:** Hero → Prova social → Funcionalidades → Públicos → Preços → Depoimentos → CTA → Footer.
- **Design system em Tailwind:** tokens de cor (primary, accent, dark, surface, content, border), tipografia (display, display-sm), espaçamento consistente (py-26, py-30).
- **Animações de entrada:** hero-enter e reveal com IntersectionObserver evitam poluir a primeira carga.
- **Responsividade:** grid adaptativo, menu mobile, métricas do hero ocultas em mobile.
- **Ícone de marca:** IconPulse (ECG) alinhado ao produto e usado de forma consistente.
- **CTA repetidos:** “Cadastre-se grátis” e “Ver planos” aparecem em contexto, com hierarquia visual clara.

---

## 2. Problemas críticos

### 2.1 Links mortos e CTAs sem destino

- **Todos os botões/links principais** (“Entrar”, “Começar grátis”, “Cadastre-se grátis”, “Assinar Solo”, etc.) usam `href="#"`.
- **Impacto:** usuário clica e não vai a lugar nenhum; taxa de conversão zero e sensação de site fake.
- **Ação:** apontar para a aplicação real (ex.: `https://app.seudominio.com/login` e `https://app.seudominio.com/signup`), via variável de ambiente (ex.: `VITE_APP_URL`) no build.

### 2.2 Ortografia e consistência em pt-BR

- Textos sem acentuação: “Avaliacao”, “saude”, “profissional”, “Questionarios”, “Prescricao”, “refeicoes”, “precos”, “nos”, “Gratis”, “Assinatura”, “gerados”, “visiveis”, “unica”, etc.
- **Impacto:** credibilidade baixa e má impressão para público profissional.
- **Ação:** revisar todos os textos da landing e usar pt-BR correto (incluindo “Grátis”, “Única”, “Preços”, “Nós”, “Saúde”).

### 2.3 Acessibilidade (a11y)

| Problema | Onde | Sugestão |
|----------|------|----------|
| **Skip link** | Não existe | Adicionar “Pular para o conteúdo” no topo, apontando para `#main-content`. |
| **Main sem landmark** | `<main>` sem id/aria-label | Dar `id="main-content"` e `aria-label="Conteúdo principal"` para o `<main>`. |
| **Menu mobile** | Botão sempre “Menu” | `aria-label={open ? 'Fechar menu' : 'Abrir menu'}` e `aria-expanded={open}`. |
| **Contraste** | Footer: `text-white/30`, `text-white/20` | Texto pequeno em fundo escuro precisa ≥ 4.5:1. Aumentar para `text-white/50` e `text-white/40` ou mais. |
| **Animações** | mesh-gradient e text-gradient infinitos | Respeitar `prefers-reduced-motion: reduce` (desligar ou simplificar animação). |
| **Foco** | Links e botões | Garantir `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` em todos os interativos. |
| **Ícones decorativos** | Lucide em botões com texto | Manter ícones com `aria-hidden` onde o texto já descreve a ação. |

### 2.4 SEO e meta

- **Falta `og:image`** — compartilhamento em redes sociais fica sem imagem.
- **Ação:** adicionar `<meta property="og:image" content="/brand/og-image.png" />` (ou URL absoluta em produção) e criar asset 1200×630.

### 2.5 Dados fictícios sem aviso

- Hero: “47 avaliações hoje”, “284 pacientes ativos”, “1.2k insights”, “89% aderência”.
- Social proof: “500+ Profissionais”, “10k+ Avaliações”, “89% Aderência”, “4.8 Avaliação”.
- **Impacto:** se forem ilustrativos, pode ser interpretado como enganoso.
- **Ação:** ou usar dados reais (API/estatísticas), ou deixar explícito (“Dados ilustrativos” / “Simulação”) ou remover e reforçar só benefícios em texto.

---

## 3. UI/UX e design

### 3.1 Hierarquia e leitura

- **Hero:** título muito grande em mobile (`text-[clamp(2.5rem,6vw,5rem)]`) pode quebrar em 2–3 linhas; garantir que “Avaliação inteligente.” e “Resultados visíveis.” não fiquem cortados de forma estranha.
- **Seções longas:** ForProfessionals e Features têm muito texto; considerar subdividir ou encurtar parágrafos e usar mais listas/bullets.
- **Consistência de títulos:** algumas seções usam “display-sm”, outras tamanhos manuais; padronizar (ex.: sempre `text-display-sm` para H2 de seção).

### 3.2 Cores e tokens

- Uso de cores “soltas”: `text-emerald-500`, `bg-yellow-500/20`, `bg-red-500/20`, `text-yellow-300`, etc.
- **Sugestão:** criar tokens semânticos no Tailwind (ex.: `success`, `warning`, `error`) e usá-los, para manter consistência com o BRANDING_BOOK e o app.

### 3.3 Mobile

- **Menu:** ao abrir, não há focus trap; teclado pode “sair” do menu. Considerar focus trap (ex.: Headless UI) e fechar com Escape.
- **Touch targets:** botões “Entrar” e “Começar grátis” no header mobile devem ter altura mínima ~44px (já próximo com py-2; conferir área clicável).
- **Footer:** em telas pequenas, muitas colunas podem ficar apertadas; o grid já é responsivo, mas vale testar em 320px.

### 3.4 Performance

- **Fontes:** Inter + JetBrains Mono (Google Fonts). Dois pedidos; considerar `font-display: swap` (já em `display=swap` na URL) e, se possível, auto-hospedagem para reduzir dependência e melhorar privacidade.
- **Reveal:** um IntersectionObserver por elemento; em muitas seções pode haver dezenas. Um único observer com múltiplos elementos reduz custo.

### 3.5 Microcopy e CTAs

- “Comecar gratis” vs “Cadastre-se gratis”: mesma ação, palavras diferentes. **Sugestão:** padronizar (ex.: “Começar grátis” em todo o site) ou diferenciar por contexto (ex.: “Cadastre-se” no hero, “Começar grátis” no header).
- Footer: “Sobre nos” → “Sobre nós”; “Planos e precos” → “Planos e preços”.

---

## 4. Código e manutenção

### 4.1 Tailwind e purge

- Classes de atraso de reveal: `reveal-delay-${index + 1}` são geradas dinamicamente. No seu caso estão definidas em `index.css` (`.reveal-delay-1` etc.), então não dependem do purge do Tailwind. **Manter** essa abordagem ou passar a usar classes completas (ex.: `reveal-delay-1`, `reveal-delay-2`) quando quiser depender só do Tailwind.

### 4.2 Acessibilidade do IconPulse

- SVG do logo sem `role="img"` e sem `aria-hidden` quando é decorativo. Em links (Header, Footer), o texto “Fit Insight” já é o label; o ícone pode ter `aria-hidden="true"`.

### 4.3 Semântica HTML

- **Footer:** agrupamento por `<nav>` para blocos de links (Plataforma, Empresa, Legal) com `aria-label="Links do rodapé - Plataforma"` etc. melhora navegação por leitores de tela.
- **Seções:** usar `<section aria-labelledby="...">` associando ao título da seção (id no h2) quando fizer sentido.

---

## 5. Checklist de melhorias (priorizado)

### Alta prioridade

- [ ] Trocar todos os `href="#"` dos CTAs e “Entrar” por URLs reais da aplicação (login/signup).
- [ ] Revisar e corrigir acentuação e ortografia em pt-BR em todo o site.
- [ ] Adicionar skip link e `id="main-content"` + `aria-label` no `<main>`.
- [ ] Ajustar contraste no footer (text-white/30 e text-white/20 → níveis mais altos ou tamanho maior).
- [ ] Respeitar `prefers-reduced-motion` nas animações (mesh, text-gradient).

### Média prioridade

- [ ] Adicionar `og:image` e asset 1200×630.
- [ ] Melhorar menu mobile: `aria-label` dinâmico, `aria-expanded`, e opcionalmente focus trap + Escape para fechar.
- [ ] Padronizar CTAs (“Começar grátis” vs “Cadastre-se grátis”).
- [ ] Substituir cores “soltas” (emerald, yellow, red) por tokens semânticos (success, warning, error).
- [ ] Esclarecer ou remover dados fictícios do hero e da prova social.

### Baixa prioridade

- [ ] Um único IntersectionObserver para todos os elementos com reveal.
- [ ] IconPulse com `aria-hidden` onde for decorativo.
- [ ] Footer: `<nav>` e `aria-label` por grupo de links.
- [ ] Considerar auto-hospedagem de fontes.

---

## 6. Resumo executivo

O site tem **estrutura e direção visual boas** (gradientes, bento, prova social, preços, CTA), mas sofre de:

1. **Conversão zero** por causa de links mortos (`#`).
2. **Credibilidade afetada** por erros de português e dados que parecem reais mas não são.
3. **Riscos de acessibilidade e conformidade** (contraste, motion, landmarks, skip link).
4. **Oportunidades de polish** (tokens de cor, semântica, SEO com og:image).

Priorizar: **links reais + pt-BR + a11y básico (skip link, main, contraste, reduced motion)**. Em seguida: og:image, menu mobile a11y, padronização de CTAs e cores. Por último: otimizações de performance e semântica avançada.
