# Configuração de LLM para Insights (AI_MODE=llm)

Este guia explica como configurar o modo LLM real para gerar insights usando OpenAI ou Anthropic.

## Pré-requisitos

- Conta ativa no provedor escolhido (OpenAI ou Anthropic)
- API key válida do provedor
- Variáveis de ambiente configuradas

## Modos de IA Disponíveis

A plataforma suporta três modos de geração de insights:

1. **`ruleBased`** (padrão): Regras determinísticas baseadas em tags e scores das respostas
2. **`llmMock`**: Geração determinística variada usando hash das respostas (sem chamadas externas)
3. **`llm`**: Integração com LLM real (OpenAI ou Anthropic) — **requer configuração**

## Configuração

### 1. Escolha o Provedor

**OpenAI:**
- Modelo padrão: `gpt-4o`
- Modelos suportados: qualquer modelo compatível com Chat Completions API
- Documentação: https://platform.openai.com/docs/api-reference/chat

**Anthropic:**
- Modelo padrão: `claude-sonnet-4-5`
- Modelos suportados: Claude Sonnet, Opus, Haiku (versões 4.x)
- Documentação: https://docs.anthropic.com/claude/reference/messages_post

### 2. Configure Variáveis de Ambiente

Edite seu arquivo `.env`:

```bash
# Modo LLM real
AI_MODE=llm

# Escolha um provedor
AI_PROVIDER=openai          # ou 'anthropic'

# Sua API key
AI_API_KEY=sk-...           # OpenAI: sk-... | Anthropic: sk-ant-...

# (Opcional) Modelo customizado
AI_MODEL=gpt-4o             # OpenAI: gpt-4o, gpt-4-turbo, etc.
# AI_MODEL=claude-opus-4     # Anthropic: claude-sonnet-4-5, claude-opus-4, etc.
```

### 3. Validação

O sistema valida automaticamente que `AI_PROVIDER` e `AI_API_KEY` estão configurados quando `AI_MODE=llm`. Se faltar alguma variável, a aplicação não iniciará.

## Funcionamento

### Fluxo de Geração de Insights

1. **Coleta de Respostas**: O sistema coleta todas as respostas da sessão de anamnese
2. **Construção do Prompt**: 
   - System prompt: instruções para análise estruturada
   - User message: template de perguntas + respostas do paciente (sanitizadas)
3. **Chamada ao LLM**: Requisição HTTP com retry automático (até 3 tentativas)
4. **Validação**: Resposta validada com Zod contra schema esperado
5. **Armazenamento**: Insights salvos no banco de dados

### Características de Segurança

- **Sanitização**: Respostas são truncadas a 500 caracteres e tratadas como dados literais
- **Prompt Injection Protection**: System prompt instrui o modelo a ignorar comandos nas respostas
- **Timeout**: Requisições têm timeout de 30 segundos
- **Retry Logic**: Retry automático com exponential backoff para erros transitórios
- **Validação**: Schema Zod garante estrutura correta da resposta

### Tratamento de Erros

- **Erros 4xx (exceto 429)**: Não retentados (erro de cliente/configuração)
- **Erros 429 (rate limit)**: Retentados automaticamente
- **Erros 5xx**: Retentados automaticamente
- **Timeout**: Retentado como erro transitório
- **Resposta inválida**: Erro não retentável (problema de formato)

## Exemplo de Resposta Esperada

O LLM deve retornar um JSON com esta estrutura:

```json
{
  "summary": "Resumo textual da análise (1-3 frases em português)",
  "risks": {
    "readiness": 75,
    "dropoutRisk": 25,
    "stress": 60,
    "sleepQuality": 45
  },
  "recommendations": [
    "Recomendação 1",
    "Recomendação 2"
  ]
}
```

## Limites e Custos

### OpenAI (gpt-4o)
- **Input**: $2.50 por milhão de tokens
- **Output**: $10.00 por milhão de tokens
- **Contexto**: ~128K tokens
- **Max tokens resposta**: 1024 tokens (configurável)

### Anthropic (claude-sonnet-4-5)
- **Input**: $3.00 por milhão de tokens
- **Output**: $15.00 por milhão de tokens
- **Contexto**: 200K tokens
- **Max tokens resposta**: 1024 tokens (configurável)

**Estimativa de custo por insight**: ~$0.01-0.03 (dependendo do tamanho do questionário)

## Troubleshooting

### Erro: "AI_PROVIDER and AI_API_KEY are required when AI_MODE=llm"
- Verifique se ambas as variáveis estão definidas no `.env`
- Reinicie a aplicação após alterar variáveis de ambiente

### Erro: "Invalid JSON response from [provider]"
- O modelo pode estar retornando markdown ou texto adicional
- O sistema tenta remover markdown fences automaticamente
- Verifique logs para ver a resposta bruta

### Erro: "Empty response from [provider]"
- Verifique se a API key está válida
- Verifique se o modelo especificado existe e está disponível
- Verifique logs para detalhes do erro HTTP

### Rate Limit (429)
- O sistema retenta automaticamente com exponential backoff
- Considere aumentar `RATE_LIMIT_AI` se houver muitos usuários simultâneos
- Para produção, considere implementar fila de processamento

### Timeout
- Aumente `TIMEOUT_MS` em `src/modules/ai/llm-provider.ts` se necessário
- Verifique latência da rede com o provedor

## Testes

Para testar a integração LLM:

1. Configure `AI_MODE=llm` e credenciais válidas
2. Crie uma sessão de anamnese e responda algumas perguntas
3. Gere insights via API ou UI
4. Verifique logs para confirmar chamada ao provedor
5. Valide que os insights foram salvos corretamente

## Monitoramento

- Logs incluem tentativas de retry e erros
- Erros são logados com contexto completo (status, body truncado)
- Métricas de latência podem ser adicionadas via middleware

## Recursos Avançados

### Cache de Insights Similares

O sistema detecta automaticamente sessões com respostas idênticas (mesmo template e mesmas respostas) e reutiliza insights existentes, evitando chamadas desnecessárias ao LLM. O cache é baseado em hash SHA256 das respostas.

### Fallback de Provedores

Configure um provedor de fallback para alta disponibilidade:

```bash
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_FALLBACK_PROVIDER=anthropic
AI_FALLBACK_API_KEY=sk-ant-...
```

Se o provedor primário falhar, o sistema tentará automaticamente o provedor de fallback.

### Prompts Customizados por Template

Você pode definir um prompt customizado para cada template editando o campo `llmPrompt` no template. Se não definido, o prompt padrão será usado.

### Métricas de Uso e Custo

O sistema rastreia automaticamente:
- Tokens de entrada e saída por requisição
- Custo estimado em USD
- Provedor e modelo utilizados

Consulte métricas via `GET /v1/ai/usage?from=2025-01-01&to=2025-01-31`.

## Recursos Implementados

- [x] Cache de insights similares (hash-based)
- [x] Métricas de custo por tenant
- [x] Suporte a múltiplos provedores (fallback)
- [x] Configuração de prompts por template
- [x] Fine-tuning de modelos específicos por template
- [x] Dashboard de métricas de uso no frontend (`/ai/usage`)
- [x] Alertas de custo por tenant
- [x] Cache em memória Redis (opcional)

## Alertas de Custo

Configure limites de custo e alertas para seu tenant:

```bash
# Via API
PATCH /v1/ai/cost-alert-config
{
  "limitUsd": 100.0,        # Limite mensal em USD
  "thresholdPercent": 80    # Percentual (0-100) para disparar alerta
}
```

O sistema verifica automaticamente após cada uso de LLM e envia alertas quando o threshold é atingido.

## Fine-tuning de Modelos

Configure um modelo fine-tuned específico para cada template editando o campo `llmFinetunedModel` no template. Quando um template tem um modelo fine-tuned configurado, ele será usado em vez do modelo padrão.

## Cache Redis (Opcional)

Para melhor performance, configure Redis:

```bash
REDIS_URL=redis://localhost:6379
```

O sistema usa Redis para cache de insights similares, reduzindo latência e custos. Se Redis não estiver disponível, o sistema faz fallback para consultas no banco de dados.
