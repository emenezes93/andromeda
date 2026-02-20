# Anamnese Inteligente PaaS V2

Plataforma multi-tenant para criação e gestão de questionários de saúde adaptativos com insights de IA.

## 🚀 O que é este projeto?

Uma API REST completa para:
- Criar e gerenciar templates de questionários de saúde
- Aplicar questionários adaptativos (perguntas condicionais inteligentes)
- Gerar insights automáticos com IA (regras ou LLM)
- Gerenciar pacientes e evoluções
- Auditoria completa de ações

**Stack principal:**
- Backend: Node.js 20+ + TypeScript + Fastify
- Banco: PostgreSQL 16 + Prisma ORM
- Frontend: React + Vite (container separado)
- Testes: Vitest
- Deploy: Docker Compose

---

## ⚡ Início Rápido

### Opção 1: Docker (Recomendado - Tudo pronto)

```bash
# Clone o repositório
git clone <repo-url>
cd andromeda

# Inicie tudo (API + Frontend + Banco)
docker compose up --build

# Aguarde os containers iniciarem, depois:
# 1. Aplique as migrations e seed
docker compose exec api npm run prisma:migrate
docker compose exec api npm run prisma:seed

# 2. Acesse:
# - API: http://localhost:3000
# - Frontend: http://localhost:8080
# - Documentação: http://localhost:3000/documentation
# - Login: owner@demo.com / owner123
```

### Opção 2: Desenvolvimento Local

**Pré-requisitos:**
- Node.js 20+
- PostgreSQL 16 rodando (ou Docker)

**Passos:**

```bash
# 1. Instale dependências
npm install

# 2. Configure variáveis de ambiente
cp .env.example .env
# Edite .env e configure:
# - DATABASE_URL (ex: postgresql://postgres:postgres@localhost:5432/anamnese)
# - JWT_SECRET (mínimo 32 caracteres)

# 3. Configure o banco
npm run prisma:generate    # Gera o Prisma Client
npm run prisma:migrate:dev # Cria/aplica migrations
npm run prisma:seed        # Popula dados demo

# 4. Inicie o servidor
npm run dev                # Modo watch (recompila automaticamente)
```

**Acesse:**
- API: http://localhost:3000
- Documentação: http://localhost:3000/documentation
- Login demo: `owner@demo.com` / `owner123`

---

## 📁 Estrutura do Projeto

```
andromeda/
├── src/                          # Código fonte do backend
│   ├── bootstrap/               # Inicialização da aplicação
│   │   └── app.ts               # Configuração do Fastify
│   ├── config/                  # Configurações (env, etc)
│   ├── modules/                 # Módulos da aplicação
│   │   ├── health/              # Health checks
│   │   ├── auth/                # Autenticação (login, registro, 2FA)
│   │   ├── tenants/             # Gestão de tenants
│   │   ├── users/               # Gestão de usuários
│   │   ├── anamnesis/           # Anamnese
│   │   │   ├── templates/      # Templates de questionários
│   │   │   ├── sessions/       # Sessões de anamnese
│   │   │   └── engine/         # Motor adaptativo (próxima pergunta)
│   │   ├── ai/                  # Insights de IA
│   │   ├── patients/            # Cadastro de pacientes
│   │   └── audit/               # Auditoria
│   ├── shared/                  # Utilitários compartilhados
│   │   ├── errors/             # Classes de erro customizadas
│   │   ├── utils/              # Helpers (RBAC, idempotência, etc)
│   │   └── types/              # Tipos TypeScript compartilhados
│   └── schemas/                 # Schemas OpenAPI (documentação)
│
├── prisma/                       # Prisma ORM
│   ├── schema.prisma            # Schema do banco
│   ├── migrations/              # Migrations do banco
│   ├── seed.ts                  # Seed (dados iniciais)
│   └── seed-data/               # Dados para seed
│
├── frontend/                     # Frontend React (container separado)
│   └── src/                     # Código fonte do frontend
│
└── docs/                        # Documentação adicional
```

---

## 🛠️ Comandos Principais

### Desenvolvimento

```bash
npm run dev              # Inicia servidor em modo watch (recompila ao salvar)
npm run build            # Compila TypeScript para dist/
npm run start            # Roda versão compilada (produção)
```

### Banco de Dados

```bash
npm run prisma:generate      # Gera Prisma Client (após mudanças no schema)
npm run prisma:migrate:dev   # Cria/aplica migrations (desenvolvimento)
npm run prisma:migrate       # Aplica migrations (produção)
npm run prisma:seed          # Popula banco com dados demo
npm run prisma:studio        # Abre Prisma Studio (UI para ver dados)
```

### Qualidade de Código

```bash
npm run lint              # Verifica código com ESLint
npm run format            # Formata código com Prettier
npm run test              # Roda todos os testes
npm run test:watch        # Roda testes em modo watch
```

---

## 🔑 Conceitos Importantes

### Multi-Tenancy

Cada cliente (tenant) tem seus próprios dados isolados:
- **Header obrigatório**: `x-tenant-id` em todas as requisições (exceto login)
- **Isolamento no banco**: Row-Level Security (RLS) garante que cada tenant só vê seus dados
- **Na prática**: Sempre inclua `tenantId` nas queries do Prisma

### Autenticação

- **JWT**: Token de acesso (expira em 15 minutos)
- **Refresh Token**: Para renovar o acesso (expira em 30 dias)
- **2FA**: Disponível para owners/admins (TOTP)
- **Roles**: `owner` > `admin` > `practitioner` > `viewer`

### Templates de Anamnese

Templates são questionários configuráveis:
- **Perguntas**: texto, número, escolha única, múltipla escolha
- **Lógica condicional**: Mostrar perguntas baseado em respostas anteriores
- **Tags**: Categorizar perguntas (ex: `sleep`, `stress`, `nutrition`)
- **Motor adaptativo**: Seleciona próxima pergunta baseado em regras e heurísticas

### Insights de IA

Três modos disponíveis (configurável via `AI_MODE`):
- **ruleBased** (padrão): Regras determinísticas baseadas em tags
- **llmMock**: Texto variado sem chamadas externas (para testes)
- **llm**: Integração real com OpenAI ou Anthropic (requer API keys)

---

## 📚 Documentação Adicional

- **[CLAUDE.md](CLAUDE.md)** - Guia completo para desenvolvedores (arquitetura, padrões, comandos)
- **[docs/TEMPLATES_GAMIFICADOS.md](docs/TEMPLATES_GAMIFICADOS.md)** - Templates otimizados e gamificados
- **[docs/AI_LLM_SETUP.md](docs/AI_LLM_SETUP.md)** - Como configurar LLM real
- **[docs/DOCKER_FIRST_RUN.md](docs/DOCKER_FIRST_RUN.md)** - Primeira execução com Docker

---

## 🌐 Endpoints Principais

### Autenticação
- `POST /v1/auth/login` - Login (retorna token)
- `POST /v1/auth/register` - Registrar novo usuário
- `POST /v1/auth/refresh` - Renovar token
- `POST /v1/auth/logout` - Logout

### Templates
- `GET /v1/anamnesis/templates` - Listar templates
- `POST /v1/anamnesis/templates` - Criar template
- `GET /v1/anamnesis/templates/:id` - Ver template

### Sessões
- `POST /v1/anamnesis/sessions` - Criar sessão de anamnese
- `GET /v1/anamnesis/sessions/:id` - Ver sessão
- `POST /v1/anamnesis/sessions/:id/answers` - Enviar respostas

### Motor Adaptativo
- `POST /v1/anamnesis/engine/next-question` - Obter próxima pergunta

### Insights
- `POST /v1/ai/insights` - Gerar insights de uma sessão
- `GET /v1/ai/insights/:sessionId` - Ver insights gerados

**Documentação completa**: http://localhost:3000/documentation

---

## 🔧 Variáveis de Ambiente

Principais variáveis (veja `.env.example` para todas):

```env
# Banco de Dados
DATABASE_URL=postgresql://user:pass@localhost:5432/anamnese

# Segurança
JWT_SECRET=sua-chave-secreta-minimo-32-caracteres

# API
PORT=3000
NODE_ENV=development

# IA (opcional)
AI_MODE=ruleBased              # ruleBased | llmMock | llm
AI_PROVIDER=openai             # openai | anthropic (quando AI_MODE=llm)
AI_API_KEY=sk-...              # API key (quando AI_MODE=llm)

# Rate Limiting
RATE_LIMIT_GLOBAL=60           # Requisições/min (global)
RATE_LIMIT_AUTH=10             # Requisições/min (login)
```

---

## 🧪 Testes

```bash
# Todos os testes
npm run test

# Testes específicos
npm run test:unit          # Apenas testes unitários
npm run test:integration   # Apenas testes de integração
npm run test:e2e          # Apenas testes end-to-end
npm run test:coverage     # Com cobertura de código

# Modo watch
npm run test:watch
```

**Requisito**: PostgreSQL acessível com `DATABASE_URL` configurado.

---

## 🐳 Docker

### Comandos úteis

```bash
# Iniciar tudo
docker compose up -d

# Ver logs
docker compose logs -f api      # Logs da API
docker compose logs -f frontend # Logs do frontend
docker compose logs -f db       # Logs do banco

# Executar comandos dentro do container
docker compose exec api npm run prisma:seed
docker compose exec api npm run test

# Parar tudo
docker compose down

# Rebuild completo
docker compose build --no-cache
docker compose up -d
```

---

## 🆘 Problemas Comuns

### Erro: "Cannot find module"
```bash
npm install              # Reinstala dependências
npm run prisma:generate  # Regenera Prisma Client
```

### Erro: "Database connection failed"
- Verifique se PostgreSQL está rodando
- Confirme `DATABASE_URL` no `.env`
- Teste conexão: `psql $DATABASE_URL`

### Erro: "JWT_SECRET must be at least 32 characters"
- Configure `JWT_SECRET` no `.env` com pelo menos 32 caracteres

### Migrations não aplicam
```bash
npm run prisma:migrate:dev  # Cria/aplica migrations
npm run prisma:generate     # Regenera client
```

---

## 📝 Contribuindo

1. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
2. Faça suas alterações
3. Execute testes: `npm run test`
4. Verifique lint: `npm run lint`
5. Formate código: `npm run format`
6. Commit e push
7. Abra um Pull Request

---

## 📄 Licença

[Definir licença do projeto]

---

## 🤝 Suporte

- **Documentação**: Veja `docs/` para guias detalhados
- **Issues**: Abra uma issue no repositório
- **Email**: [seu-email@exemplo.com]

---

**Última atualização**: 2026-02-19
