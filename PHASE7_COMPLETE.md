# Fase 7: Reorganizar Testes ✅

## O que foi feito

### 1. Testes Movidos

**Integration Tests** → `tests/integration/`:
- ✅ `src/integration/app.integration.test.ts` → `tests/integration/app.integration.test.ts`
- ✅ `src/integration/auth.integration.test.ts` → `tests/integration/auth.integration.test.ts`
- ✅ `src/integration/engine.integration.test.ts` → `tests/integration/engine.integration.test.ts`
- ✅ `src/integration/flow.integration.test.ts` → `tests/integration/flow.integration.test.ts`

**Unit Tests** → `tests/unit/`:
- ✅ `src/modules/ai/service.test.ts` → `tests/unit/ai-service.test.ts`
- ✅ `src/modules/anamnesis/engine/engine.test.ts` → `tests/unit/engine.test.ts`
- ✅ `src/shared/rbac.test.ts` → `tests/unit/rbac.test.ts`
- ✅ `src/shared/idempotency.test.ts` → `tests/unit/idempotency.test.ts`

### 2. Imports Atualizados

**Integration Tests**:
- ✅ Todos atualizados para usar `@bootstrap/app.js`

**Unit Tests**:
- ✅ `rbac.test.ts` → `@shared/utils/rbac.js` e `@shared/errors/index.js`
- ✅ `idempotency.test.ts` → `@shared/utils/idempotency.js`
- ✅ `engine.test.ts` → caminho relativo para módulo
- ✅ `ai-service.test.ts` → caminho relativo para módulo

### 3. Configuração Vitest Atualizada

- ✅ `vitest.config.ts` atualizado para incluir apenas `tests/**/*.test.ts`
- ✅ Removido `src/**/*.test.ts` do include (testes agora estão em `tests/`)

## Status

✅ **Fase 7 Completa**

Todos os testes foram reorganizados e os imports atualizados.

## Próxima Fase

**Fase 8**: Validação
- Executar build
- Executar testes
- Verificar se tudo funciona

## Notas

- Testes agora estão organizados por tipo (unit, integration)
- Imports atualizados para usar path aliases quando possível
- Configuração do Vitest atualizada para nova estrutura
