# Estudo MFIT Personal — Melhorias para o app Fit Insight (paciente)

Referência: app **MFIT Personal** (Brasil), foco na experiência do **aluno/cliente**. Objetivo: trazer melhorias e ajustes **sem perder o padrão de design** do Fit Insight (tema escuro, tokens primary/accent, Ionicons, tipografia e espaçamentos atuais).

---

## 1. O que o MFIT oferece ao aluno

| Área | MFIT | Nosso app hoje |
|------|------|-----------------|
| **Treino** | Vídeos demonstrativos (1.800+), cronômetro integrado, instruções por exercício | GIFs/imagens, timer de descanso, séries/carga, resumo pós-treino |
| **Feedback** | Avaliação obrigatória ao finalizar (envio ao personal) | Resumo de volume/1RM; sem “como foi o treino?” |
| **Home** | Destaque para “treino de hoje” / próximo treino | Metas do dia, resumo, acesso rápido a Treinos/Dieta |
| **Questionários** | Anamnese e avaliação enviadas pelo personal, preenchimento no app | my-sessions na API; ainda sem tela dedicada de questionários |
| **Pagamentos** | Carteira no app (cartão/boleto) | Fora do escopo atual |

---

## 2. Melhorias priorizadas (respeitando nosso design)

### 2.1 Treino ativo — Cronômetro de duração (inspirado no MFIT)

- **O quê:** Mostrar **duração decorrida** do treino no topo da tela (ex.: “12 min”).
- **Por quê:** MFIT usa “cronômetro integrado”; melhora sensação de progresso e foco.
- **Como:** Usar `startTimeRef` já existente; exibir em texto ou barra discreta, com `colors.textMuted` e `typography.caption` para manter o padrão.

### 2.2 Treino ativo — Indicador de progresso (exercício X de Y)

- **O quê:** Texto ou barra “Exercício 2 de 5” (ou “Série X de Y” por exercício) para reduzir sensação de “tela infinita”.
- **Por quê:** MFIT deixa claro o andamento do treino; melhora aderência.
- **Como:** Cálculo a partir de `exercises.length` e índice atual no scroll; estilo com `sectionTitle`/`caption` e `colors.primary` para a parte “preenchida”.

### 2.3 Pós-treino — Feedback “Como foi o treino?”

- **O quê:** Após o resumo (volume, 1RM), **uma pergunta opcional**: “Como foi o treino?” com 3 opções (ex.: “Fácil”, “No limite”, “Muito difícil”) ou escala 1–5.
- **Por quê:** MFIT exige feedback ao finalizar; nosso app pode tornar opcional e preparar para envio ao coach.
- **Como:** Modal ou passo extra após “Fechar” do resumo; botões com `Button`/TouchableOpacity e `colors.surface`/`primary`; valor salvo localmente ou enviado se a API tiver endpoint (ex.: `POST my-training-executions/:id/feedback`).

### 2.4 Home — Card “Treino de hoje” em destaque

- **O quê:** Se houver **plano(s) de treino ativo(s)** e fizer sentido mostrar “hoje”, um **card clicável** “Treino de hoje” (ou “Seu treino hoje”) que leva direto à lista de planos ou ao plano do dia.
- **Por quê:** MFIT coloca o treino do dia em evidência; reduz cliques para começar.
- **Como:** Card com mesmo estilo de `metasCard`/`weeklyReportCard` (surface, radius, border); ícone `barbell`; navegação para stack Treinos. Evitar lógica pesada de “qual plano é de hoje” no MVP — pode ser só “Ver treinos” com copy “Treino de hoje” quando houver pelo menos um plano ativo.

### 2.5 Microcopy e instruções (estilo MFIT)

- **O quê:** Textos curtos de orientação: “Toque em Descanso para iniciar o cronômetro”, “Marque as séries concluídas”, “Registre peso e reps”.
- **Por quê:** MFIT deixa instruções claras; reduz dúvida em primeiro uso.
- **Como:** Uma linha de hint abaixo do título “Marque as séries…” com `typography.caption` e `colors.textMuted`.

---

## 3. O que NÃO mudar (padrão de design)

- **Cores:** Manter `primary` (#0ea5e9), `accent` (#8b5cf6), `surface`, `background`, `text`, `success`, `warning`, `error`.
- **Componentes:** Botões, cards, inputs e listas já existentes; ícones Ionicons.
- **Navegação:** Bottom tabs e stacks atuais.
- **Tema:** Escuro como padrão; sem introduzir tema claro sem um plano de design system.

---

## 4. Implementação sugerida (ordem)

1. **Cronômetro de duração** no treino ativo (rápido, alto impacto).
2. **Indicador “Exercício X de Y”** no treino ativo.
3. **Hint de instrução** (“Toque em Descanso…”, “Marque as séries…”).
4. **Card “Treino de hoje”** na Home (quando houver planos).
5. **Feedback pós-treino** opcional (estado local ou API quando existir).

---

*Documento para alinhar melhorias inspiradas no MFIT sem perder a identidade visual e técnica do Fit Insight.*
