# Auditoria técnica — patient-app (Expo / React Native)

**Data:** Março 2025  
**Escopo:** Estabilidade, qualidade de código, UX mobile, performance, acessibilidade, escalabilidade e confiabilidade em Android e iOS.

---

# 1. Resumo executivo

- **Estado geral:** App funcional, com boa separação de telas, APIs e storage local. Navegação clara (tabs + stacks). Pontos críticos: falta de timeout em rede, tela em branco em estados de loading inicial e ausência de Error Boundary; vários deles foram corrigidos nesta auditoria.
- **Avaliação técnica:** Base adequada para evolução, com temas dinâmicos, sync offline e refresh de token. Há acoplamento moderado em algumas telas (ex.: HomeScreen com muitas responsabilidades) e uso misto de tema (estático vs. ThemeContext).
- **Principais riscos:** Rede lenta ou indisponível sem timeout (mitigado com 30s); crash não tratado em render (mitigado com Error Boundary); tela branca ao carregar auth/onboarding (mitigado com loading view).
- **Principais oportunidades:** Padronizar tema em todas as telas; extrair lógica da Home para hooks/serviços; adicionar testes E2E para fluxos críticos; documentar contrato de API e cenários de erro.
- **Maturidade:** Nível intermediário — pronto para produção com as correções aplicadas; próxima etapa é endurecer testes, métricas e observabilidade.

---

# 2. Arquitetura e estrutura

## Como o projeto está organizado

- **Entry:** `index.ts` → `registerRootComponent(App)`; `App.tsx` monta providers (ErrorBoundary, GestureHandler, Auth, Branding, Theme, UnreadNotifications, Network) e `AppNavigator`.
- **Navegação:** React Navigation (native-stack + bottom-tabs). Auth flow: Stack com Login/Register quando não autenticado; após login, Stack com `Main` (TabNavigator). Tabs: Início (Home), Treinos (stack), Dieta (stack), Progresso (stack com hub), Conversar (stack).
- **Tema:** `src/theme.ts` (paletas dark/light, spacing, radius, typography); `ThemeContext` persiste preferência em AsyncStorage e fornece `colors` dinâmicos. Parte das telas ainda importa `colors` estático.
- **Serviços:** `src/api/` (client, auth, training, diet, notifications, progressApi, andromeda); `src/services/` (syncService, pushService, weeklyReport, achievementEngine, postWorkoutNotification, etc.); `src/storage/` (weightLogs, workoutLogs, waterLogs, mealLogs, syncQueue, achievements, etc.).
- **Componentes base:** `src/components/ui/` (Button, EmptyState); `src/components/` (OfflineBanner, EvolutionChart, WeeklyReportCard, PhotoCompare, ExerciseMedia); `ErrorBoundary` no root.
- **Hooks/estado:** Contextos (Auth, Branding, Theme, Network, UnreadNotifications); estado local predominante nas telas; sem Redux/Zustand/React Query.

## Problemas principais

- **Telas muito carregadas:** HomeScreen concentra carga de dados, sync, push, notificações e UI; ActiveWorkoutScreen tem muita lógica de treino em um único arquivo. Recomenda-se extrair hooks (ex.: `useHomeData`, `useActiveWorkout`) e manter telas focadas em UI.
- **Tema inconsistente:** Algumas telas usam `useTheme().colors`, outras importam `colors` de `theme.ts`. Em modo claro, apenas navegação, Perfil e ProgressHub refletem o tema; demais permanecem escuras até migração.
- **Acoplamento navegação/lógica:** Push handler e deep links conhecem nomes de telas e estrutura de tabs; aceitável, mas centralizar em um mapa de rotas reduz fragilidade.
- **Sem camada de repositório:** APIs são chamadas diretamente das telas ou de serviços; uma camada de repositório (ou hooks de dados) facilitaria cache, retry e testes.

## Escalabilidade

- Estrutura de pastas (screens, api, storage, services, context, components) escala bem. Inclusão de feature-based modules no futuro é possível sem quebrar o atual.
- Estado global limitado a poucos contextos evita “inferno de contexto”; para mais estado compartilhado, considerar Zustand ou React Query em vez de novos contextos.
- Navegação com tipos (TrainingStackParamList, etc.) é boa base para deep linking e tipos seguros.

---

# 3. Diagnóstico completo

## Configuração Expo

- **app.json:** Nome, slug, ícone, splash, orientation portrait; iOS supportsTablet; Android adaptiveIcon; `userInterfaceStyle` alterado para `automatic` para respeitar sistema/tema. Não há `app.config.js/ts`; configuração é mínima e coerente.
- **package.json:** Expo ~54, React 19.1, React Native 0.81; dependências móveis alinhadas (react-native-screens, safe-area-context, gesture-handler, netinfo, etc.). Scripts: start, android, ios, web, typecheck, test, ci.
- **tsconfig:** `extends: "expo/tsconfig.base"`, `strict: true`. Adequado.
- **Babel:** Não há `babel.config.js` no repositório; Expo usa preset padrão. Sem plugins customizados necessários para o estado atual.
- **Riscos:** Nenhum segredo em app.json. Build EAS não foi validado nesta auditoria (sem eas.json encontrado); recomendável configurar EAS Build e updates quando for publicar.

## Navegação

- **Estrutura:** Stack raiz → (Main Tabs | Login/Register | Onboarding). Tabs: 5 abas; cada uma com stack próprio. Progresso inicia em ProgressHub (menu lateral) e navega para WeightLog, ProgressPhotos, etc.
- **Auth/Onboarding:** Se `isLoading` ou (logado e `onboardingDone === null`), antes retornava `null` (tela branca); corrigido para View com ActivityIndicator e cores do tema.
- **Deep linking:** pushService navega para Main → screen + params; funciona desde que NavigationContainer e ref estejam prontos. Falha silenciosa em try/catch evita crash.
- **Persistência:** Estado de navegação não é persistido; ao reabrir o app o usuário cai na tab inicial. Aceitável para este produto.
- **Melhorias:** Tipar `navigation` nas telas com `NativeStackNavigationProp` quando possível; considerar `linking` config para URLs externas se houver links do backend.

## Estado e fluxo de dados

- **Contextos:** Auth (token, user, tenantId, login, register, logout, refresh); Branding (primaryColor); Theme (theme, colors, setTheme); Network (isConnected, isOffline); UnreadNotifications (unreadCount, setUnreadCount). Bem delimitados.
- **Estado local:** Muito usado em telas (useState para listas, loading, formulários). HomeScreen tinha `load` sem useCallback e useEffect com [token, tenantId] sem incluir load; corrigido com useCallback(load, [token, tenantId]) e useEffect([load]) para evitar closure obsoleta e satisfazer exhaustive-deps.
- **Re-renders:** Sem React.memo em listas; FlatList já virtualiza. TabIcon e componentes pequenos não foram memoizados; impacto baixo.
- **Fonte de verdade:** Dados do servidor são buscados ao montar/refresh; não há cache global (ex.: React Query). Sync queue é a fonte de verdade para dados pendentes de envio.
- **Side effects:** useEffect para carregar dados e registrar listeners (push, netinfo); posicionamento adequado. Evitar novos efeitos que dependam de muitos estados sem useCallback estável.

## UI/UX mobile

- **Consistência:** theme.ts (spacing, radius, typography, touchTargetMin) e cores usadas de forma consistente nas telas auditadas. Botões com Button component; inputs com altura e bordas padronizadas.
- **Headers/Tabs:** Headers nativos com título; tab bar com ícones e labels. SafeAreaView nas telas principais (Home, Login, Onboarding).
- **Empty/Loading/Error:** EmptyState em listas (treinos, dieta); ActivityIndicator em carregamento; Alert para erros de formulário e login. Falta em algumas telas: estado de erro genérico (ex.: “Falha ao carregar, toque para tentar”).
- **Formulários:** Login com KeyboardAvoidingView e keyboardShouldPersistTaps; labels e placeholders claros. Validação básica antes de submit.
- **Listas:** FlatList em TrainingPlans, DietPlans, WorkoutHistory com keyExtractor e refreshControl; adicionado initialNumToRender e maxToRenderPerBatch em TrainingPlansScreen para primeira pintura.
- **Toque:** touchTargetMin 44 usado em vários lugares; alguns links poderiam ter minHeight garantido.
- **Melhorias:** Unificar feedback de erro em listas (retry); revisar contraste em modo claro onde ainda não aplicado; considerar gesto de “pull to refresh” em mais listas.

## Performance

- **Fetch:** apiFetch não tinha timeout; em rede lenta o app podia ficar pendurado. Corrigido com AbortController e 30s (configurável por chamada).
- **Listas:** FlatList com keyExtractor; otimização initialNumToRender/maxToRenderPerBatch aplicada em uma lista; replicar em DietPlansScreen e WorkoutHistoryScreen se listas forem longas.
- **HomeScreen:** Múltiplos setState em sequência no load(); React 18 batching reduz re-renders; manter um único “setData” por tipo de dado seria mais explícito mas não obrigatório.
- **ActiveWorkoutScreen:** Muitos useEffects e estado; intervalo de 10s para cronômetro é leve. Sem memoização pesada necessária no estado atual.
- **Imagens:** Uso de image picker e exibição de fotos de progresso; não foi auditado uso de expo-image para cache/otimização.

## APIs e dados

- **Cliente:** apiFetch com headers (Content-Type, x-tenant-id, Authorization), retry em 401 com refresh token, parsing de erro e mensagem amigável. Timeout de 30s adicionado; AbortError mapeado para mensagem em português.
- **Contratos:** types/index.ts define DTOs; respostas da API são tipadas nas chamadas. Risco: payload inesperado pode quebrar em runtime; validação (ex.: zod) em pontos críticos recomendada a longo prazo.
- **Tratamento de erro:** try/catch nas telas com Alert ou setState de erro; syncService ignora falhas por item e continua. Sem retry automático configurável no client.
- **Loading/vazio:** Telas exibem loading enquanto fetch; empty state quando lista vazia. Falta em alguns fluxos: erro de rede com opção “Tentar novamente”.
- **Auth:** Login/register com credenciais; token e refresh persistidos em AsyncStorage; refresh em 401; logout limpa storage. Fluxo de sessão e expiração está coerente.

## Segurança e confiabilidade

- **Segredos:** EXPO_PUBLIC_API_URL em .env; .env.example documenta. ANDROMEDA_DEV_TOKEN em código é literal para dev; não é segredo de produção.
- **Storage:** AsyncStorage para token, user, tenant, tema, onboarding, sync queue, etc. Dados sensíveis (token) em AsyncStorage são aceitáveis em muitos cenários; para maior segurança considerar expo-secure-store para token em produção.
- **Logs:** Nenhum log de token ou senha encontrado; ErrorBoundary em DEV loga erro no console.
- **Validação:** Inputs de login e formulários validados antes de submit; API pode retornar 4xx com mensagem. Não há validação de schema nas respostas.
- **Confiabilidade:** Timeout e Error Boundary reduzem risco de app “travado” ou tela branca; fluxos de logout e refresh token evitam estado inconsistente de sessão.

## Acessibilidade

- **Labels:** Vários botões e links com accessibilityLabel (Login, Home cards, Perfil, etc.). Campos de texto com accessibilityLabel em Login.
- **Roles:** accessibilityRole="button" em TouchableOpacity principais. Button component expõe accessibilityState (disabled, busy).
- **Contraste:** Tema escuro com texto claro; tema claro definido em lightColors. Manter contraste adequado em textos secundários.
- **Toque:** touchTargetMin 44; alguns itens de lista e links cumprem. Revisar todos os toques para garantir mínimo 44pt.
- **Feedback:** Alert para erros; loading com ActivityIndicator. Falta: anunciar mudanças relevantes para leitores de tela (ex.: “Sincronizado”) onde fizer sentido.

## Manutenção

- **Arquivos grandes:** ActiveWorkoutScreen e HomeScreen são os mais longos; extrair hooks e subcomponentes melhora legibilidade e testes.
- **Duplicação:** Padrão de “load + useEffect + loading/empty” repetido em várias telas; um hook useAsyncData ou similar reduz duplicação.
- **Nomes:** Nomes de telas e tipos são claros; alguns arquivos em storage/services poderiam ter sufixos mais explícitos (ex.: weightLogsStorage).
- **Tipagem:** TypeScript strict; tipos em types/index.ts e parâmetros de navegação tipados. Alguns `as` em payloads de sync (progressApi, syncService) são pontos de atenção se o backend mudar contrato.
- **Padrões:** Uso de StyleSheet.create e theme consistente; mistura de estilos estáticos vs. dinâmicos (createStyles(colors)) em poucas telas.

## Testes

- **Jest:** Configurado com ts-jest, testEnvironment node, roots em src, testMatch *.test.ts. theme.test.ts existe; cobertura de lógica crítica é mínima.
- **Testabilidade:** Lógica de negócio em telas e em serviços (sync, achievements) dificulta unit tests sem montar árvore React. Extrair funções puras e hooks facilita testes.
- **Fluxos críticos:** Login, refresh token, sync, carregamento da Home e treino ativo são candidatos a testes (unitários para funções, E2E para fluxos principais).
- **Recomendação:** Aumentar testes em storage e serviços (syncQueue, workoutLogs, apiFetch com timeout); depois adicionar testes de integração ou E2E para login e um fluxo de treino.

---

# 4. Problemas encontrados

| # | Arquivo/Área | Descrição | Impacto | Prioridade | Correção |
|---|--------------|-----------|---------|------------|----------|
| 1 | src/api/client.ts | Fetch sem timeout; rede lenta deixa requisição pendurada | Usuário fica sem feedback; possível travamento percebido | Alta | Adicionar AbortController + timeout 30s (implementado) |
| 2 | App root | Nenhum Error Boundary; erro em render = tela branca | Crash não tratado; má experiência | Alta | ErrorBoundary no root (implementado) |
| 3 | app.json | userInterfaceStyle "light" fixo | Conflito com tema escuro padrão do app | Média | userInterfaceStyle "automatic" (implementado) |
| 4 | AppNavigator | Retorno `null` quando isLoading ou onboardingDone === null | Tela totalmente branca por segundos | Alta | View com ActivityIndicator e cores do tema (implementado) |
| 5 | HomeScreen | load() não estava em useCallback; useEffect sem load nas deps | Possível closure obsoleta; avisos de lint | Média | useCallback(load, [token, tenantId]) e useEffect([load]) (implementado) |
| 6 | TrainingPlansScreen | FlatList sem initialNumToRender/maxToRenderPerBatch | Primeira pintura pode renderizar muitos itens | Média | initialNumToRender={10}, maxToRenderPerBatch={10} (implementado) |
| 7 | Várias telas | Tema estático (import colors); modo claro não refletido | Inconsistência ao desativar modo escuro | Média | Migrar para useTheme() gradualmente (recomendado) |
| 8 | HomeScreen / ActiveWorkoutScreen | Muita lógica e estado em um componente | Dificulta manutenção e testes | Média | Extrair hooks (useHomeData, useActiveWorkout) (recomendado) |
| 9 | apiFetch | Sem retry automático em falha de rede | Usuário precisa repetir ação manualmente | Baixa | Retry com backoff em chamadas críticas (recomendado) |
| 10 | Testes | Poucos testes; fluxos críticos sem cobertura | Regressões não detectadas | Média | Aumentar unit tests em storage/serviços; E2E em login e treino (recomendado) |

---

# 5. Correções implementadas

| Arquivo | O que mudou | Por que | Impacto esperado |
|---------|-------------|---------|-------------------|
| src/api/client.ts | Timeout 30s com AbortController; fetchWithTimeout; mensagem em português para AbortError | Evitar requisições indefinidas em rede lenta | Menos “travamentos” percebidos; feedback claro |
| src/components/ErrorBoundary.tsx | Novo componente: getDerivedStateFromError, componentDidCatch, fallback UI com “Tentar novamente” | Capturar erros de render e exibir fallback em vez de tela branca | App não fica em branco por erro não tratado em render |
| App.tsx | Envolvimento da árvore com &lt;ErrorBoundary&gt; | Garantir que qualquer erro na árvore seja capturado | Estabilidade em produção |
| app.json | userInterfaceStyle: "light" → "automatic" | Respeitar preferência de tema do sistema | Consistência com tema do dispositivo |
| src/navigation/AppNavigator.tsx | Substituir `return null` por View + ActivityIndicator (loading e onboarding) usando useTheme().colors | Evitar tela branca durante carregamento de auth e onboarding | Usuário vê indicador de carregamento em vez de tela vazia |
| src/screens/HomeScreen.tsx | load envolvido em useCallback([token, tenantId]); useEffect([load]) | Estabilizar referência de load e dependências corretas | Comportamento previsível ao mudar token/tenant; menos avisos de lint |
| src/screens/TrainingPlansScreen.tsx | FlatList: initialNumToRender={10}, maxToRenderPerBatch={10} | Limitar itens na primeira pintura e por lote | Melhor performance inicial em listas longas |

---

# 6. Melhorias recomendadas não implementadas

- **Migrar todas as telas para useTheme():** Vale a pena para consistência visual em modo claro. Risco baixo; esforço médio (alterar import e criar estilos dinâmicos onde necessário). Ordem: telas de maior uso (Home, Treinos, Dieta, DailyLog, ActiveWorkout).
- **Extrair useHomeData e useActiveWorkout:** Reduz tamanho das telas e facilita testes. Risco baixo; esforço médio. Ordem: após estabilizar comportamento atual.
- **Retry com backoff no apiFetch (ou em chamadas específicas):** Melhora resiliência em rede instável. Risco de múltiplas requisições se mal configurado; esforço baixo. Ordem: opcional, após validar timeout em produção.
- **expo-secure-store para token:** Aumenta segurança do token em dispositivo. Risco baixo; esforço baixo. Ordem: quando definir política de segurança para produção.
- **Validação de respostas (zod/io-ts):** Reduz risco de crash por payload inesperado. Esforço médio; priorizar /me, planos e execuções.
- **Testes unitários em storage e syncService:** Protege regras de negócio e fila de sync. Esforço médio. Ordem: em paralelo às próximas features.
- **E2E (Detox ou Maestro) para login e um fluxo de treino:** Garante fluxos críticos. Esforço alto. Ordem: quando houver pipeline de build estável.
- **Documentar contrato de API e cenários de erro:** Facilita integração e tratamento de erro. Esforço baixo. Ordem: contínuo.
- **Replicar initialNumToRender/maxToRenderPerBatch em DietPlansScreen e WorkoutHistoryScreen:** Consistência de performance em listas. Esforço trivial.

---

# 7. Próximos passos

1. **Imediato:** Validar em dispositivo/emulador: loading inicial (auth/onboarding), timeout em rede lenta (desligar backend ou throttling), e disparar um erro em render para ver Error Boundary.
2. **Curto prazo:** Migrar tema dinâmico para Home, Treinos e Dieta; adicionar estado de erro com “Tentar novamente” em listas que fazem fetch.
3. **Médio prazo:** Extrair useActiveWorkout; validação de contratos de API (zod).
4. **Longo prazo:** E2E para fluxos críticos; expo-updates para OTA; métricas de estabilidade.
