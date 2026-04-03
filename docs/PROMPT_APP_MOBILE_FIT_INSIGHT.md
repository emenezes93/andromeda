# Prompt — App mobile Fit Insight (portal do paciente)

Use este documento como brief completo para desenho, desenvolvimento e revisão do **app mobile do paciente** Fit Insight. O app consome a API existente `/v1/patient-portal/*` e materializa as promessas da landing (questionários pelo celular, gamificação, treino/dieta/evolução em um só lugar).

---

## 1. Contexto do produto

- **Fit Insight** é uma plataforma B2B para personal trainers e nutricionistas: anamnese adaptativa, prescrição de treino e dieta, evolução e insights com IA.
- O **profissional** usa o **dashboard web** (frontend React em `frontend/`).
- O **paciente** é a pessoa acompanhada: recebe planos de treino e dieta, responde questionários (anamnese/recorrentes), vê evolução e notificações. A API **patient-portal** já existe e está documentada (login, register, me, my-sessions, my-evolutions, my-goals, my-training-plans, my-diet-plans, my-training-executions, my-notifications).
- O **app mobile** é a interface principal do **paciente**: primeiro contato diário com a plataforma, uso em celular, foco em aderência (treino, dieta, questionários) e sensação de progresso (gamificação, evolução).

**Repositório:** backend em Node/Fastify; frontend profissional em React/Vite; landing em `website/`. Não há hoje um app mobile no repositório — este prompt serve para criá-lo (React Native/Expo, Flutter ou outra stack) alinhado à API e ao design.

---

## 2. Objetivos do app

- Permitir que o **paciente** faça login/registro, veja seu resumo (próximos treinos, dieta, notificações), responda a questionários, consulte planos de treino e dieta, registre execuções de treino e visualize evolução e metas.
- Reforçar **aderência** por meio de UX clara, gamificação (nível, XP, streak, badges) e notificações úteis (lembretes, parabéns por streak).
- Transmitir **confiança e cuidado** (dados de saúde, LGPD, identidade visual alinhada à marca) e sensação de **progresso** (evolução visível, metas claras).
- Funcionar bem em **celular** (touch, uma mão quando possível, performance e uso de dados consciente).

---

## 3. Personas e jornadas

- **Persona principal:** Paciente de personal trainer ou nutricionista, que usa o app para ver o que fazer hoje (treino/dieta), registrar o que fez e acompanhar evolução. Pode ser iniciante ou já engajado; o app deve servir aos dois.
- **Jornadas prioritárias:** (1) Primeiro acesso: login ou registro → onboarding rápido → home com resumo. (2) Dia a dia: abrir app → ver treino de hoje / dieta / questionário pendente → registrar conclusão ou resposta. (3) Evolução: consultar gráficos, metas e fotos de progresso. (4) Notificações: ler lembretes e avisos do profissional ou do sistema.

---

## 4. Funcionalidades (alinhadas à API e à landing)

### 4.1 Autenticação e onboarding

- **Login** com email e senha (POST `/v1/patient-portal/login`). Opção “Lembrar de mim” (refresh token persistido).
- **Registro** (POST `/v1/patient-portal/register`) quando o profissional envia link ou o paciente se cadastra; fluxo simples (nome, email, senha, aceite de termos).
- **Onboarding** na primeira abertura: 2–3 telas explicando “Seu treino e dieta no celular”, “Registre seu progresso”, “Acompanhe sua evolução”; depois ir para a home. Não bloquear uso; permitir pular.
- **Recuperação de senha:** se a API expuser fluxo (email de reset), implementar; senão deixar “Entre em contato com seu profissional”.

### 4.2 Home / resumo

- **Resumo do dia:** treino de hoje (nome, exercícios ou link para plano), dieta (refeições ou link para plano), questionário pendente (se houver).
- **Acesso rápido:** cards ou botões para “Treino de hoje”, “Dieta”, “Evolução”, “Fotos” (se a API/serviço de progress-photos estiver disponível para o paciente).
- **Gamificação em destaque:** nível atual, XP (ex.: 320/500), streak (ex.: “7 dias”), próximo badge. Dados podem vir de um endpoint de “resumo gamificado” ou ser calculados no app a partir de my-training-executions e my-sessions; definir com o backend.
- **Notificações:** ícone com badge quando houver não lidas; toque abre lista (GET my-notifications, PATCH mark-as-read).

### 4.3 Questionários

- Listar **sessões/questionários** pendentes (my-sessions ou endpoint dedicado a “pendentes para o paciente”).
- **Preenchimento** no celular: telas adaptadas a mobile (uma pergunta por tela ou grupo lógico), navegação anterior/próximo, indicador de progresso. Se existir fluxo público de “preencher por link” (ex.: `/fill/:token`), o app pode abrir em WebView ou replicar o fluxo nativo se a API permitir.
- **Confirmação** ao enviar; feedback de sucesso e, se aplicável, atualização de XP/streak.

### 4.4 Planos de treino

- **Lista** de planos (my-training-plans); **detalhe** do plano (my-training-plans/:id) com séries, exercícios, cargas, observações.
- **Registro de execução** (POST my-training-executions): marcar treino como realizado (e opcionalmente séries/cargas). Interface simples: “Treino de hoje concluído” + talvez checklist por exercício.
- Integração com **streak**: dias seguidos de treino realizado aumentam o streak; exibir na home e em feedback (“+1 dia no seu streak!”).

### 4.5 Planos de dieta

- **Lista** (my-diet-plans); **detalhe** (my-diet-plans/:id): refeições, macros, orientações.
- Foco em **consulta** no dia a dia; registro de “refeição feita” só se a API suportar; senão, apenas visualização.

### 4.6 Evolução e metas

- **Evolução** (my-evolutions): peso, medidas, composição; exibir em gráficos e lista (Recharts ou equivalente no mobile).
- **Metas** (my-goals): metas ativas e progresso; barras ou percentuais.
- **Fotos de progresso:** se houver endpoint ou dados no me/evolutions, galeria por data.

### 4.7 Notificações

- **Lista** paginada (my-notifications); **marcar como lida(s)** (mark-as-read). Badge no ícone da home/header com contagem de não lidas (me.hasUnreadNotifications ou contagem local).
- Tipos úteis: lembrete de questionário, parabéns por streak, mensagem do profissional, aviso de nova evolução disponível.

### 4.8 Perfil e configurações

- **Meus dados** (a partir de me): nome, email; edição de senha se a API permitir.
- **Preferências:** notificações (ligar/desligar por tipo ou global), tema (claro/escuro/system).
- **Sair:** invalidar token e voltar à tela de login.

---

## 5. Design e identidade visual

### 5.1 Tokens e consistência com a landing

- **Cores principais:** primary `#0ea5e9`, accent `#8b5cf6`; uso em botões, links, indicadores e gradientes sutis.
- **Cores semânticas:** success (conquistas, streak, concluído), warning (pendente, atenção), error (erro, falha). Evitar cores soltas fora da paleta.
- **Superfícies:** fundo padrão claro (surface), fundo secundário (surface-muted); modo escuro com dark/surface-invert se oferecido.
- **Tipografia:** hierarquia clara — título de tela, subtítulo, body, caption; tamanhos consistentes (ex.: body-sm 13px, body 15px). Fonte sans moderna (ex.: Inter ou equivalente no mobile).
- **Espaçamento:** escala previsível (4, 8, 12, 16, 24, 32); seções com padding uniforme (ex.: 16 ou 24).

### 5.2 Componentes e padrões

- **Botões:** primário (preenchido primary), secundário (outline ou surface-muted); tamanho mínimo de toque 44pt. Um componente `Button` reutilizável (variantes e tamanhos).
- **Cards:** cantos arredondados (ex.: 12–16), sombra leve ou borda sutil; uso em resumo do dia, planos, notificações.
- **Listas:** linhas com ícone + título + subtítulo quando fizer sentido; toque em linha inteira; indicador de “não lido” em notificações.
- **Navegação:** bottom tab ou drawer com Home, Treino/Dieta (ou “Planos”), Evolução, Notificações, Perfil. Ícones reconhecíveis e labels em pt-BR.
- **Estados vazios:** ilustração ou ícone + texto (“Nenhum treino hoje”, “Você está em dia!”); CTA se aplicável.
- **Estados de carregamento e erro:** skeleton ou spinner consistente; mensagem de erro amigável e retry.

### 5.3 Acessibilidade e usabilidade

- **Toque:** alvos ≥ 44pt; espaçamento entre elementos clicáveis para evitar toques acidentais.
- **Contraste:** textos legíveis (mínimo 4.5:1 para corpo); botões com contraste suficiente.
- **Redução de movimento:** respeitar preferência do sistema (menos animações ou nenhuma).
- **Leitores de tela:** labels em botões e ícones; ordem de foco lógica; cabeçalhos de seção quando útil.
- **Orientações:** suporte a retrato e paisagem onde fizer sentido (ex.: gráficos de evolução).

---

## 6. UX e microinterações

- **Primeira impressão:** após login, ir direto para a home com resumo; onboarding opcional e curto.
- **Feedback imediato:** ao marcar “Treino concluído” ou enviar questionário, toast ou animação breve de sucesso; atualizar streak/XP na hora se possível.
- **Gamificação visível:** nível e XP na home; streak em destaque; badges em perfil ou seção dedicada. Evitar poluição; priorizar clareza.
- **Pull-to-refresh** em listas (planos, notificações, evolução).
- **Navegação previsível:** voltar sempre no mesmo canto (topo esquerda ou gesto); título da tela visível.
- **Offline:** onde fizer sentido (ex.: leitura de plano já carregado), manter dados em cache; ao voltar online, sincronizar e indicar “Atualizado agora”. Não bloquear uso crítico por falta de rede; mostrar mensagem clara quando precisar de internet.

---

## 7. Ajustes e melhorias em relação a um “portal web no celular”

- **Nativo ou híbrido:** preferir app nativo (React Native/Expo) ou Flutter para gestos, performance e notificações push (futuro). PWA é complementar, não substitui o app se a promessa for “app para o paciente”.
- **Push notifications:** planejar integração (FCM/APNs) para lembretes e notificações do profissional; API pode ganhar endpoint de registro de device.
- **Deep links:** URLs para abrir treino do dia, questionário específico ou notificação; útil para e-mails e push.
- **Biometria:** opção de login com impressão digital ou face, após primeiro login com senha.
- **Um fluxo por vez:** telas com um objetivo claro (ex.: “Concluir treino de hoje”); evitar telas genéricas com muitos links.
- **Copy em pt-BR:** todos os textos no app em português do Brasil; tom próximo ao da landing (objetivo, motivador, sem exageros).

---

## 8. Alinhamento técnico com a API

- **Base URL:** configurável (env); ex.: `VITE_API_URL` ou `API_URL` para o app.
- **Auth:** POST `/v1/patient-portal/login` → guardar access token (e refresh se existir); enviar header `Authorization: Bearer <token>` em todas as requisições autenticadas. Logout = descartar token e, se houver, chamar endpoint de revogação.
- **Tenant/contexto:** a API pode exigir `x-tenant-id` ou inferir pelo paciente; documentar e enviar o que for obrigatório.
- **Erros:** tratar 401 (voltar ao login), 403/404 (mensagem amigável), 5xx (retry ou “Tente mais tarde”).
- **Payloads:** usar os contratos já existentes (me, my-sessions, my-training-plans, etc.); tipar no app (TypeScript ou equivalent) a partir da API ou OpenAPI.

Endpoints principais a consumir:

- `POST /v1/patient-portal/login`, `POST /v1/patient-portal/register`
- `GET /v1/patient-portal/me`
- `GET /v1/patient-portal/my-sessions`, `GET /v1/patient-portal/my-evolutions`, `GET /v1/patient-portal/my-goals`
- `GET /v1/patient-portal/my-training-plans`, `GET /v1/patient-portal/my-training-plans/:id`, `POST /v1/patient-portal/my-training-executions`
- `GET /v1/patient-portal/my-diet-plans`, `GET /v1/patient-portal/my-diet-plans/:id`
- `GET /v1/patient-portal/my-notifications`, `PATCH .../mark-as-read`, `PATCH .../:id/read`

---

## 9. Priorização sugerida (MVP vs fase 2)

**MVP (obrigatório para lançamento):**

- Login e registro; onboarding curto.
- Home com resumo (treino do dia, dieta, link para planos).
- Lista e detalhe de planos de treino; registrar execução (treino concluído).
- Lista e detalhe de planos de dieta (consulta).
- Lista de notificações e marcar como lida.
- Evolução (dados e gráficos) e metas (leitura).
- Perfil (dados, sair) e preferência de tema.

**Fase 2 (melhorias):**

- Questionários no app (se fluxo e API estiverem claros).
- Gamificação completa (nível, XP, streak, badges) com persistência no backend ou no app.
- Fotos de progresso (galeria).
- Push notifications e deep links.
- Biometria para login.
- Melhorias de offline (cache de planos e evolução).

---

## 10. Checklist de qualidade antes de release

- [ ] Login e registro testados; fluxo de erro (credenciais inválidas, rede) tratado.
- [ ] Home carrega sem travar; dados do me e resumos exibidos corretamente.
- [ ] Planos de treino e dieta acessíveis; registro de treino concluído persiste na API.
- [ ] Notificações listadas e marcadas como lidas; badge atualiza.
- [ ] Evolução e metas visíveis; gráficos legíveis em telas pequenas.
- [ ] Navegação e voltar consistentes; sem telas órfãs.
- [ ] Tokens de design (cores, tipo) usados de forma consistente; sem cores “soltas”.
- [ ] Toques ≥ 44pt; contraste e textos em pt-BR revisados.
- [ ] Comportamento em rede lenta e offline definido (mensagens e cache quando houver).
- [ ] Documentação mínima: como rodar o app (dev/prod), env vars, onde está a API.

---

## 11. Uso deste prompt

- **Product / UX:** usar as seções 2–4 e 6 para alinhar escopo e jornadas.
- **Design:** usar a seção 5 para definir ou revisar o design system e os componentes do app.
- **Desenvolvimento:** usar as seções 4, 7 e 8 para implementar funcionalidades e integração com a API; seção 9 para priorizar; seção 10 para validação.
- **Revisão:** usar o documento inteiro como checklist de aderência ao produto Fit Insight e à experiência do paciente.

---

*Documento de referência para o app mobile do paciente Fit Insight. Atualizar conforme a API e o produto evoluírem.*
