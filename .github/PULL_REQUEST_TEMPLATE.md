## Descrição

<!-- O que essa PR faz? Por que? -->

## Tipo de mudança

- [ ] `feat` — nova funcionalidade
- [ ] `fix` — correção de bug
- [ ] `refactor` — refatoração sem mudança de comportamento
- [ ] `docs` — documentação
- [ ] `chore` — manutenção, CI, dependências

## Módulo afetado

- [ ] `src/core/` (hexagonal — auth)
- [ ] `src/modules/` (legacy — tenants, users, anamnesis, ai, audit, patients)
- [ ] `frontend/`
- [ ] Infra / CI

## Checklist

- [ ] Testes passando (`npm run test`)
- [ ] Lint ok (`npm run lint`)
- [ ] TypeScript sem erros (`npx tsc --noEmit`)
- [ ] Sem `any` novo introduzido (ou justificado com comentário)
- [ ] Migrations adicionadas se o schema Prisma mudou
- [ ] Variáveis de ambiente documentadas em `.env.example` se adicionadas

## Screenshots (se mudança de UI)

<!-- Antes / Depois -->

## Observações

<!-- Contexto extra, trade-offs, dívida técnica deixada para depois -->
