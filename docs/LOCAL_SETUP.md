# Como executar localmente

## Pré-requisitos

- **Node.js 20+** ([nodejs.org](https://nodejs.org))
- **PostgreSQL 16** (instalado ou via Docker)
- **npm** (vem com o Node)

---

## Opção 1: Tudo local (Node + Postgres no seu PC)

### 1. Clonar e instalar dependências

```bash
cd andromeda
npm install
```

### 2. Subir o PostgreSQL

Se não tiver Postgres instalado, use Docker só para o banco:

```bash
docker run -d --name anamnese-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=anamnese -p 5432:5432 postgres:16-alpine
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e confira:

- **DATABASE_URL** – URL do Postgres (padrão: `postgresql://postgres:postgres@localhost:5432/anamnese`)
- **JWT_SECRET** – Mínimo 32 caracteres (ex.: `sua-chave-secreta-com-pelo-menos-32-chars!!`)

### 4. Banco de dados (migrations + seed)

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

O seed cria um tenant, usuário `owner@demo.com` / `owner123` e um template de anamnese.

### 5. Subir a API

```bash
npm run dev
```

A API sobe em **http://localhost:3000**.

- Health: http://localhost:3000/health  
- Documentação Swagger: http://localhost:3000/documentation  

### 6. Testar login (exemplo)

```bash
curl -s -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"owner@demo.com\",\"password\":\"owner123\"}"
```

Guarde o `token` e o `user.tenantId` da resposta para chamar as outras rotas.

---

## Opção 2: Docker Compose (API + Postgres)

```bash
cd andromeda
docker compose up --build
```

- API: http://localhost:3000  
- Postgres: localhost:5432 (user: postgres, password: postgres, db: anamnese)

**Importante:** na primeira vez, pode ser necessário rodar migrations e seed **dentro** do container ou com o banco já acessível. Exemplo com o compose rodando:

```bash
# Em outro terminal, com o compose no ar:
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

(Use o mesmo `.env` com `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/anamnese`.)

---

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | API em modo desenvolvimento (tsx watch) |
| `npm run build` | Compila TypeScript → `dist/` |
| `npm run start` | Roda a API em produção (`node dist/bootstrap/server.js`) |
| `npm run prisma:studio` | Abre interface visual do banco |
| `npm run test` | Roda testes (Vitest) |

---

## Problemas comuns

### "Invalid environment configuration"

- Crie o `.env` a partir do `.env.example`.
- Garanta que **JWT_SECRET** tem pelo menos 32 caracteres.
- **DATABASE_URL** deve ser uma URL válida do PostgreSQL.

### "Can't reach database" / conexão recusada

- Postgres está rodando? (`pg_isready -h localhost -p 5432` ou teste a porta 5432).
- **DATABASE_URL** no `.env** está correto (host, porta, user, senha, nome do banco)?

### Porta 3000 em uso

- Altere **PORT** no `.env` (ex.: `3001`) e acesse http://localhost:3001.

### Erro de build ao rodar `npm run dev`

- O `npm run dev` usa **tsx** (executa TypeScript direto). Se houver erros de tipo, o tsx pode ainda subir a API; para build limpo use `npm run build` e corrija os erros reportados pelo TypeScript.
