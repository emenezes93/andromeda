# Planejamento de implementação — Melhorias UI/UX (pesquisa SaaS/App)

Base: `docs/WEBSITE_PESQUISA_UI_UX_SAAS_APP_E_SUGESTOES.md`. Foco: usuário final e conversão.

---

## Fase 1 — Hero e primeira impressão (acima da dobra)

| # | Tarefa | Critério de conclusão |
|---|--------|------------------------|
| 1.1 | Headline com resultado + tempo | Linha de benefício concreto sob o H1 (ex.: "Avaliações completas em 15 min — sem papel"). |
| 1.2 | "Para quem é" explícito | Label do hero: "Para personal trainers e nutricionistas" (ou equivalente). |
| 1.3 | CTA específico no botão | Texto do botão: "Testar 14 dias grátis" (reduz medo de cobrança). |
| 1.4 | Selos/garantias perto do CTA | Ícones ou pills: "Sem cartão", "Cancele quando quiser", "Dados seguros (LGPD)". |

**Arquivos:** `website/src/components/Hero.tsx`

---

## Fase 2 — Prova social acima da dobra

| # | Tarefa | Critério de conclusão |
|---|--------|------------------------|
| 2.1 | Mini barra de prova social no hero | Uma linha visível sem scroll: "Confiado por 500+ personal trainers e nutricionistas" + número (ex.: nota 4.8), logo abaixo dos CTAs. |

**Arquivos:** `website/src/components/Hero.tsx` (bloco dentro do hero)

---

## Fase 3 — Seção problema/dor

| # | Tarefa | Critério de conclusão |
|---|--------|------------------------|
| 3.1 | Componente PainSection | 2–3 frases sobre a dor: formulários longos, dados dispersos, sem visão da evolução. |
| 3.2 | Inserir após o hero | Ordem: Hero → PainSection → SocialProof → … |

**Arquivos:** `website/src/components/PainSection.tsx` (novo), `website/src/App.tsx`

---

## Fase 4 — CTAs e copy em toda a página

| # | Tarefa | Critério de conclusão |
|---|--------|------------------------|
| 4.1 | Header: CTA específico | "Testar grátis" ou "Começar teste" no botão principal. |
| 4.2 | CTASection: botão e sublinha | "Testar 14 dias grátis" no botão; manter garantias abaixo. |
| 4.3 | Pricing: manter CTAs por plano | "Começar grátis" no plano Grátis; demais inalterados. |

**Arquivos:** `website/src/components/Header.tsx`, `website/src/components/CTASection.tsx`

---

## Fase 5 — FAQ antes do CTA final

| # | Tarefa | Critério de conclusão |
|---|--------|------------------------|
| 5.1 | Componente FAQ | 3–5 perguntas: cartão para testar?, dados seguros?, funciona no celular?, tempo de configuração?, cancelamento. |
| 5.2 | Posição | Antes do CTASection (após Depoimentos). |

**Arquivos:** `website/src/components/FAQ.tsx` (novo), `website/src/App.tsx`

---

## Ordem de execução

1. Fase 1 (Hero: headline+tempo, para quem é, CTA, selos)  
2. Fase 2 (Prova social no hero)  
3. Fase 3 (PainSection)  
4. Fase 4 (Header + CTASection copy)  
5. Fase 5 (FAQ)

---

## Status pós-implementação

- [x] Fase 1
- [x] Fase 2
- [x] Fase 3
- [x] Fase 4
- [x] Fase 5
