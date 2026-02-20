# Fase 7 – Roadmap Implementado

Itens da Fase 7 do planejamento (Personal e Aluno) implementados neste ciclo.

---

## 1. Templates fitness pré-prontos (seed)

**Objetivo:** Nenhum personal montar templates do zero.

**Arquivo:** `prisma/seed-data/templates-fitness.ts`

| Template | Descrição |
|----------|-----------|
| **PAR-Q (Prontidão para Atividade Física)** | Questionário de prontidão (inspirado no PAR-Q+). 7 perguntas + 1 condicional. Obrigatório legalmente antes de atividade física. |
| **Anamnese Postural Inicial** | Dores, lesões, cirurgias, postura no trabalho, atividade atual. 9 perguntas. |
| **Check-in Semanal** | Sono, estresse, disposição, dores musculares, aderência ao treino, alimentação. 8 perguntas. |
| **Avaliação Nutricional Básica** | Refeições/dia, café, água, frutas/vegetais, proteína, processados, álcool, restrições, suplementos. 11 perguntas. |
| **Reavaliação 90 dias** | Peso, medidas, satisfação, objetivo, conquistas, dificuldades, ajustes. 8 perguntas. |

**Como usar:** Após `npm run prisma:seed`, os 5 templates aparecem na lista de templates do tenant demo.

---

## 2. Relatório PDF exportável

**Objetivo:** Personal imprimir ou enviar progresso ao aluno/médico.

### Já existente
- **Sessão de anamnese (ficha assinada + insights):**  
  `GET /v1/anamnesis/sessions/:id?format=pdf`  
  Retorna HTML pronto para impressão (respostas, insights, assinatura). No navegador: Ctrl+P → Salvar como PDF.

### Novo
- **Relatório de evolução biométrica:**  
  `GET /v1/patients/:id/evolution-report`  
  Retorna HTML com tabela de evoluções (data, peso, altura, IMC, cintura, quadril, % gordura, PA, FC, observações). Uso: abrir no navegador e imprimir como PDF.

**Observação:** PDF é gerado pelo usuário via “Imprimir → Salvar como PDF”. Geração server-side com puppeteer/pdfkit pode ser feita em fase posterior.

---

## 3. Dashboard com alertas de risco

**Objetivo:** Personal ver alunos em risco e questionários pendentes.

**Endpoint:** `GET /v1/stats/dashboard` (resposta estendida).

### Novos campos na resposta: `alerts`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `alerts.pendingQuestionnairesCount` | number | Quantidade de sessões em andamento há mais de N dias |
| `alerts.pendingQuestionnaires` | array | Lista (até 50) com sessionId, patientName, templateName, createdAt, daysPending |
| `alerts.highRiskCount` | number | Quantidade de insights com dropoutRisk >= limite |
| `alerts.highRiskList` | array | Lista (até 30) com sessionId, patientName, dropoutRisk, insightCreatedAt |

### Parâmetros opcionais (querystring)

| Parâmetro | Default | Descrição |
|-----------|---------|-----------|
| `pendingDays` | 7 | Considerar “pendente” sessão in_progress com mais de N dias |
| `highRiskThreshold` | 70 | Alertar quando dropoutRisk >= este valor (0–100) |

**Exemplo:**  
`GET /v1/stats/dashboard?days=30&pendingDays=7&highRiskThreshold=70`

**Uso no frontend:** Exibir cards “Questionários pendentes (X)” e “Alunos em risco alto (X)” e listas clicáveis para abrir sessão/paciente.

---

## Próximas fases (resumo do planejamento)

- **Fase 8:** Portal do Aluno (auth patient), agendamento de questionários recorrentes, metas e objetivos.
- **Fase 9:** Planos de treino, histórico de treinos executados, fotos de progresso.
- **Fase 10:** App mobile (Expo), notificações push, LLM real (Claude Haiku).

---

**Data:** 2026-02-19
