# Plano de execução: Itens 2 e 3 (Benchmark)

Execução das melhorias **Item 2 – Assinatura eletrônica na anamnese** e **Item 3 – Link público para o paciente preencher**, definidas em `BENCHMARK_PLATAFORMAS_E_MELHORIAS.md`.

---

## Visão geral

| Item | Nome | Objetivo |
|------|------|----------|
| **2** | Assinatura eletrônica na anamnese | Ao concluir o questionário, capturar nome + concordância + timestamp e gravar na sessão (validade jurídica simples, sem ICP-Brasil no MVP). |
| **3** | Link público para o paciente preencher | Sessão com token único; página pública `/fill/:token` (sem login) onde o paciente responde; ao finalizar, sessão concluída e insight pode ser gerado. |

**Ordem sugerida:** implementar primeiro o **Item 3** (link público), depois o **Item 2** (assinatura). O link público pode ser usado com ou sem assinatura; a assinatura fará sentido tanto no fluxo logado quanto no fluxo por link (paciente assina ao terminar).

---

# PARTE A – Item 3: Link público para o paciente preencher

## A.1 Escopo

- Profissional cria sessão (como hoje) e pode **gerar um link** (token) para o paciente.
- Paciente acessa **sem login** uma URL do tipo `https://app.exemplo.com/fill/TOKEN`.
- Na página pública o paciente responde ao mesmo questionário (engine atual).
- Ao responder a última pergunta, as respostas são enviadas, a sessão é marcada como **completed** e o paciente vê uma tela de “Obrigado” (e opcionalmente “Em breve você poderá ver o resultado com seu profissional”).
- Envio do link por e-mail/SMS fica **fora do MVP** (profissional copia/cola o link).

## A.2 Backend

### A.2.1 Modelo de dados

- **AnamnesisSession:** adicionar campo `fillToken` (String?, único, indexado).
  - Gerado com `crypto.randomBytes(16).toString('hex')` ou `cuid()` ao criar sessão ou em endpoint dedicado “Gerar link”.

**Migration:** adicionar coluna `fill_token` (unique, nullable) em `anamnesis_sessions`.

### A.2.2 Geração do token

- **Opção A:** ao criar sessão (`POST /v1/anamnesis/sessions`), gerar `fillToken` sempre (ou quando `generateFillLink: true` no body).
- **Opção B:** endpoint `POST /v1/anamnesis/sessions/:id/fill-link` que gera e persiste o token (idempotente: se já existir, retorna o mesmo link).

Recomendação: **Opção B** – “Gerar link” sob demanda, para não expor link em toda sessão.

- Resposta: `{ fillToken, fillUrl }` (fillUrl = `${FRONTEND_URL}/fill/${fillToken}`).

### A.2.3 Rotas públicas (sem auth, sem x-tenant-id)

Todas sob prefixo `/v1/public/...` e registradas em **skipPaths** do auth. O tenant é inferido pela sessão encontrada via token.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/public/fill/:token` | Retorna sessão (id, status, template.name) + schema do template (questions) para montar o formulário. Se token inválido ou sessão já completed → 404. |
| POST | `/v1/public/fill/:token/next-question` | Body: `{ answersJson }`. Usa a engine existente para calcular próxima pergunta; retorna `{ nextQuestion, reason, completionPercent }`. Usa tenantId da sessão. |
| POST | `/v1/public/fill/:token/answers` | Body: `{ answersJson }`. Cria AnamnesisAnswer (como hoje). Se a engine indicar que não há mais perguntas (completion 100%), além de criar a answer atualiza a sessão para `status: 'completed'`. Retorna `{ completed: boolean }`. |

- **Segurança:** token longo e imprevisível; não listar sessões; apenas operações de leitura da sessão/template e escrita de uma answer (e update de status). Rate limit específico para rotas públicas (ex.: 30 req/min por IP).

### A.2.4 Fluxo da engine no público

- O serviço de engine já existe e recebe `(templateSchema, answers)` e retorna próxima pergunta.
- No handler de `POST .../next-question`: buscar sessão por `fillToken`, carregar template, mesclar respostas já salvas (último answer da sessão) com o `answersJson` do body, chamar engine, retornar resultado.
- No handler de `POST .../answers`: criar registro em AnamnesisAnswer; em seguida chamar engine com as respostas atuais; se `nextQuestion === null`, atualizar sessão para `status: 'completed'`.

### A.2.5 Auth e tenant

- Rotas `/v1/public/*` em **skipPaths** do plugin de auth.
- No handler: primeiro buscar sessão por `fillToken`; se não existir ou estiver deleted → 404. A partir da sessão obter `tenantId` e usar em todas as queries (Prisma: passar `tenantId` nos creates/updates). Não é necessário chamar `setTenantId` se as escritas forem feitas explicitamente com `tenantId` da sessão (e RLS pode ser contornado com um contexto “system” ou as rotas públicas não usarem RLS para essa operação – depende de como o RLS está configurado). Se o RLS exigir `app.tenant_id`, fazer `setTenantId(tenantId)` no handler antes das queries (usando o tenantId da sessão).

## A.3 Frontend

### A.3.1 Rota pública

- Nova rota **sem** `ProtectedRoute`: `/fill/:token`.
- Página `PublicFillPage.tsx` (ou `FillByTokenPage.tsx`):
  - Ao montar: `GET /v1/public/fill/:token` para obter sessão + schema do template.
  - Estado: respostas atuais, pergunta atual, loading, erro (token inválido, sessão já concluída).
  - Lógica de “próxima pergunta”: igual ao fluxo atual, mas chamando `POST /v1/public/fill/:token/next-question` com `answersJson`.
  - Ao receber `nextQuestion === null`: chamar `POST /v1/public/fill/:token/answers` com as respostas finais; ao retornar `completed: true`, mostrar tela de sucesso (“Obrigado. Suas respostas foram enviadas.”) e não redirecionar para área logada.

### A.3.2 Área logada: “Gerar link”

- Na **detalhe da sessão** (`SessionDetailPage`) ou na **lista**: botão “Gerar link para o paciente”.
  - Chama `POST /v1/anamnesis/sessions/:id/fill-link` (ou GET se for idempotente e só retornar o link).
  - Exibe o link (copy-to-clipboard) e aviso: “Este link permite preenchimento sem login. Guarde com segurança.”

### A.3.3 Considerações

- Não exibir no fluxo público dados sensíveis além do necessário (nome do template, perguntas).
- Após conclusão, não dar acesso aos insights na página pública (paciente não vê insights; profissional vê na área logada, como hoje).

## A.4 Tarefas (checklist Item 3)

- [ ] **DB:** Migration add `fill_token` (unique, nullable) em `anamnesis_sessions`.
- [ ] **Backend:** Serviço/helper que gera `fillToken` (hex ou cuid).
- [ ] **Backend:** `POST /v1/anamnesis/sessions/:id/fill-link` (auth) → gera token, persiste, retorna `{ fillToken, fillUrl }`.
- [ ] **Backend:** `GET /v1/public/fill/:token` → sessão + template schema (sem auth).
- [ ] **Backend:** `POST /v1/public/fill/:token/next-question` (body answersJson) → próxima pergunta (usa engine).
- [ ] **Backend:** `POST /v1/public/fill/:token/answers` (body answersJson) → cria answer; se conclusão, marca sessão completed.
- [ ] **Backend:** Registrar rotas `/v1/public/*` em skipPaths (auth); rate limit para rotas públicas.
- [ ] **Frontend:** Rota `/fill/:token` (pública), página com fluxo de perguntas usando APIs públicas.
- [ ] **Frontend:** Botão “Gerar link” na sessão (detalhe ou lista) + exibir/copiar link.
- [ ] **Testes:** Integração para link público (obter token, buscar sessão, enviar respostas, concluir).

---

# PARTE B – Item 2: Assinatura eletrônica na anamnese

## B.1 Escopo

- No **final** do preenchimento (última pergunta respondida), antes de considerar a sessão “concluída” e redirecionar para insights (ou para tela de sucesso no fluxo público), exibir etapa **“Assinar anamnese”**.
- Capturar: **nome do signatário** (texto), **checkbox** “Declaro que as informações são verdadeiras e concordo com o uso dos dados conforme política de privacidade” (ou texto alinhado ao termo LGPD), **data/hora** do aceite (timestamp no backend).
- Armazenar na sessão (ou tabela dedicada). Não usar certificado digital (ICP-Brasil) no MVP.

## B.2 Backend

### B.2.1 Modelo de dados

- **Opção 1 – Campos na sessão:** em `AnamnesisSession` adicionar:
  - `signatureName` (String?)
  - `signatureAgreedAt` (DateTime?)
- **Opção 2 – Tabela dedicada:** `SessionSignature` (sessionId, signerName, agreedAt, metadataJson opcional).

Recomendação: **Opção 1** (menos tabelas; uma assinatura por sessão).

**Migration:** adicionar `signature_name` e `signature_agreed_at` em `anamnesis_sessions`.

### B.2.2 Endpoint de assinatura

- **POST** `/v1/anamnesis/sessions/:id/sign`
  - Body: `{ signerName: string, agreed: boolean }` (ex.: Zod `signerName` min 2 chars, `agreed` true).
  - Auth: usuário logado (fluxo interno) OU token público (fluxo `/fill/:token`). No caso público, validar por `fillToken` e aceitar assinatura sem usuário.
- Regras:
  - Sessão deve existir e pertencer ao tenant (ou ser a sessão do token).
  - Não permitir assinar duas vezes (se `signatureAgreedAt` já preenchido, retornar 409 ou 200 idempotente).
  - Gravar `signatureName`, `signatureAgreedAt = now()`.
  - Opcional: registrar na auditoria (action `sign`, entity `session`, entityId).

### B.2.3 Fluxo “concluir” com assinatura

- **Fluxo logado (AnamnesisFlowPage):** quando `nextQuestion === null`, em vez de imediatamente chamar `submitAnswers` e ir para insights:
  1. Mostrar tela “Assinar anamnese” (nome + checkbox).
  2. Usuário assina → `POST /v1/anamnesis/sessions/:id/sign`.
  3. Em seguida `submitAnswers` e redirecionar para insights.
- **Fluxo público (PublicFillPage):** quando `nextQuestion === null`:
  1. Mostrar tela “Assinar anamnese” (nome + checkbox).
  2. Paciente assina → `POST /v1/public/fill/:token/sign` (rota pública que valida token, grava assinatura na sessão).
  3. Depois enviar respostas finais e marcar sessão como completed (ou: enviar respostas, depois tela de assinatura, depois marcar completed).

Ordem sugerida no público: **primeiro** enviar as respostas e marcar completed, **depois** tela de assinatura (para não bloquear conclusão se o paciente fechar sem assinar). Alternativa: assinatura obrigatória antes de marcar completed (mais forte juridicamente). Definir produto: “assinatura obrigatória” = não completa sem assinar.

## B.3 Frontend

### B.3.1 Componente “Assinar anamnese”

- Componente reutilizável: campos “Nome completo” (input) e “Li e concordo com…” (checkbox), botão “Assinar e concluir”.
- Props: `sessionId`, `onSigned: () => void`, `isPublic?: boolean` (para chamar API pública ou autenticada).
- Ao submeter: chamar API de sign; em `onSigned`, o pai faz o próximo passo (submitAnswers + navegação, ou apenas navegação no público).

### B.3.2 Integração no fluxo logado

- Em `AnamnesisFlowPage`, quando a engine retorna “completed” (nextQuestion === null):
  - Em vez de chamar direto `submitAnswers` e navegar, setar estado `showSignatureStep = true`.
  - Renderizar o passo de assinatura; após `POST /sign` com sucesso, chamar `submitAnswers` e `navigate` para insights.

### B.3.3 Integração no fluxo público

- Em `PublicFillPage`, quando a engine retorna “completed”:
  - Mostrar passo de assinatura (nome + checkbox).
  - `POST /v1/public/fill/:token/sign` → depois `POST .../answers` com respostas finais e marcar completed (ou ordem inversa: answers depois sign, e “completed” ao assinar).

### B.3.4 Exibição da assinatura

- Na **detalhe da sessão** e na **tela de insights**: exibir “Assinado por X em DD/MM/AAAA HH:mm” quando `signatureAgreedAt` estiver preenchido.

## B.4 Tarefas (checklist Item 2)

- [ ] **DB:** Migration add `signature_name`, `signature_agreed_at` em `anamnesis_sessions`.
- [ ] **Backend:** `POST /v1/anamnesis/sessions/:id/sign` (auth) body `{ signerName, agreed }`; validação; gravar e evitar dupla assinatura.
- [ ] **Backend:** `POST /v1/public/fill/:token/sign` (público) body `{ signerName, agreed }`; validar token, gravar na sessão.
- [ ] **Frontend:** Componente `SignatureStep` (nome, checkbox, botão).
- [ ] **Frontend:** AnamnesisFlowPage – após completed, exibir SignatureStep; após assinar, submitAnswers e ir para insights.
- [ ] **Frontend:** PublicFillPage – após completed, exibir SignatureStep; após assinar, enviar answers e marcar completed (ou ordem definida).
- [ ] **Frontend:** SessionDetailPage / insights – mostrar “Assinado por … em …” quando houver assinatura.
- [ ] **Testes:** Assinatura (sucesso, dupla assinatura, validação de nome/agreed).

---

# Ordem de implementação sugerida

1. **Item 3 (link público)**  
   - Migration fillToken → endpoint fill-link → rotas públicas (GET fill, POST next-question, POST answers) → página `/fill/:token` → botão “Gerar link” na sessão.

2. **Item 2 (assinatura)**  
   - Migration signature fields → POST sign (auth) e POST public sign → componente SignatureStep → integrar no fluxo logado → integrar no fluxo público → exibir “Assinado por” na sessão/insights.

3. **Ajustes finais**  
   - Rate limit e skipPaths conferidos; testes de integração; documentação da API (Swagger) para as novas rotas.

---

# Resumo de novas rotas e arquivos

| Onde | O quê |
|------|--------|
| **Prisma** | `fillToken`, `signatureName`, `signatureAgreedAt` em `anamnesis_sessions`. |
| **Backend** | `POST .../sessions/:id/fill-link`; `GET/POST /v1/public/fill/:token`; `POST /v1/public/fill/:token/next-question`; `POST /v1/public/fill/:token/answers`; `POST .../sessions/:id/sign`; `POST /v1/public/fill/:token/sign`. |
| **Frontend** | Rota `/fill/:token`; `PublicFillPage`; componente `SignatureStep`; uso em `AnamnesisFlowPage` e em `PublicFillPage`; botão “Gerar link” na sessão; exibição “Assinado por” em detalhe/insights. |

---

*Documento de execução alinhado a `BENCHMARK_PLATAFORMAS_E_MELHORIAS.md` (itens 2 e 3 da seção 3.1).*
