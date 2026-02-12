# Primeira vez com Docker

Depois de subir o stack (`docker compose up --build`), o banco começa vazio. Para poder **fazer login** no frontend, é preciso:

1. **Aplicar as migrations** (criar tabelas)
2. **Rodar o seed** (criar usuário demo: owner@demo.com / owner123)

## Opção A: pelo host (recomendado)

Com o stack em pé (API e DB rodando):

```bash
# Na raiz do projeto, com Node instalado
cp .env.example .env
# Ajuste .env: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/anamnese

npm install
npx prisma migrate deploy
npm run prisma:seed
```

## Opção B: usando o container da API

Migrations e seed precisam rodar com o código e o Prisma disponíveis. O container de produção da API não inclui o source nem o `tsx`, então o seed é mais fácil pelo host.

Se quiser rodar só as migrations pelo container:

```bash
docker compose run --rm api npx prisma migrate deploy
```

O seed (`npm run prisma:seed` = `tsx prisma/seed.ts`) exige o source; no container de produção não temos. Use a **Opção A** para o seed.

## Depois do seed

- **Frontend:** http://localhost:8080  
- **Login:** `owner@demo.com` / `owner123`

Se ainda não logar:

1. **Use o frontend:** http://localhost:8080 (não a API em :3000). O login é feito pelo formulário na SPA, que envia **POST** `/v1/auth/login`. Se você abrir `/v1/auth/login` no navegador (GET), a API retorna 404.
2. **Abra o DevTools (F12)** → aba **Rede** → tente logar de novo. Deve aparecer uma requisição **POST** para `/v1/auth/login`. Veja o status (200 = sucesso; 401 = credenciais inválidas ou sem seed; 404 = rota errada; **500** = erro no servidor) e o corpo da resposta.
3. **Confirme o seed:** sem `npm run prisma:seed` (ou equivalente), o usuário `owner@demo.com` não existe e o login falha com 401.
4. **Se der 500:** em ambiente de desenvolvimento a API devolve a mensagem real do erro no corpo da resposta (campo `error`). Se aparecer algo como "relation … does not exist" ou "column … does not exist", aplique as migrations e rode o seed: `npx prisma migrate deploy` e `npm run prisma:seed` (pelo host, com `DATABASE_URL` apontando para o Postgres). O campo `details` na resposta pode trazer o lembrete desses comandos.
