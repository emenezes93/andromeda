# Fase 6: Reorganizar Bootstrap ✅

## O que foi feito

### 1. Arquivos Movidos

- ✅ `src/app.ts` → `src/bootstrap/app.ts`
- ✅ `src/server.ts` → `src/bootstrap/server.ts`

### 2. Imports Atualizados

**bootstrap/app.ts**:
- ✅ Imports de módulos atualizados para caminhos relativos (`../modules/`, `../schemas/`)
- ✅ Import do Container atualizado para usar `@core/infrastructure/di/Container.js`

**bootstrap/server.ts**:
- ✅ Imports já estavam corretos (usando path aliases)

### 3. Scripts Atualizados

**package.json**:
- ✅ `dev`: `tsx watch src/bootstrap/server.ts`
- ✅ `start`: `node dist/bootstrap/server.js`

## Status

✅ **Fase 6 Completa**

Os arquivos de bootstrap foram movidos para `bootstrap/` e todos os imports foram atualizados.

## Próxima Fase

**Fase 7**: Reorganizar Testes
- Mover testes para `tests/`
- Organizar por tipo (unit, integration, e2e)
- Atualizar configuração do Vitest

## Notas

- Os scripts npm foram atualizados para apontar para os novos caminhos
- A estrutura de bootstrap está agora claramente separada
- Pronto para a próxima fase de reorganização de testes
