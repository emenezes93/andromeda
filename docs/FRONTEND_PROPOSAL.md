# Proposta de Frontend – Anamnese Inteligente PaaS

Sugestão de stack, estrutura e design para o frontend, alinhado à API existente: **clean, objetivo, boa interação e cores agradáveis**.

---

## 1. Stack sugerida

| Camada        | Tecnologia        | Motivo |
|---------------|-------------------|--------|
| **Framework** | React 18 + TypeScript | Alinhado ao ecossistema, tipagem forte, bom para dashboards |
| **Build**     | Vite              | Rápido, simples, ótimo com TS |
| **Estilos**   | Tailwind CSS      | Utilitário, consistência, tema customizável |
| **Roteamento**| React Router v6   | Padrão para SPA, nested routes |
| **Server state** | TanStack Query (React Query) | Cache, refetch, loading/error por request |
| **Auth/tenant** | Context + localStorage | Token + tenantId, mínimo e direto |
| **Formulários** | React Hook Form + Zod | Validação alinhada ao backend, menos re-renders |
| **HTTP**      | fetch + wrapper   | Um único cliente com `Authorization` e `x-tenant-id` |

**Opcional (fase 2):** componentes acessíveis com Radix UI (headless) para selects, modais, toasts.

---

## 2. Estrutura de pastas sugerida

```
frontend/                    # ou apps/web em monorepo
├── public/
├── src/
│   ├── api/                 # Cliente HTTP + funções por recurso
│   │   ├── client.ts        # baseURL, headers (token, x-tenant-id)
│   │   ├── auth.ts
│   │   ├── tenants.ts
│   │   ├── users.ts
│   │   ├── templates.ts
│   │   ├── sessions.ts
│   │   ├── engine.ts
│   │   ├── ai.ts
│   │   └── audit.ts
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/              # Botões, inputs, cards, layout
│   │   └── layout/           # Header, Sidebar, PageLayout
│   ├── features/            # Por domínio (espelha a API)
│   │   ├── auth/             # Login, Register, guards
│   │   ├── tenants/
│   │   ├── users/
│   │   ├── anamnesis/        # templates, sessions, engine
│   │   ├── insights/         # AI insights
│   │   └── audit/
│   ├── hooks/                # useAuth, useTenant, useApi
│   ├── routes/               # Config de rotas + lazy load
│   ├── stores/               # Auth context (token, user, tenantId)
│   ├── styles/               # index.css, Tailwind, variáveis
│   ├── types/                # Tipos compartilhados / gerados da API
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Design: cores e identidade

Objetivo: **limpo, confiável, cores suaves** (saúde/qualidade de vida).

### Paleta sugerida

| Uso            | Cor (hex)   | Nome / uso |
|----------------|------------|------------|
| **Primária**   | `#0d9488`  | Teal 600 – CTAs, links, destaques |
| **Primária hover** | `#0f766e` | Teal 700 |
| **Fundo**      | `#f8fafc`  | Slate 50 – fundo da aplicação |
| **Superfície** | `#ffffff`  | Cards, modais, header |
| **Texto**      | `#0f172a`  | Slate 900 – títulos e corpo |
| **Texto secundário** | `#64748b` | Slate 500 |
| **Borda**      | `#e2e8f0`  | Slate 200 |
| **Sucesso**    | `#059669`  | Green 600 |
| **Erro**       | `#dc2626`  | Red 600 |
| **Alerta**     | `#d97706`  | Amber 600 |

### Tipografia

- **Títulos:** uma fonte sóbria (ex.: **Inter** ou **Plus Jakarta Sans**).
- **Corpo:** mesma fonte, 16px base, line-height ~1.5.
- Evitar muitas variações de peso; 2–3 (normal, medium, semibold) bastam.

### Espaçamento e componentes

- **Espaçamento base:** múltiplos de 4 (4, 8, 12, 16, 24, 32).
- **Cards:** borda sutil, sombra leve (`shadow-sm`), cantos arredondados (ex.: 8px).
- **Botões:** primário teal; secundário outline; altura confortável (ex.: 40px).
- **Inputs:** borda clara, foco com ring na cor primária.

---

## 4. Fluxos principais (telas)

Alinhado à API e ao uso multi-tenant:

1. **Login**  
   - Email + senha.  
   - Após sucesso: guardar `token`, `refreshToken`, `user` (com `tenantId`).  
   - Redirecionar para dashboard/home.

2. **Dashboard (após login)**  
   - Resumo: tenant atual, atalhos (templates, sessões, insights).  
   - Navegação clara para cada módulo.

3. **Templates**  
   - Listagem paginada.  
   - Criar template (quem tiver permissão).  
   - Detalhe de um template.

4. **Sessões de anamnese**  
   - Listar sessões.  
   - Criar sessão (escolher template).  
   - Fluxo da anamnese: “próxima pergunta” (engine) + enviar respostas até conclusão.

5. **Insights (IA)**  
   - Gerar insights a partir de uma sessão.  
   - Ver resumo, riscos e recomendações de forma legível (cards ou lista).

6. **Audit**  
   - Listagem com filtros (ação, entidade, datas, página).

7. **Usuários / Tenants**  
   - Conforme permissões (owner/admin): criar/listar usuários e tenants.

---

## 5. Boas práticas de UX

- **Feedback imediato:** loading em botões e listas; toasts para sucesso/erro.
- **Erros de API:** mensagem amigável + opção de tentar de novo quando fizer sentido.
- **401:** limpar sessão e redirecionar para login.
- **Navegação:** sempre visível (sidebar ou top bar) com itens por permissão.
- **Responsivo:** mobile-first; tabelas em listas em telas pequenas se necessário.
- **Acessibilidade:** contraste adequado, foco visível, labels em formulários.

---

## 6. Integração com a API

- **Base URL:** configurável (ex.: `import.meta.env.VITE_API_URL` = `http://localhost:3000`).
- **Headers em toda requisição autenticada:**  
  `Authorization: Bearer <token>`  
  `x-tenant-id: <tenantId>`
- **Refresh token:** interceptar 401, chamar `/v1/auth/refresh`, atualizar token e repetir a request (ou redirecionar para login se refresh falhar).
- **Tipos:** manter DTOs (ex.: `LoginResponse`, `Template`, `Session`) em `src/types` ou gerar a partir do OpenAPI (`/documentation/json`) se quiser automatizar.

---

## 7. Ordem sugerida de implementação

1. **Setup:** Vite + React + TS + Tailwind + React Router.  
2. **Tema:** Tailwind com as cores e fontes acima.  
3. **API client:** `client.ts` + `auth.ts` (login + refresh).  
4. **Auth:** store/context + tela de login + rota protegida.  
5. **Layout:** shell (header/sidebar) + navegação.  
6. **Dashboard:** página inicial pós-login.  
7. **Templates:** listagem e detalhe.  
8. **Sessões:** criar + fluxo “próxima pergunta” + respostas.  
9. **Insights:** gerar e exibir.  
10. **Audit, usuários e tenants** conforme prioridade.

---

## 8. Resumo

- **Stack:** React + TypeScript + Vite + Tailwind + React Query + React Router + React Hook Form + Zod.  
- **Estrutura:** `api/`, `features/`, `components/`, `hooks/`, `stores/`, `routes/`.  
- **Visual:** teal como primária, fundo claro, tipografia sóbria, componentes com bordas e sombras leves.  
- **UX:** feedback claro, tratamento de 401/refresh, navegação estável e responsiva.

Se quiser, o próximo passo pode ser: **gerar o projeto Vite na pasta `frontend/`** com essa estrutura base, tema Tailwind e cliente API (login + headers) já configurados.
