# Performance de listas (M6 — Fase 3)

## Configuração atual

- **Paginação**: Todas as listas principais usam paginação server-side com `page` e `limit`.
- **Tamanho de página padrão**: 25 itens (Pacientes, Avaliações, Templates). Ajustável por tela via constante `LIST_PAGE_SIZE` ou equivalente.
- **Filtros server-side**:
  - Pacientes: `search` (nome)
  - Avaliações: `status`, `templateId`, `patientId`
  - Demais listas: conforme API de cada recurso.

## Benchmark p95

- **Métrica-alvo**: Tempo de resposta p95 para `GET /v1/patients?page=1&limit=25` (e equivalentes) dentro do limite definido (ex.: &lt; 500 ms).
- **Medição**: Via RUM, backend logs ou ferramenta de APM. Registrar em produção para ajuste de índices e cache (backend/DB).
- **Frontend**: Uso de `Pagination` com `loading` desabilita botões durante refetch; React Query mantém cache por `queryKey` (page + filtros).

## Próximos passos (pós-MVP)

- Virtualização de lista para listas muito longas (ex.: react-window) se necessário.
- Salvamento de “filtros favoritos” (ex.: “Minhas avaliações em andamento”) conforme Backlog #6.
