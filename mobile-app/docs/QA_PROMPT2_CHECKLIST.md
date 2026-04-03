# QA Manual — PROMPT 2 (App Mobile Aluno)

Data: 2026-03-10
Escopo: validar implementação de TASK 1 a TASK 6 no app `mobile-app`.

## Pré-requisitos

1. Backend Andromeda rodando com patient-portal.
2. App mobile compilado/rodando em Android e iOS (ou simuladores).
3. Usuário de teste com tenant válido.
4. Acesso ao painel web do profissional para gerar dados (coachNotes, questionário, notificações).

## 1) Deep link de convite (TASK 1)

### 1.1 Registro por convite (scheme)

Passos:
1. Abrir deep link:
`fitinsight://register?tenantId=tenant123&email=aluno%40teste.com&tenantName=Studio%20Prime`
2. Verificar tela de cadastro.

Esperado:
1. `tenantId` e `email` pré-preenchidos.
2. Campo de e-mail bloqueado para edição.
3. Callout: `Seu profissional Studio Prime convidou você.`
4. Cadastro funciona sem pedir tenant novamente após sucesso.
5. Fluxo vai para onboarding.

### 1.2 Registro por convite (universal/app link)

Passos:
1. Abrir URL:
`https://app.fitinsight.com/register?tenantId=tenant123&email=aluno%40teste.com&tenantName=Studio%20Prime`
2. Repetir validações da seção 1.1.

Esperado:
1. App abre diretamente no `RegisterScreen` com params.

### 1.3 Comandos úteis

Android:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "fitinsight://register?tenantId=tenant123&email=aluno%40teste.com&tenantName=Studio%20Prime"
```

iOS Simulator:
```bash
xcrun simctl openurl booted "fitinsight://register?tenantId=tenant123&email=aluno%40teste.com&tenantName=Studio%20Prime"
```

## 2) Sync queue e payloads (TASK 2)

### 2.1 Payload sem `id`

Passos:
1. Criar localmente logs de peso, refeição, medidas e foto.
2. Forçar sync com app online.
3. Inspecionar requests no backend/log proxy.

Esperado:
1. `my-weight-logs` recebe apenas `date` e `valueKg`.
2. `my-meal-logs` sem campo `id`.
3. `my-body-measurements` sem `id`.
4. `my-progress-photos` sem `id`.

### 2.2 Regras de erro no sync

Passos:
1. Simular resposta 409 para um item.
2. Simular resposta 400 para um item.
3. Simular resposta 500/network error.

Esperado:
1. 409: item removido da fila e tratado como sucesso.
2. 400: item removido da fila (sem retry infinito).
3. 500/network: item permanece na fila para retry futuro.
4. Log mínimo aparece: `[sync] Failed to sync ...`.

### 2.3 Foto com URI local

Passos:
1. Adicionar foto local de progresso.
2. Rodar sync.

Esperado:
1. Request de foto usa multipart/form-data quando URI é `file://` ou `content://`.

## 3) Exibição de coachNotes (TASK 3)

Passos:
1. Criar execução no backend com `coachNotes` preenchido.
2. Abrir detalhe do plano de treino no app.

Esperado:
1. Exibe callout `Nota do seu profissional`.
2. Texto da nota visível e legível.
3. Estilo destacado com borda/realce primário.

## 4) Anamnese nativa (TASK 4)

### 4.1 Abertura por deep link

Passos:
1. Abrir `fitinsight://fill/<token_valido>`.

Esperado:
1. Tela `FillQuestionnaireScreen` abre.
2. Perguntas carregam via `GET /v1/public/fill/:token`.

### 4.2 Render por tipo de pergunta

Validar:
1. `text` com TextInput.
2. `number` com teclado numérico.
3. `single` com seleção única.
4. `multiple` com seleção múltipla.
5. `sentiment` escala 0-10.

### 4.3 Envio

Passos:
1. Preencher respostas.
2. Tocar `Enviar respostas`.

Esperado:
1. POST realizado em `/v1/public/fill/:token`.
2. Mensagem final: `Respostas enviadas com sucesso!`.

### 4.4 Notificação

Passos:
1. Receber notificação com `type=questionnaire_session_created` e `metadata.fillToken`.
2. Tocar na notificação dentro da lista de notificações.

Esperado:
1. Navega para `FillQuestionnaireScreen` com token correto.

## 5) Auto-sync em reconexão (TASK 5)

Passos:
1. Deixar app offline e criar logs (peso, refeição, etc.).
2. Confirmar pendências > 0.
3. Reconectar internet.

Esperado:
1. Hook dispara sync automático (com throttle de 60s).
2. Home mostra `Sincronizando X itens...` com mini-loader quando conectado.
3. Home mostra `X itens pendentes — serão enviados quando houver conexão` quando offline.
4. Após sync bem-sucedido, contador de pendências reduz para zero.

## 6) Placeholders e UX (TASK 6)

### 6.1 ChatScreen

Esperado:
1. Título: `Fale com seu profissional`.
2. Texto: `Envie uma mensagem direta pelo WhatsApp`.
3. Sem menção a `próxima versão`.

### 6.2 ChallengesScreen

Esperado:
1. Se lista de desafios vier vazia, mostra empty-state:
`Desafios em breve! Seu profissional poderá criar desafios para você.`
2. Tela não quebra e permanece navegável.

### 6.3 HealthIntegrationsScreen

Esperado:
1. Mensagem de `em breve` para Apple Health/Google Fit.
2. Sem botões de ação.

## 7) Regressão rápida (smoke)

1. Login padrão funciona.
2. Onboarding continua funcional.
3. Navegação por abas e stacks sem crash.
4. Treino ativo abre e fecha normalmente.
5. Diário de água/refeições salva sem erro.
6. Notificações continuam marcando como lidas.

## 8) Critério de aceite final

Marcar como aprovado quando:
1. TASK 1 a 6 passarem no Android e iOS.
2. Não houver crash em fluxo de deep link + notificação.
3. Sync respeitar regras de 400/409/5xx.
4. Nenhum placeholder exibir promessa incorreta de roadmap.
