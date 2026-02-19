# Benchmark: plataformas similares e melhorias sugeridas

Documento baseado em pesquisa sobre concorrentes e boas práticas de mercado, com foco em **defeitos/gaps** da plataforma Anamnese Inteligente PaaS e em **melhorias ou novas funcionalidades** que podem diferenciar o produto.

---

## 1. Plataformas similares (pesquisa)

### 1.1 Mercado brasileiro

| Plataforma | Diferenciais | O que eles têm que podemos evoluir |
|------------|--------------|-------------------------------------|
| **Anamnia** | Prontuário + anamnese, formulários customizáveis, condições lógicas, LGPD, SSL | Planos claros (R$ 49/mês), trial; foco em “prontuário completo” |
| **Vedius** | +20 mil clientes, 100+ questionários validados, resultados automáticos, personalização por tipo de paciente | Biblioteca de questionários validados; relatórios automáticos (cálculos) |
| **Marisa.Care (Marisa.HRA)** | Questionários adaptativos com árvore de decisão, IA para ordem das perguntas, 3–7 min, HL7 FHIR (MV, Tasy) | Integração FHIR com EHR; “adaptive” com menos perguntas e alto engajamento |
| **Clínica nas Nuvens** | Fichas por especialidade, preenchimento pelo paciente, integrado ao prontuário, LGPD | Foco em “paciente preenche antes”; integração com PEP |
| **App Health** | Anamnese personalizada, +2 mi pacientes, +5 mil profissionais | Escala e modelos por especialidade |

### 1.2 Mercado internacional (patient intake / health questionnaires)

| Aspecto | O que o mercado oferece |
|---------|--------------------------|
| **Formulários** | Lógica condicional, assinatura digital (e-signature), upload de arquivos, histórico médico |
| **Conformidade** | HIPAA (EUA) / LGPD (BR): criptografia, BAA, consentimento explícito |
| **Portal do paciente** | Acesso self-service, preenchimento antes da consulta, lembretes de agendamento |
| **Integração** | APIs, webhooks, FHIR, integração nativa com EHR/calendário |
| **UX** | Responsivo, multi-idioma, design acessível (a11y) |
| **Dados** | Export PDF/CSV, relatórios por período, triagem por scoring |

Referências: Softwaresuggest (IntakeQ, mConsent, Jotform, Carepatron), Kepler (patient intake), boas práticas HIPAA/LGPD para saúde digital.

---

## 2. Defeitos e gaps na sua plataforma

Com base no código, na documentação (`ANALISE_E_NOVAS_FUNCIONALIDADES.md`, `AVALIACAO_PROJETO`) e no benchmark acima.

### 2.1 Conformidade e jurídico

| # | Defeito / gap | Impacto |
|---|----------------|---------|
| 1 | **Sem termo de consentimento LGPD** explícito no fluxo (cadastro de paciente, início de sessão) | Risco regulatório e de confiança; concorrentes e LGPD exigem “finalidade, armazenamento e uso” claros. |
| 2 | **Sem assinatura eletrônica** da anamnese ou do termo (apenas preenchimento) | Dificulta validade jurídica do documento; Portaria GM 4477 e MP 2.200-2 tratam de assinatura em saúde. |
| 3 | **Política de privacidade / termos de uso** não referenciados no app (link, aceite, versão) | Exigência de transparência e base legal (LGPD). |

### 2.2 Jornada do paciente e self-service

| # | Defeito / gap | Impacto |
|---|----------------|---------|
| 4 | **Paciente não acessa o sistema** – só profissionais; não há “link para o paciente preencher em casa” | Perde tendência de pré-atendimento e redução de tempo na consulta (diferencial Vedius, Clínica nas Nuvens). |
| 5 | **Sem envio de convite/link por e-mail ou SMS** para o paciente preencher anamnese antes da consulta | Fluxo manual; concorrentes automatizam envio e lembretes. |
| 6 | **Sem lembrete de evolução** (“última evolução há X dias”) na tela do paciente | Oportunidade de engajamento já citada no seu plano, mas ainda não implementada. |

### 2.3 Integração e interoperabilidade

| # | Defeito / gap | Impacto |
|---|----------------|---------|
| 7 | **Sem integração FHIR ou com EHR** (ex.: HL7 FHIR, Tasy, MV) | Marisa e outros se destacam por integrar com prontuário; sua plataforma fica “ilha”. |
| 8 | **Sem webhooks por tenant** (eventos: sessão concluída, insight gerado) | Dificulta integrações customizadas (EHR, BI, notificações externas). |
| 9 | **API pública documentada** (Swagger) mas sem política clara de versionamento e depreciação | Risco para integradores em breaking changes futuros. |

### 2.4 Dados, relatórios e export

| # | Defeito / gap | Impacto |
|---|----------------|---------|
| 10 | **Export de sessão (PDF/JSON)** ainda não implementado | Pedido recorrente no seu plano; concorrentes oferecem PDF para anexar ao prontuário. |
| 11 | **Dashboard sem filtro de período** (7/30/90 dias) | Limita análise de uso e produtividade no tempo. |
| 12 | **Sem relatório por template** (sessões, taxa de conclusão, tempo médio) | Vedius e outros destacam “resultados automáticos” e métricas por instrumento. |
| 13 | **Export CSV de lista de pacientes** não existente | Útil para gestão e migração; comum em softwares de gestão. |

### 2.5 IA e produto

| # | Defeito / gap | Impacto |
|---|----------------|---------|
| 14 | **AI_MODE=llm** (provedor real OpenAI/Anthropic) ainda não ativo em produção no código | Seu diferencial “insights por IA” fica limitado a regras/mock. |
| 15 | **Ordem das perguntas** é condicional + heurística, mas não “adaptativa” no sentido CAT/IRT (como FHIR SDC ou Marisa) | Concorrentes reduzem número de perguntas e tempo com algoritmos adaptativos. |
| 16 | **Sem biblioteca de questionários validados** (ex.: PHQ-9, GAD-7, instrumentos padrão) | Vedius e outros oferecem dezenas de instrumentos prontos; seu foco é template customizável, mas falta “catálogo” opcional. |

### 2.6 UX e acessibilidade

| # | Defeito / gap | Impacto |
|---|----------------|---------|
| 17 | **Sem skeletons** em listas e detalhes (apenas spinner) | Sensação de demora; mercado espera feedback visual mais rico. |
| 18 | **Confirmação em ações destrutivas** (remover usuário, desativar tenant) não padronizada (ex.: modal “Tem certeza?”) | Risco de exclusão acidental. |
| 19 | **A11y** não verificada de forma sistemática (axe-core, eslint-jsx-a11y) | Inclusão e conformidade com boas práticas. |
| 20 | **Sem modo escuro** | Já previsto no seu backlog; melhora conforto em ambientes de baixa luz. |

### 2.7 Plataforma e DevOps

| # | Defeito / gap | Impacto |
|---|----------------|---------|
| 21 | **Frontend fora do CI** (ou sem job dedicado no mesmo pipeline) | Quebras no frontend podem só aparecer em produção. |
| 22 | **Testes automatizados no frontend** inexistentes | Regressões em fluxos críticos (login, anamnese, insights) não detectadas. |
| 23 | **Health check** sem verificação de dependências (DB, opcional Redis/LLM) | Orquestração e monitoramento em produção menos confiáveis. |
| 24 | **Sem métricas Prometheus** (latência, contagem por rota) | Dificulta observabilidade e SLA. |

### 2.8 Segurança e governança

| # | Defeito / gap | Impacto |
|---|----------------|---------|
| 25 | **2FA (TOTP)** não disponível para owner/admin | Boas práticas para contas privilegiadas. |
| 26 | **Política de senha** sem histórico (não reutilizar últimas N) nem expiração opcional | Reforço contra reutilização e contas esquecidas. |
| 27 | **Desativação de usuário** (soft delete / “ativo”) não implementada | Gestão de saída de colaboradores sem perder histórico. |

---

## 3. Melhorias e novas funcionalidades sugeridas

Priorizadas por **impacto no diferencial** e **alinhamento ao mercado**.

### 3.1 Alta prioridade (diferenciação e conformidade)

| # | Melhoria / funcionalidade | Descrição resumida |
|---|----------------------------|--------------------|
| 1 | **Termo de consentimento LGPD** | Tela ou passo no cadastro do paciente (e opcionalmente antes da primeira sessão): exibir termo, versão, checkbox “Li e concordo”, gravar data e versão (Patient ou tabela Consent); registrar na auditoria. |
| 2 | **Assinatura eletrônica na anamnese** | Ao concluir sessão (ou ao gerar insight), opção “Assinar anamnese”: captura de nome + checkbox de concordância + timestamp; armazenar em sessão ou tabela (signaturePayload, signedAt). Não precisa ser ICP-Brasil no MVP; evoluir para certificado digital se necessário. |
| 3 | **Link público para o paciente preencher** | Sessão com token único (ex.: `sessionToken`) ou link mágico; rota frontend `/fill/:token` (sem login) onde o paciente responde ao questionário; ao finalizar, sessão marcada como concluída e insight pode ser gerado. Requer: geração de token, envio por e-mail/SMS (opcional no MVP). |
| 4 | **Export de sessão em PDF** | Endpoint `GET /v1/anamnesis/sessions/:id/export?format=pdf` e botão na UI: PDF com respostas, resumo, riscos e recomendações (template HTML → PDF no backend). |
| 5 | **AI_MODE=llm em produção** | Completar integração OpenAI/Anthropic (já planejada), env vars, validação Zod e retry; ativar em produção para insights reais. |

### 3.2 Média prioridade (paridade com concorrentes)

| # | Melhoria / funcionalidade | Descrição resumida |
|---|----------------------------|--------------------|
| 6 | **Dashboard com filtro de período** | Filtro “Últimos 7/30/90 dias”; cards e gráficos (sessões, concluídas, insights) respeitando o período; opcional endpoint `GET /v1/stats/dashboard?from=&to=`. |
| 7 | **Aba Sessões no paciente + vincular paciente na criação** | Já no seu plano: em “Nova sessão” escolher paciente; em `/patients/:id` aba “Sessões” listando sessões daquele paciente. |
| 8 | **Lembrete de evolução** | Na tela do paciente: “Última evolução há X dias. Registrar nova?” com botão para tela de evolução. |
| 9 | **Skeletons de carregamento** | Substituir spinner por skeletons nas listas (templates, sessões, pacientes, usuários) e em detalhes. |
| 10 | **Confirmação em ações destrutivas** | Modal “Tem certeza?” antes de remover usuário, desativar tenant, (e futuramente excluir template). |
| 11 | **Webhooks por tenant** | Configuração por tenant: URL + eventos (sessão concluída, insight gerado); POST com payload JSON; retry e log de falhas. |
| 12 | **Health com dependências** | `/ready` verificar Prisma (query simples) e, se configurado, Redis/LLM; retornar 503 se alguma falhar. |

### 3.3 Médio/longo prazo (evolução do produto)

| # | Melhoria / funcionalidade | Descrição resumida |
|---|----------------------------|--------------------|
| 13 | **Biblioteca de questionários** | Catálogo opcional de instrumentos validados (ex.: PHQ-9, GAD-7): import ou “usar como base” ao criar template; metadados (nome, referência, tags). |
| 14 | **Integração FHIR (Questionnaire / QuestionnaireResponse)** | Perfil Argonaut ou SDC: expor ou importar Questionnaire; salvar respostas como QuestionnaireResponse; facilitar integração com EHR que falam FHIR. |
| 15 | **Portal do paciente (expandido)** | Área logada para o paciente (auth separada ou “conta paciente”): ver suas sessões, evoluções resumidas, aceitar termos; complementar o “link público” acima. |
| 16 | **Regras de IA configuráveis** | Regras por tag (ex.: tag “stress” → peso no risco) e thresholds por tenant ou global (arquivo/DB). |
| 17 | **2FA (TOTP)** | Para owner/admin: ativação em “Configurações”, checagem no login. |
| 18 | **Desativar/reativar usuário** | Flag “ativo” no membership; usuário desativado não faz login; lista com filtro ativos/inativos. |
| 19 | **Métricas Prometheus** | Contadores e latência por rota; endpoint `/metrics` para scraping. |
| 20 | **Modo escuro + a11y** | Toggle no layout, variáveis CSS; ESLint a11y e testes com axe em telas críticas. |

---

## 4. Resumo executivo

- **Pontos fortes atuais:** multi-tenant, questionários adaptativos (condicional + heurística), insights por IA (regras/mock), pacientes e evoluções, auditoria, billing (Stripe), gamificação e UX moderna no dashboard.
- **Principais defeitos:** falta de termo de consentimento e assinatura eletrônica (LGPD/jurídico), ausência de fluxo “paciente preenche sozinho” (link/envio), export PDF e filtro de período no dashboard ainda não implementados, IA real (LLM) e testes/CI no frontend pendentes.
- **Sugestão de foco:** (1) Conformidade e confiança: termo LGPD + assinatura eletrônica; (2) Diferenciação: link para paciente preencher + export PDF; (3) Produto: LLM em produção + dashboard com período + aba Sessões no paciente; (4) Plataforma: frontend no CI + testes frontend + health com dependências.

---

*Documento alinhado a `ANALISE_E_NOVAS_FUNCIONALIDADES.md`, `AVALIACAO_PROJETO_INSIGHTS_E_MELHORIAS.md` e pesquisa web (Anamnia, Vedius, Marisa.Care, Clínica nas Nuvens, App Health; IntakeQ, mConsent, Jotform; LGPD e assinatura eletrônica em saúde).*
