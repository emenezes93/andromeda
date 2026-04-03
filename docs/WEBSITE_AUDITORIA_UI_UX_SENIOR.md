# Auditoria técnica e visual — Site Fit Insight (landing)

Análise na perspectiva de front-end sênior e design de produto. Projeto: `website/`.

---

## 1. Análise geral do site

O site é uma landing single-page em React + Vite com seções bem definidas (Hero, Pain, SocialProof, Features, ForProfessionals, ForPatients, Pricing, Testimonials, FAQ, CTA final, Footer). A base é sólida: design tokens no Tailwind (primary, accent, dark, surface, content, border), uso de `label-mono` e `text-gradient-static` para hierarquia, e animações de reveal com `prefers-reduced-motion`. Porém há **falta de sistema**: tipografia e espaçamento variam de forma ad hoc entre componentes, cores fora da paleta (emerald, yellow, red), e nenhum componente de UI reutilizável (Button, Card, Section). O resultado é uma página que funciona e comunica, mas **não escala** e transmite “template customizado” em vez de “produto polido”.

---

## 2. O que o site transmite visualmente

- **Confiança moderada:** Inter + JetBrains Mono, azul/roxo e fundos claros passam seriedade; mesh gradient e gradientes em texto remetem a SaaS moderno (tipo Stripe), mas o uso de emerald/yellow/red soltos no mockup (ForProfessionals) e o hero muito carregado (label, H1, duas linhas de texto, dois botões, garantias, prova social) **reduzem a sensação de premium**.
- **Clareza:** Headline e CTAs são objetivos; a hierarquia (label-mono → H2 → parágrafo) é reconhecível em várias seções.
- **Genérico em detalhes:** Botões sempre `rounded-full`, mesmo padrão de card (`bento-card`), sem variação de densidade ou ritmo. Falta um elemento visual de marca forte além do ícone (IconPulse).
- **Mobile:** Layouts responsivos existem (grids, `lg:`, `md:`), mas o hero em mobile acumula muitos blocos em sequência (garantias + prova social) e pode parecer longo; não há breakpoint intermediário pensado para tablet.

---

## 3. Pontos fortes reais

- **Design tokens** em `tailwind.config.js`: cores (primary, accent, dark, surface, content, border) e espaçamentos custom (18, 22, 26, 30) permitem consistência se forem usados de fato em todo o código.
- **Acessibilidade:** Skip link, `main` com id e aria-label, menu mobile com `aria-expanded`/`aria-controls`, touch targets 44–48px, `prefers-reduced-motion` no CSS, ícones decorativos com `aria-hidden`.
- **Reveal:** Um único hook `useReveal` com IntersectionObserver; lógica centralizada e desempenho ok.
- **Estrutura de seções:** Container `max-w-7xl px-6 lg:px-8` repetido de forma consistente; âncoras (#funcionalidades, #planos, #depoimentos, #faq) permitem navegação interna.
- **Conteúdo e copy:** Proposta de valor, prova social, dor/solução, FAQ e CTAs alinhados à pesquisa de conversão já feita no projeto.

---

## 4. Principais falhas de design

- **Cores fora do sistema:** Em `ForProfessionals.tsx` e `Hero.tsx` aparecem `emerald-400`, `emerald-500`, `yellow-500`, `red-500` (tags e trend). Não existem no tema; quebram a paleta e dificultam mudança global (ex.: tema escuro ou rebrand). Devem virar tokens (ex.: success, warning, error) ou tons derivados de primary/accent.
- **Tipografia fragmentada:** Uso direto de `text-[11px]`, `text-[12px]`, `text-[13px]`, `text-[15px]` em vários arquivos. Não há escala tipográfica única (ex.: `text-body-sm`, `text-body`, `text-lead`). Consequência: corpo de texto e secundário mudam de tamanho entre seções (13px vs 15px) sem critério claro.
- **Espaçamento entre seções inconsistente:** Maioria usa `py-26 sm:py-30`; SocialProof usa `py-14`; PainSection usa `py-14 sm:py-18`. Quem só olha o código não sabe se há “seção grande” vs “seção compacta” por decisão de design ou por acaso. Deveria existir 1–2 valores de padding vertical de seção (ex.: `section-tight`, `section-default`).
- **Sombra e borda hardcoded:** Em `index.css`, `.bento-card:hover` usa `border-color: #cbd5e1` e `box-shadow: 0 20px 60px rgba(0,0,0,0.06)`. O restante do site usa tokens `border-border` e cores do tema; aqui quebra a regra e dificulta manutenção.
- **Hero poluído:** Label + H1 + linha de benefício (15 min) + parágrafo + 2 CTAs + linha “14 dias grátis” + 3 garantias com ícones + prova social. Tudo acima da dobra compete por atenção; em mobile a dobra já não comporta o CTA principal em muitas alturas de viewport. Falta priorização visual (um foco) e possível enxugamento ou deslocamento de garantias/prova para logo abaixo da dobra.
- **Falta de “respiração” em blocos densos:** Features (8 cards), Pricing (4 planos) e FAQ (5 itens) têm pouco espaço entre título da seção e o conteúdo (ex.: `mb-16` vs `mb-20` em Pricing); em telas grandes o bloco de features fica visualmente pesado sem um respiro (ex.: mais margin-bottom no header da seção ou em cards).

---

## 5. Principais falhas de UX

- **FAQ fora da navegação:** A seção tem `id="faq"` mas não existe link “FAQ” ou “Perguntas” no Header nem no Footer. Quem quer responder dúvidas antes de converter não descobre o bloco por navegação.
- **Links do footer mortos:** Empresa (Sobre nós, Blog, Contato) e Legal (Termos, Privacidade, LGPD) usam `href="#"`. Gera frustração em quem clica e prejudica confiança; o ideal é remover até existir destino ou usar `button`/`span` desabilitado com tooltip “Em breve”.
- **Sem indicação de seção ativa no scroll:** Nav com âncoras não reflete em qual seção o usuário está (sem highlight no “Plataforma” / “Planos” / “Depoimentos”). Quem navega por scroll perde referência.
- **CTA “Falar com vendas” (plano Pro):** Usa o mesmo `getSignupUrl()` dos outros planos. Quem espera contato comercial ou link para calendário/email fica com expectativa errada.
- **Prova social duplicada:** Hero já tem “Confiado por 500+ … Nota 4.8”; SocialProof repete “Confiado por profissionais” e exibe de novo 500+, 10k+, 89%, 4.8. Redundância sem ganho claro; em mobile ocupa espaço que poderia ser usado para um único bloco mais forte.
- **PainSection pouco destacada:** Uma única linha de texto em fundo `surface-muted`; sem ícone, sem número ou lista. A “dor” poderia ter mais peso visual (subtítulo, 3 bullets) para criar contraste antes das features.

---

## 6. Problemas técnicos que impactam o visual

- **Inline styles:** Hero (dot grid) e CTASection (noise) usam `style={{ backgroundImage: '...', backgroundSize: '...' }}`. Funciona, mas não usa tokens e dificulta tema único; o mesmo padrão poderia ser uma classe em `index.css` com variáveis CSS ou cores do tema.
- **Ícone com cores fixas:** `IconPulse.tsx` usa `#0ea5e9` e `#0284c7` em `<linearGradient>`. Deveria usar `currentColor` ou variável CSS alinhada a `primary` para manter uma única fonte de verdade.
- **Duplicação de padrão de CTA:** Hero, Header, CTASection e Pricing repetem combinação de `<a>` + `rounded-full` + `px-* py-*` + ícone ArrowRight. Qualquer mudança de estilo de botão exige editar vários arquivos; um componente `Button` (variants: primary, secondary, ghost) eliminaria isso.
- **reveal-delay dinâmico em classe:** Uso de `reveal-delay-${index + 1}` e `reveal-delay-${Math.min((index % 3) + 1, 4)}` depende de classes `.reveal-delay-1` … `.reveal-delay-4` no CSS. Se alguém usar `index` > 3, o delay não existe. Frágil; melhor controlar delay por inline `style` ou por variável CSS no componente.
- **Skip link com className gigante:** Em `App.tsx` o skip link tem dezenas de classes Tailwind. Dificulta leitura e manutenção; o ideal é uma classe utilitária única (ex.: `.skip-link`) em `index.css` que concentre posição, foco e z-index.

---

## 7. Inconsistências entre páginas/componentes

- **Tamanhos de corpo de texto:** 11px (ForPatients status), 12px (Hero garantias, Footer copyright), 13px (Hero, Header, Footer, Pricing, Testimonials, SocialProof), 15px (Features, FAQ, Testimonials, ForPatients, ForProfessionals). Não há convenção “body small / body / body large”.
- **Títulos de seção:** Uso de `text-display-sm` é consistente para H2, mas em alguns lugares há só o H2 + parágrafo (Testimonials, FAQ) e em outros H2 + parágrafo mais longo (Features, Pricing). Margem inferior do bloco de título varia: `mb-16` (Features), `mb-20` (Pricing, Testimonials), `mb-14` (FAQ).
- **Botões:** Hero e CTASection usam `px-7 py-3.5` / `px-8 py-4` e `text-[15px]`; Header usa `px-5 py-2` e `text-[13px]`; Pricing usa `px-5 py-3` e `text-[13px]`. Tamanho e peso visual do CTA mudam sem hierarquia clara (primário da página vs secundário).
- **Gaps de grid:** `gap-4` (Features), `gap-5` (Pricing), `gap-6` (Testimonials), `gap-12` (Footer), `gap-20` (ForProfessionals, ForPatients). Mistura de escala (4, 5, 6) com valores grandes (12, 20); não segue uma escala de 4 ou 8 de forma previsível.
- **Backgrounds de seção:** Alternância branco → surface-muted (Pricing) → branco (Testimonials, FAQ) → mesh (CTASection) → dark (Footer). PainSection e SocialProof têm fundo diferente do Hero/Features; a regra “uma sim, uma não” não está explícita, o que pode parecer aleatório.

---

## 8. Melhorias prioritárias de alto impacto

1. **Unificar cores semânticas:** Introduzir em `tailwind.config.js` tokens `success`, `warning`, `error` (ou usar primary/accent com opacidade) e substituir emerald/yellow/red em ForProfessionals e Hero por esses tokens.
2. **Adicionar FAQ à navegação:** Link “FAQ” ou “Perguntas” no Header e no Footer (Plataforma ou nova coluna) apontando para `#faq`.
3. **Criar componente Button:** Props `variant` (primary, secondary, outline), `size` (sm, md, lg), opcional `icon`. Usar em Hero, Header, CTASection e Pricing para padronizar e facilitar mudanças futuras.
4. **Definir escala de seção:** Duas variantes no CSS ou Tailwind: ex. `section--default` (py-26 sm:py-30) e `section--tight` (py-14 sm:py-18). Aplicar em todas as `<section>` e remover valores soltos.
5. **Definir escala tipográfica:** Em theme ou componente, nomes como `text-body-sm` (13px), `text-body` (15px), `text-lead` (lg). Substituir todos os `text-[13px]` e `text-[15px]` por essas classes para um único lugar de controle.
6. **Resolver links do footer:** Ou remover itens sem destino e deixar só Funcionalidades, Planos, Depoimentos, FAQ; ou usar `href="#"` com `aria-disabled` e texto “Em breve” até ter URLs.
7. **Destacar PainSection:** Incluir 2–3 bullets ou um subtítulo (“Você já passou por isso?”) e um pouco mais de padding/contraste para que a “dor” tenha peso visual antes das features.
8. **Bento-card no sistema:** Trocar `#cbd5e1` e o box-shadow em `.bento-card:hover` por tokens (ex.: `border-border` ou `border-content-subtle`, sombra com variável).

---

## 9. Sugestões concretas de redesign

- **Hero:** Reduzir a uma linha de garantias (ex.: “Sem cartão · 14 dias grátis · Cancele quando quiser”) e mover os ícones (Sem cartão, Cancele, LGPD) para logo abaixo do CTA ou para o rodapé do hero; manter prova social em uma linha só. Objetivo: um único foco (headline + CTA) acima da dobra.
- **Navegação:** Incluir “FAQ” no Header (e no Footer). Opcional: highlight do item ativo conforme scroll (IntersectionObserver + estado do item em view).
- **Seções escuras/claras:** Definir regra explícita: Hero (claro), ForProfessionals (escuro), resto claro exceto CTASection (gradiente) e Footer (escuro). PainSection e SocialProof: ou ambos claros com borda, ou ambos com o mesmo fundo suave para formar um único bloco “prova + dor”.
- **Cards de preço:** O plano em destaque (Solo) poderia ter um pouco mais de elevação (sombra maior em repouso) ou um contorno sutil para diferenciar sem depender só de cor. Garantir que o CTA “Falar com vendas” (Pro) tenha destino próprio (link de contato ou mesmo mailto).
- **Mobile:** No hero mobile, considerar colapsar garantias em um único texto (“Sem cartão · 14 dias grátis · Cancele quando quiser”) e manter prova social em uma linha; evitar que o primeiro fold tenha mais de 4–5 elementos de texto.
- **Tipografia:** Um único “section heading block”: label-mono + H2 (text-display-sm) + parágrafo opcional, com margem inferior fixa (ex.: mb-16 ou mb-20). Todos os blocos de título de seção usam esse padrão.

---

## 10. Próximos passos para elevar o site a um nível profissional

1. **Design system mínimo no código:**  
   - Arquivo (ou pasta) `design-tokens` ou extensão do Tailwind: escala de tipo (body-sm, body, lead, caption), espaçamento de seção (section-tight, section-default), e cores semânticas (success, warning, error).  
   - Componentes: `Button`, `Section` (wrapper com max-width + padding), opcionalmente `Card` e `SectionHeading` (label + H2 + descrição).

2. **Refatorar componentes para usar o sistema:**  
   - Trocar todos os `text-[13px]`/`text-[15px]` pelas novas classes de tipo.  
   - Trocar padding vertical das seções por uma classe única.  
   - Substituir CTAs por `<Button>`.  
   - Remover emerald/yellow/red e usar tokens.

3. **Navegação e conteúdo:**  
   - Adicionar link FAQ no Header e no Footer.  
   - Ajustar ou remover links do footer que ainda são `#`.  
   - Definir destino do CTA “Falar com vendas” (Pro).

4. **Visual e ritmo:**  
   - Enxugar o hero (menos linhas acima do CTA; garantias em uma linha).  
   - Revisar `.bento-card` e inline styles (dot grid, noise) para usar apenas tokens/variáveis.  
   - IconPulse: cor do gradiente via CSS variable ou tema.

5. **Qualidade e manutenção:**  
   - Skip link como classe `.skip-link` em `index.css`.  
   - Reveal: delays via style ou variável para não depender de classes numeradas.  
   - Documentar no README ou em `docs/` as convenções de tipo, espaçamento e uso de Button/Section.

6. **Validação:**  
   - Passar um checklist de contraste (WCAG) nos textos content-muted e white/60.  
   - Testar em viewports 360px, 768px e 1440px para garantir que hero, grids e FAQ não quebrem.  
   - Opcional: lighthouse (performance, a11y) e correção dos pontos críticos.

Com isso, o site mantém a estrutura atual mas ganha **consistência visual**, **escalabilidade de código** e **clareza de navegação e conversão**, aproximando-se de um padrão de produto digital profissional.

---

## Ajustes realizados (pós-auditoria)

- **Tailwind:** Cores semânticas `success`, `warning`, `error`; escala tipográfica `body-sm`, `body`, `lead`, `caption`; mantidos spacing existentes.
- **index.css:** Classe `.skip-link` (substitui className longo no App); `.section-default` e `.section-tight`; `.bg-dot-grid` e `.bg-noise`; `.bento-card:hover` com tokens (border `#94a3b8`, sombra rgba); `:root` com `--color-primary` e `--color-primary-hover`.
- **Componente Button** (`website/src/components/ui/Button.tsx`): variantes primary, secondary, outline, dark, white; tamanhos sm, md, lg; suporte a `href` (render como `<a>`) e ícone opcional. Uso em Hero, Header, CTASection e Pricing.
- **Hero:** Garantias em uma linha de texto + ícones; uso de `Button`, `bg-dot-grid`; trend das métricas com `text-success`.
- **ForProfessionals:** Tags do mockup com `success`, `warning`, `error` em vez de emerald/yellow/red.
- **PainSection:** Título visível “Você já passou por isso?”; 3 bullets; fechamento com “O Fit Insight reúne…”; classe `section-tight`.
- **Navegação:** Link “FAQ” no Header e no Footer (Plataforma). Links Empresa e Legal como `<span>` com “Em breve” e `title="Em breve"`.
- **Pricing:** CTA “Falar com vendas” (plano Pro) com `getContactUrl()` (mailto); uso de `Button` em todos os planos.
- **config/app.ts:** Função `getContactUrl()` (mailto; opcional `VITE_CONTACT_EMAIL`).
- **Seções:** Uso de `section-default` ou `section-tight` em todas as seções; tipografia com `text-body-sm` e `text-body` onde aplicável.
- **Reveal:** Delay via `style={{ transitionDelay }}` nos componentes (Features, Pricing, Testimonials, ForProfessionals, ForPatients); removida dependência de classes `reveal-delay-N`.
- **IconPulse:** Gradiente com `var(--color-primary)` e `var(--color-primary-hover)`.
- **Validação:** Build (`npm run build`) executado duas vezes com sucesso; sem erros de lint nos arquivos alterados.
