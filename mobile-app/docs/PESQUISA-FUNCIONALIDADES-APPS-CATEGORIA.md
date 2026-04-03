# Pesquisa: principais funcionalidades de apps da mesma categoria

Pesquisa realizada para identificar funcionalidades comuns em **apps de treino/dieta para alunos** (lado cliente) e **apps de personal trainer / academia**. Objetivo: priorizar o que implementar no **Andromeda — App do Aluno**.

---

## Fontes consultadas

- ST Coach (app do aluno e do personal)
- EliteTrainer (Appaluno)
- PersonalGO, Trainify, App Treino
- Hevy, Strong, FitSW, MacroFactor
- MyFitnessPal, YAZIO, Cronometer
- Digital Gym Aluno, Personal Fit
- Artigos sobre trackers de treino e nutrição (2024)

---

## O que o app já tem

| Funcionalidade | Status |
|----------------|--------|
| Login (código org + e-mail + senha) | ✅ |
| Dashboard (resumo: sessões, evoluções, metas) | ✅ |
| Lista de treinos encaminhados | ✅ |
| Detalhe do plano de treino (dias, exercícios) | ✅ |
| Fotos e GIFs dos exercícios | ✅ |
| Registrar treino realizado (data, duração, observações) | ✅ |
| Lista de dietas encaminhadas | ✅ |
| Detalhe do plano de dieta (metas, restrições, refeições) | ✅ |
| Usuário de teste (demo sem backend) | ✅ |

---

## Funcionalidades principais da categoria (para implementar)

### 1. Treinos

| Funcionalidade | Descrição | Prioridade |
|----------------|-----------|------------|
| **Checklist por exercício** | Aluno marca cada série/exercício como concluído durante o treino | Alta |
| **Registro de carga e reps por série** | Anotar peso (kg) e repetições em cada série; histórico para progressão | Alta |
| **Cronômetro de descanso** | Timer entre séries (ex.: 90s) com alerta sonoro | Média |
| **Treino em andamento** | Modo “treino ativo”: ir marcando séries e ver próximo exercício | Alta |
| **Histórico de treinos** | Lista de treinos já realizados com data, duração e notas | Média |
| **Recordes pessoais (PR)** | Exibir melhor carga/reps por exercício (1RM ou série mais pesada) | Média |
| **Exportar treino em PDF** | Gerar PDF do plano para imprimir ou compartilhar | Baixa |

### 2. Dieta e nutrição

| Funcionalidade | Descrição | Prioridade |
|----------------|-----------|------------|
| **Registro de consumo diário** | Log de refeições (o que comeu) em relação às metas do plano | Alta |
| **Acompanhamento de água** | Registrar copos/ml de água e meta diária (ex.: 2,5 L) | Alta |
| **Lembrete de hidratação** | Notificação para beber água em horários configuráveis | Média |
| **Metas diárias visíveis** | Card/dashboard com kcal e macros do dia (consumido vs meta) | Alta |
| **Peso corporal** | Registrar peso periodicamente; gráfico de evolução | Alta |

### 3. Progresso e motivação

| Funcionalidade | Descrição | Prioridade |
|----------------|-----------|------------|
| **Fotos de progresso** | Envio de fotos (frente/lado/costas) com data; comparação antes/depois | Alta |
| **Medidas corporais** | Registrar cintura, quadril, braço, etc.; gráficos de evolução | Alta |
| **Gráficos de evolução** | Peso, medidas, sessões por semana, volume de treino ao longo do tempo | Alta |
| **Conquistas / gamificação** | Badges (ex.: “7 treinos no mês”, “Meta de água 7 dias”) | Média |
| **Resumo semanal/mensal** | “Você fez X treinos e Y sessões esta semana” | Média |

### 4. Comunicação e conteúdo

| Funcionalidade | Descrição | Prioridade |
|----------------|-----------|------------|
| **Chat com o treinador** | Mensagens diretas ou canal com o personal/nutri | Alta |
| **Notificações push** | Lembrete de treino, nova dieta, mensagem do treinador | Alta |
| **Arquivos/PDF** | Área para baixar dietas em PDF, avaliações, orientações | Média |
| **Vídeos nos exercícios** | Além de GIF/foto, link ou player de vídeo curto do exercício | Média |

### 5. Experiência e usabilidade

| Funcionalidade | Descrição | Prioridade |
|----------------|-----------|------------|
| **Modo offline** | Ver treinos e dietas já carregados sem internet | Média |
| **Widget / atalho** | “Iniciar treino de hoje” ou “Registrar água” na tela inicial | Baixa |
| **Cronômetro global** | Timer de treino (tempo total da sessão) | Baixa |
| **Suporte a Apple Watch / wearables** | Registrar treino ou água pelo relógio | Baixa |

---

## Priorização sugerida para o Andromeda

### Fase 1 — Alto impacto (treino + progresso)

1. **Checklist e registro de carga no treino** — Marcar séries concluídas e anotar peso/reps por série.
2. **Histórico de treinos realizados** — Lista com data, duração, plano e opção de ver detalhes.
3. **Registro de peso corporal** — Tela para informar peso e data; exibir no dashboard ou em “Progresso”.
4. **Fotos de progresso** — Envio de fotos com data; comparação lado a lado (antes/depois).

### Fase 2 — Dieta e hábitos

5. **Acompanhamento de água** — Meta diária (ml) e registro de consumo; barra ou cards no dashboard.
6. **Metas diárias em destaque** — Dashboard com kcal e macros (consumido vs meta), usando dados do plano.
7. **Registro de refeições** — Log simples (refeição + horário); opcional: kcal/macros por refeição.
8. **Lembrete de água** — Notificações locais em horários configuráveis.

### Fase 3 — Engajamento e comunicação

9. **Gráficos de evolução** — Peso, medidas e (se houver) volume de treino ao longo do tempo.
10. **Medidas corporais** — Cintura, quadril, braço, etc., com datas e gráficos.
11. **Notificações push** — Novos treinos, novas dietas, lembretes de treino (requer backend/push).
12. **Chat com treinador** — Requer backend (canal de mensagens ou integração WhatsApp).

### Fase 4 — Refino

13. **Cronômetro de descanso** entre séries.
14. **Recordes pessoais (PR)** por exercício.
15. **Conquistas / gamificação** (badges, streaks).
16. **Exportar treino em PDF** (geração no app ou via backend).

---

## Observações técnicas

- **Backend (Andromeda):** várias funcionalidades dependem de novos endpoints (ex.: salvar carga por série, peso, fotos, consumo de água, mensagens).
- **Armazenamento local:** histórico de treino ativo e cache de planos podem usar AsyncStorage ou SQLite para uso offline.
- **Fotos:** câmera ou galeria (expo-image-picker); upload para o backend ou armazenamento local até sincronizar.
- **Gráficos:** bibliotecas como `react-native-chart-kit` ou `victory-native` para evolução de peso e medidas.
- **Notificações:** `expo-notifications` para lembretes locais; push remoto exige configuração no backend e nas lojas.

---

*Documento gerado com base em pesquisa na web (sites de produtos, lojas de apps e artigos). Atualizar conforme novas funcionalidades forem implementadas.*
