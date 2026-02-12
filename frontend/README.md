# Frontend – Anamnese Inteligente PaaS

SPA React (Vite + TypeScript + Tailwind) para o PaaS de Anamnese.

## Desenvolvimento local

```bash
cd frontend
npm install
npm run dev
```

Abre em `http://localhost:5173`. O Vite faz proxy de `/v1` e `/health` para a API (configure `VITE_API_URL` no `.env` se a API estiver em outra porta).

## Build

```bash
npm run build
```

Saída em `dist/`.

## Docker

O frontend tem **container próprio**. Com o docker-compose na raiz do projeto:

```bash
docker compose up --build
```

- **API:** http://localhost:3000  
- **Frontend:** http://localhost:8080  
- **Postgres:** localhost:5432  

No container, o nginx serve a SPA e faz proxy de `/v1` e `/health` para o serviço `api`.

## Variáveis

| Variável       | Descrição                          |
|----------------|------------------------------------|
| `VITE_API_URL` | URL base da API (vazio no Docker). |

Copie `.env.example` para `.env` e ajuste se precisar.
