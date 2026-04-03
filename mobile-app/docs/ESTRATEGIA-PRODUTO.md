# Estratégia de Produto — Andromeda App do Aluno

> Documento de execução estratégica elaborado com base em:
> - Análise técnica completa do código-fonte atual (março/2026)
> - Pesquisa de mercado: TrueCoach, TrainHeroic, Everfit, PT Distinction, Virtuagym, Treinador de Bolso, MyFitnessPal e outros
> - Benchmarks de retenção e engajamento do setor fitness B2B2C
> - Oportunidades identificadas no mercado brasileiro
>
> **Referência complementar:** `docs/PESQUISA-FUNCIONALIDADES-APPS-CATEGORIA.md`

---

## 1. Diagnóstico — Estado Atual

### 1.1 O que já funciona (base sólida)

O app está em estágio **MVP robusto**. As funcionalidades abaixo estão implementadas e funcionais:

| Módulo | Status | Observação |
|--------|--------|------------|
| Login multi-tenant | ✅ | Código org + e-mail + senha |
| Modo demo completo | ✅ | 3 treinos + 3 dietas mockados, sem backend |
| Treino em andamento (checklist + carga) | ✅ | Séries, peso, reps, duração |
| Histórico de treinos com detalhe | ✅ | Log por exercício/série persistido localmente |
| GIFs e imagens demonstrativas | ✅ | Diferencial presente — fallback GIF→imagem |
| Planos de dieta com macros | ✅ | Metas diárias + sugestão de refeições |
| Log diário de água | ✅ | Meta configurável + atalhos de ml |
| Log de refeições com kcal | ✅ | Por horário, sem macros individuais |
| Fotos de progresso | ✅ | Galeria por data e ângulo |
| Registro de peso corporal | ✅ | Com validação |
| Lembretes de hidratação | ✅ | Notificações locais configuráveis |
| Design system dark/consistente | ✅ | theme.ts centralizado |
| TypeScript + código organizado | ✅ | Boa base para escalar |

### 1.2 Lacunas críticas identificadas

Ordenadas por impacto no usuário e na retenção:

| # | Lacuna | Impacto no usuário | Impacto no negócio |
|---|--------|-------------------|--------------------|
| 1 | Dados locais não sincronizam com backend (peso, água, fotos, refeições) | Personal está cego sobre evolução do aluno | Produto sem loop fechado coach↔aluno |
| 2 | Sem timer de descanso entre séries | Usuário usa cronômetro externo — atrito direto | Feature citada em 73% das avaliações negativas de apps de treino |
| 3 | Sem histórico de carga anterior visível durante o treino | Aluno não sabe se está evoluindo em tempo real | Principal motivo de abandono em apps de musculação |
| 4 | Sem gráficos de evolução (peso, volume, força) | Progresso invisível = desmotivação | Apps com visualização retêm 3-4× mais usuários |
| 5 | Sem macros por refeição (P/C/G) | Nutricionista não acompanha micro | Impossibilita uso profissional real da feature de dieta |
| 6 | Fotos sem comparativo lado a lado | Feature mais retentiva do mercado — ausente | Perda do recurso com maior impacto em retenção documentado |
| 7 | Sem notificações push do backend | Aluno não sabe quando plano é atualizado | Comunicação coach↔aluno permanece no WhatsApp |
| 8 | Sem gamificação (streaks, conquistas) | Sem incentivo de longo prazo | Churn acelerado após primeiras semanas |
| 9 | Sem refresh token automático | Token expira → logout forçado inesperado | Atrito de UX que parece "bug" para o usuário |
| 10 | Dados armazenados em AsyncStorage sem criptografia | Tokens sensíveis expostos em dispositivos rooteados | Risco de segurança em produção |

---

## 2. Cenário Competitivo

### 2.1 Mapa dos concorrentes

| Player | Ponto forte | Ponto fraco | Relevância para nós |
|--------|-------------|-------------|---------------------|
| **TrueCoach** | Melhor UX do aluno do mercado; chat coach-aluno | Nutrição praticamente ausente | Benchmark de UX a superar |
| **TrainHeroic** | PRs, gráficos de força, progressão de carga | Sem nutrição; não é personal 1:1 | Benchmark de feature de treino |
| **Everfit** | Nutrição + treino integrados; grupos | App do aluno visualmente inferior | Benchmark de integração nutri+treino |
| **PT Distinction** | Ferramenta mais completa para o coach | App do aluno datado; complexo | Referência de abrangência |
| **Virtuagym** | Gamificação, white-label, comunidade | Focado em academias grandes; caro | Referência de engajamento |
| **Treinador de Bolso (BR)** | Mercado brasileiro, preço acessível | App desatualizado; sem inovação | Concorrente direto nacional a superar |
| **MyFitnessPal** | Banco de alimentos (14M+ itens) | Coaching inexistente | Referência em nutrição |

### 2.2 O white space a ocupar

> **Nenhum app combina hoje:** UX premium de treino + nutrição integrada real + progressão visual de força + localização brasileira (WhatsApp, português nativo, cultura de hipertrofia/estética).

Este é o posicionamento estratégico disponível.

### 2.3 Dados de retenção do mercado (benchmarks)

| Fator | Impacto na retenção |
|-------|---------------------|
| Log simples (< 3 toques por série) | Retenção D30 2× maior |
| 5+ treinos logados nos primeiros 30 dias | 70% de retenção em 90 dias |
| Nutrição integrada ao treino | +60% retenção |
| Wearable conectado | Retenção 2× maior |
| Visualização de progresso (gráfico/foto) | Retorno 3-4× mais frequente |
| Coach comenta log do aluno 1×/semana | Churn 50% menor |
| Foto comparativa antes/depois | Feature de maior impacto em retenção absoluta |

### 2.4 Mercado brasileiro — particularidades

- **2º maior mercado de personal trainers do mundo** (~350.000 profissionais CONFEF)
- **80% Android** — prioridade de testes e otimização
- **WhatsApp como canal esperado** — integração reduz fricção de adoção drasticamente
- **Modalidade dominante: musculação/hipertrofia** (não funcional/crossfit como no EUA) — impacta quais features têm mais valor
- **Grande informalidade** — coaches ainda usam planilha + WhatsApp → enorme oportunidade de digitalização
- **Sensibilidade a preço** — modelo freemium ou entrada baixa necessário para aquisição
- **Parcelamento esperado** em qualquer produto pago

---

## 3. Visão de Produto

### Missão

Ser o app mais usado entre alunos de personal trainers brasileiros, tornando a experiência de treinar e se alimentar melhor **visível, viciante e conectada** ao profissional que os acompanha.

### Princípios de design de produto

1. **Zero atrito no momento do treino** — nenhum clique desnecessário enquanto o aluno está suado com halteres na mão
2. **Progresso sempre visível** — o aluno deve saber, em qualquer tela, que está evoluindo
3. **Loop fechado coach↔aluno** — cada dado inserido pelo aluno deve chegar ao profissional
4. **IA amplifica o coach, não substitui** — no mercado brasileiro, a relação humana é o produto; tecnologia serve a ela
5. **WhatsApp-friendly** — o app compete com a inércia do WhatsApp, não contra ele

---

## 4. Roadmap Estratégico

### Fase 1 — "O treino que vicia" (Sprint 1-2 · ~3 semanas)

**Objetivo:** Tornar o fluxo de treino ativo tão bom que o usuário não consiga mais treinar sem o app.

**Por que primeiro:** É o módulo mais usado, com maior frequência. Cada melhoria aqui é sentida a cada sessão de treino. Custo de implementação baixo — dados já existem no AsyncStorage.

---

#### F1.1 — Timer de descanso entre séries

**Problema:** Usuário usa cronômetro externo → atrito direto, rompe imersão no treino.

**Solução:**
- Ao marcar uma série como concluída em `ActiveWorkoutScreen`, iniciar automaticamente timer regressivo
- Valor padrão: lido do campo `rest` do `planJson` (ex.: `"90s"` → 90 segundos)
- Se `rest` ausente: padrão configurável (sugestão: 60s)
- Feedback: vibração + som suave ao zerar
- UI: círculo animado sobreposto, discreto, não bloqueia tela
- Ação: botão "Pular" e "+" 30s

**Arquivos afetados:** `src/screens/ActiveWorkoutScreen.tsx`

**Dependências técnicas:** Nenhuma nova biblioteca. Usar `setInterval` + `Vibration` (React Native built-in)

---

#### F1.2 — Histórico de carga anterior visível durante o treino

**Problema:** Aluno não sabe quanto levantou na última sessão → não consegue progredir conscientemente.

**Solução:**
- Ao carregar `ActiveWorkoutScreen`, buscar último `SavedWorkoutLog` do mesmo `planId` via `getWorkoutLogs()`
- Para cada exercício, exibir embaixo dos campos de série: `"Última: 80 kg × 6 reps"`
- Se é novo exercício sem histórico: `"Primeira vez — defina sua carga base"`
- Badge destacado ao superar: `"🔥 Novo PR!"` com animação leve

**Arquivos afetados:** `src/screens/ActiveWorkoutScreen.tsx`, `src/storage/workoutLogs.ts`

**Dependências técnicas:** Dados já estão no AsyncStorage. Apenas lógica de cruzamento.

---

#### F1.3 — Volume total e 1RM estimado pós-sessão

**Problema:** Usuário não tem noção objetiva de se foi um treino bom ou fraco.

**Solução:**
- Na tela de resumo pós-treino (ao finalizar `ActiveWorkoutScreen`), exibir:
  - **Volume total da sessão:** `Σ (séries × reps × peso)` em kg
  - **1RM estimado** por exercício principal: `peso × (1 + reps/30)` (fórmula Epley)
  - **Comparativo vs sessão anterior:** `"Volume +12% ↑"` ou `"Volume -5% ↓"`
- Card visual compartilhável (base para feature de relatório da Fase 2)

**Arquivos afetados:** `src/screens/ActiveWorkoutScreen.tsx`

**Dependências técnicas:** Nenhuma. Cálculo local com dados já coletados.

---

### Fase 2 — "O progresso que motiva" (Sprint 3-4 · ~3 semanas)

**Objetivo:** Tornar o progresso visível e comemorável. Criar o hábito de abrir o app fora do treino.

---

#### F2.1 — Gráfico de evolução de peso corporal

**Problema:** Peso registrado aparece só em lista. Tendência invisível = desmotivação, mesmo quando há progresso.

**Solução:**
- Adicionar gráfico de linha em `WeightLogScreen` (últimos 30/60/90 dias com toggle)
- Linha de tendência suavizada (média móvel 7 dias)
- Linha tracejada da meta (se definida)
- Destaque de marcos: `"Mínimo: 74,2 kg"`, `"Perda total: 3,8 kg"`
- Mesmo componente reutilizável para volume de treino e kcal (Fase 2.3)

**Biblioteca:** `victory-native` (já compatível com Expo) ou `react-native-gifted-charts`

**Arquivos afetados:** `src/screens/WeightLogScreen.tsx`, novo componente `src/components/EvolutionChart.tsx`

---

#### F2.2 — Fotos de progresso com comparativo lado a lado

**Problema:** Galeria de fotos sem comparação antes/depois — feature mais retentiva do mercado, ausente.

**Solução:**
- Adicionar botão "Comparar" em `ProgressPhotosScreen`
- Selecionar 2 datas e mesmo ângulo
- Exibir split view horizontal com `PanResponder` para deslize
- Opção de exportar como imagem compartilhável (`expo-sharing`)
- Marca d'água discreta: logo do app + data de cada foto

**Arquivos afetados:** `src/screens/ProgressPhotosScreen.tsx`, novo componente `src/components/PhotoCompare.tsx`

---

#### F2.3 — Gráfico de volume de treino (força ao longo do tempo)

**Problema:** Aluno não vê tendência de força — não sabe se está ficando mais forte semana a semana.

**Solução:**
- Em `WorkoutHistoryScreen`, adicionar toggle "Ver gráfico"
- Gráfico de linha: volume total por sessão ao longo do tempo
- Por exercício: curva de 1RM estimado (dados já calculados na F1.3)
- Filtro por exercício: dropdown com exercícios logados

**Arquivos afetados:** `src/screens/WorkoutHistoryScreen.tsx`

---

#### F2.4 — Relatório semanal automático (card compartilhável)

**Problema:** Aluno não tem visão consolidada da semana. Sem celebração = sem retenção de longo prazo.

**Solução:**
- Todo domingo (ou ao abrir o app na segunda), gerar card visual com:
  - Treinos realizados na semana (`X de Y planejados`)
  - Volume total de treino (kg)
  - Média de água diária (% da meta)
  - Variação de peso da semana
  - Frase motivacional contextual
- Exportar como imagem via `expo-sharing` (Instagram-friendly, dark theme)
- Notificação local: `"Seu resumo da semana está pronto 💪"`

**Arquivos afetados:** Novo serviço `src/services/weeklyReport.ts`, novo componente `src/components/WeeklyReportCard.tsx`

---

### Fase 3 — "A nutrição que fecha o ciclo" (Sprint 5-6 · ~3 semanas)

**Objetivo:** Elevar o módulo de dieta ao nível profissional. Nutricionista e personal passam a ter dados reais de adesão.

---

#### F3.1 — Macro tracking por refeição (P/C/G)

**Problema:** Hoje só registra kcal. Nutricionista não consegue acompanhar distribuição de macros.

**Solução:**
- Adicionar campos `proteinG`, `carbsG`, `fatG` no form de refeição em `DailyLogScreen`
- Campos opcionais (não obrigatórios — reduz atrito)
- Totais diários: barra de progresso por macro vs meta do plano ativo
  - Proteína consumida X g / meta Y g → barra colorida
  - Carboidratos: idem
  - Gorduras: idem
- Comparar consumido vs prescrito pelo nutricionista (dados já em `DietPlanDetail`)

**Arquivos afetados:** `src/screens/DailyLogScreen.tsx`, `src/storage/mealLogs.ts`, `src/types/index.ts`

---

#### F3.2 — Notificação de refeição no horário sugerido

**Problema:** Plano de dieta tem horários sugeridos mas nenhum lembrete. Aluno esquece.

**Solução:**
- Ao visualizar `DietPlanDetail`, botão `"Ativar lembretes de refeição"`
- Cria notificações locais (`expo-notifications`) para cada horário do `mealPlanJson`
- Mensagem: `"Hora do almoço 🥗 — sua meta: 600 kcal, 40g proteína"`
- Configurável: pode desativar por refeição individualmente

**Arquivos afetados:** `src/screens/DietPlanDetailScreen.tsx`, `src/services/mealReminderNotifications.ts` (novo, similar ao waterReminderNotifications.ts)

---

#### F3.3 — Dashboard de adesão nutricional

**Problema:** Não há visão histórica de cumprimento das metas de dieta.

**Solução:**
- Nova seção em `HomeScreen` ou nova aba em `DailyLogScreen`: "Minha semana nutricional"
- 7 cards de dias (seg-dom): verde se atingiu meta kcal ±10%, vermelho se não registrou, cinza se sem dados
- Gráfico simples: kcal consumida por dia vs meta
- Insight automático: `"Você costuma consumir mais kcal aos fins de semana"`

---

### Fase 4 — "O engajamento que retém" (Sprint 7-8 · ~3 semanas)

**Objetivo:** Criar mecanismos de habituação de longo prazo. Transformar usuários esporádicos em usuários diários.

---

#### F4.1 — Sistema de conquistas e streaks

**Problema:** Sem incentivo de longo prazo além da própria evolução. Usuário abandona após primeiras semanas.

**Solução — Conquistas por categoria:**

*Treino:*
- `"Primeiro treino"` — ao completar 1ª sessão
- `"Consistência"` — 5, 10, 25, 50, 100 treinos realizados
- `"Semana perfeita"` — 3+ treinos em uma semana
- `"Força crescendo"` — PR superado 3 semanas consecutivas
- `"Maratonista"` — treino com mais de 90 minutos

*Nutrição:*
- `"Hidratado"` — meta de água atingida 7 dias seguidos
- `"Na dieta"` — meta de kcal respeitada 5 dias seguidos
- `"Proteína em dia"` — meta de proteína atingida 3 dias seguidos

*Progresso:*
- `"Evolução real"` — 5 registros de peso
- `"Antes e depois"` — primeira comparação de fotos

**Streaks:**
- Contador diário: qualquer log (treino, refeição, água ou peso) conta
- Indicador visual persistente no `HomeScreen`
- Animação e notificação ao atingir marcos: 3, 7, 14, 21, 30 dias

**Arquivos afetados:** `src/storage/achievements.ts` (novo), `src/screens/HomeScreen.tsx`, `src/services/achievementEngine.ts` (novo)

---

#### F4.2 — Sugestão inteligente de progressão de carga

**Problema:** Plano de treino é estático. Aluno usa mesma carga semanas seguidas sem progressão automática.

**Solução (sem IA complexa — lógica baseada em regras):**
- Se aluno completou 100% das séries e reps de um exercício nas últimas 2 sessões: exibir sugestão
  - `"Você completou todas as séries com facilidade nas últimas 2 sessões. Que tal tentar 82,5 kg hoje? (+2,5 kg)"`
- Se aluno não completou nenhuma série completa: `"Tente reduzir 5% e focar na técnica esta sessão"`
- Sugestão discreta, nunca obrigatória, sempre com aviso: `"Confirme com seu personal antes de alterar"`

**Arquivos afetados:** `src/screens/ActiveWorkoutScreen.tsx`, `src/storage/workoutLogs.ts`

---

#### F4.3 — Medidas corporais com gráfico

**Problema:** Usuário perde gordura mas a balança não muda (ganho de músculo simultâneo) → desmotiva sem medidas corporais.

**Solução:**
- Nova tela `BodyMeasurementsScreen`
- Campos: cintura (cm), quadril (cm), braço direito/esquerdo (cm), coxa (cm), peito (cm)
- Frequência sugerida: quinzenal ou mensal
- Gráfico de linha por medida ao longo do tempo
- Reaproveitar componente `EvolutionChart` da F2.1

**Arquivos afetados:** `src/storage/bodyMeasurements.ts` (novo), `src/screens/BodyMeasurementsScreen.tsx` (novo), `src/navigation/AppNavigator.tsx`

---

### Fase 5 — "O loop fechado" (Sprint 9-11 · ~4 semanas)

**Objetivo:** Sincronizar dados do aluno com o backend Andromeda. Personal e nutricionista passam a ver evolução em tempo real.

---

#### F5.1 — Sincronização de progresso com backend

**Problema:** Todo dado coletado (peso, água, fotos, refeições, medidas) fica preso no dispositivo. Coach está cego.

**Solução — Arquitetura de sync:**
- Fila de sincronização local (`syncQueue` em AsyncStorage/SQLite)
- Cada item criado localmente é marcado como `pendingSync: true`
- Worker de background tenta sincronizar quando há conexão
- Após sync bem-sucedido, marca `pendingSync: false`
- Indicador visual sutil: ícone de nuvem com status

**Novos endpoints necessários no Andromeda (negociar com backend):**
```
POST /v1/patient-portal/my-weight-logs
POST /v1/patient-portal/my-water-logs
POST /v1/patient-portal/my-meal-logs    (com macros)
POST /v1/patient-portal/my-body-measurements
POST /v1/patient-portal/my-progress-photos
GET  /v1/patient-portal/my-progress-summary  (para dashboard)
```

---

#### F5.2 — Notificações push remotas (FCM)

**Problema:** Aluno não é notificado quando personal envia novo plano, faz comentário ou atualiza treino.

**Solução:**
- Integrar Firebase Cloud Messaging (FCM) para Android / APNS para iOS
- Backend Andromeda dispara push nos eventos:
  - Novo plano de treino enviado
  - Novo plano de dieta enviado
  - Coach comentou no log do aluno
  - Check-in solicitado pelo coach
- Deep link na notificação → abre tela relevante diretamente
- Gerenciamento de permissões de notificação no onboarding

**Bibliotecas:** `expo-notifications` (já presente) + configuração de push remoto

---

#### F5.3 — Refresh token automático

**Problema:** Token expira → logout forçado inesperado, parece bug para o usuário.

**Solução:**
- Em `client.ts`, interceptar respostas `401`
- Tentar `POST /v1/auth/refresh` com `refreshToken` do AsyncStorage
- Se bem-sucedido: atualizar token e repetir requisição original silenciosamente
- Se refresh também falhar: disparar logout com mensagem clara: `"Sua sessão expirou. Faça login novamente."`

**Arquivos afetados:** `src/api/client.ts`, `src/context/AuthContext.tsx`

---

### Fase 6 — "O diferencial defensável" (Backlog estratégico)

Funcionalidades de alto valor estratégico para execução após consolidação das fases anteriores:

---

#### F6.1 — Integração WhatsApp Business (exclusivo Brasil)

**Por que é diferencial:** Brasileiro não muda canal. O app que chega via WhatsApp tem adoção orgânica natural.

**O que construir:**
- Notificações críticas via WhatsApp Business API: novo plano, conquista semanal, resumo mensal
- Check-in semanal: bot pergunta via WhatsApp → resposta entra no dashboard do coach
- Link direto: personal envia `https://andromeda.app/treino/hoje` → abre treino do dia diretamente

**Dependência:** WhatsApp Business API (Meta) + configuração no backend Andromeda

---

#### F6.2 — IA de sugestão nutricional pós-treino

**Posicionamento crítico:** IA deve amplificar o coach, não substituí-lo.

**O que construir:**
- Após registrar treino, notificação contextual: `"Você acabou de treinar! Que tal registrar a refeição pós-treino?"`
- Sugestão baseada nas metas do plano ativo: `"Seu plano sugere 40g de proteína na janela pós-treino. Registrar refeição agora?"`
- Badge no `DailyLogScreen`: `"Dia de treino — meta de proteína aumentada para 180g"`
- Integração futura: ChatGPT/Claude para responder dúvidas frequentes (com disclaimer: "Confirme com seu profissional")

---

#### F6.3 — Integração Apple Health / Google Fit

**Por que agrega valor:**
- Importar passos, calorias ativas e sono automaticamente
- Usar dados de sono para adaptar mensagem do dia: `"Você dormiu pouco ontem. Considere reduzir intensidade hoje."`
- Usuários com wearable conectado têm retenção 2× maior

**Bibliotecas:** `expo-health` (em desenvolvimento) ou módulo nativo

---

#### F6.4 — Modo offline completo

**Por que é necessário:** Academia frequentemente tem wi-fi ruim. Usuário que perde dados desinstala.

**O que construir:**
- Cache dos planos ativos no primeiro carregamento
- Fila de sync para logs criados offline
- Indicador visual: `"Modo offline — dados serão sincronizados quando houver conexão"`
- Substituir AsyncStorage por WatermelonDB (SQLite) para dados críticos

---

#### F6.5 — White-label para personal trainer individual

**Oportunidade de mercado:** PT Distinction cobra caro pelo white-label. Coaches individuais querem app com sua marca.

**O que construir:**
- Configurações de tema por organização (logo, cor primária, nome do app)
- Lidas na inicialização via API: `GET /v1/org/branding`
- Sem recompilação do app — configuração dinâmica via JSON

---

## 5. Débitos Técnicos a Resolver em Paralelo

Não bloqueiam features mas devem ser atacados progressivamente:

| Débito | Risco | Quando resolver |
|--------|-------|-----------------|
| Token em AsyncStorage (sem criptografia) | Segurança em prod | Antes do lançamento público — usar `expo-secure-store` |
| Sem testes automatizados | Regressões silenciosas | Sprint 3 em diante — Jest + React Native Testing Library |
| `planJson` tipado como `Record<string, unknown>` | Runtime crash se estrutura mudar | Fase 3 — adicionar Zod para validação |
| Sem retry em falhas de rede | UX ruim em conexão instável | Fase 5 — junto com sync |
| Memory leaks em `useEffect` sem cleanup | Warning no console; performance | Fase 3 |
| Sem observabilidade (crash reporting) | Impossível debugar em prod | Antes do lançamento público — Sentry ou Firebase Crashlytics |

---

## 6. Métricas de Sucesso por Fase

### Fase 1 (Treino que vicia)
- **DAU/WAU ratio** > 0,35 (usuário ativo mais de 2,5 dias/semana)
- **Sessions per user/week** > 3
- Tempo médio na `ActiveWorkoutScreen` > 25 minutos

### Fase 2 (Progresso que motiva)
- **D30 retention** > 30% (mercado médio: 10-15%)
- Feature de comparação de foto usada por > 40% dos usuários com 2+ semanas
- Relatório semanal compartilhado por > 15% dos usuários ativos

### Fase 3 (Nutrição que fecha o ciclo)
- Usuários que loggam refeição + treino no mesmo dia: > 50% dos usuários ativos
- **D90 retention** de usuários com macro tracking > 2× a de quem não usa

### Fase 4 (Engajamento que retém)
- Streak médio dos usuários ativos > 12 dias
- Conquistas desbloqueadas por > 60% dos usuários no primeiro mês

### Fase 5 (Loop fechado)
- % de logs sincronizados com backend > 95%
- Coach com acesso a dados do aluno → redução de churn do side B2B (menos cancelamentos de planos Andromeda)

---

## 7. Dependências e Riscos

### Dependências de backend (Andromeda)
| Endpoint necessário | Para qual feature | Prioridade |
|--------------------|-------------------|------------|
| `POST /v1/patient-portal/my-weight-logs` | F5.1 | Alta |
| `POST /v1/patient-portal/my-water-logs` | F5.1 | Alta |
| `POST /v1/patient-portal/my-meal-logs` (com macros) | F3.1 + F5.1 | Alta |
| `POST /v1/patient-portal/my-body-measurements` | F4.3 + F5.1 | Média |
| Notificações push (FCM trigger) | F5.2 | Alta |
| `GET /v1/auth/refresh` | F5.3 | Alta |
| `POST /v1/patient-portal/my-progress-photos` | F5.1 | Média |
| Branding por organização | F6.5 | Baixa |

### Riscos identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Backend Andromeda não prioriza novos endpoints | Média | Alto | Fases 1-4 são 100% offline/local, não dependem do backend |
| Concorrente nacional lança feature similar | Média | Médio | Velocidade de execução + profundidade de UX como vantagem |
| Usuário não adere ao log diário | Alta | Alto | Redução máxima de atrito (< 3 toques), gamificação, notificações contextuais |
| Tamanho do app cresce com gráficos/libs | Baixa | Baixo | Escolha de bibliotecas leves (victory-native ~200kb) |

---

## 8. Resumo Executivo

### O que fazer agora (Fase 1 — máximo retorno, mínimo esforço)

As 3 features abaixo podem ser implementadas em **1-2 semanas** usando dados que já existem no app, sem nenhuma dependência de backend:

1. **Timer de descanso** entre séries (dados `rest` já vêm do `planJson`)
2. **Histórico de carga anterior** visível durante o treino (dados já no AsyncStorage)
3. **Volume total + 1RM estimado** pós-sessão (cálculo local)

Essas 3 juntas colocam o app em nível equivalente ao **TrainHeroic** em experiência de musculação — que é o benchmark do mercado para este fluxo.

### O que fazer na sequência (Fase 2 — retenção e marketing)

4. **Gráfico de peso** (visualização de progresso)
5. **Foto comparativa** lado a lado (maior impacto em retenção)
6. **Relatório semanal** compartilhável (retenção + aquisição orgânica)

### A aposta de longo prazo

O **loop fechado coach↔aluno** (Fase 5) é o maior diferencial estratégico. Quando o personal e nutricionista puderem ver em tempo real o que o aluno está fazendo — peso, água, macros, fotos, aderência ao treino — o app deixa de ser uma ferramenta do aluno e se torna uma **plataforma de dados de saúde** que justifica o valor da assinatura Andromeda completa.

---

*Documento criado em março/2026. Revisar e atualizar ao iniciar cada fase.*
