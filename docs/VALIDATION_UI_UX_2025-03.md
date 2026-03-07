# Validação Design e UI/UX — Alterações de 05/03/2025

## Testes automatizados

| Verificação | Resultado |
|-------------|-----------|
| **Vitest (frontend)** | ✅ 43 testes passando (5 arquivos) |
| **PatientFormPage** | ✅ Acessibilidade (axe) + renderização do card "Dados do paciente" e seções |
| **AnamnesisFlowPage** | ✅ Acessibilidade (axe) |
| **LoginPage** | ✅ Render e acessibilidade |
| **TemplatesListPage** | ✅ Empty state |
| **Build (tsc + vite)** | ✅ Sucesso |

*Nota: avisos do axe sobre `HTMLCanvasElement.getContext` em jsdom são conhecidos e não indicam falha de acessibilidade em runtime.*

---

## Checklist manual (design / UI-UX)

Validar no browser nas rotas indicadas:

### P1 — Hierarquia e H1
- [ ] **Pacientes** (`/patients`): uma única H1 “Pacientes” (vinda do layout).
- [ ] **Novo paciente** (`/patients/new`): H1 “Novo paciente” no topo; card com título “Dados do paciente” (sem repetir “Novo paciente”).
- [ ] **Detalhe do paciente** (`/patients/:id`): H1 com o nome do paciente (não H2).
- [ ] **Detalhe da avaliação** (`/sessions/:id`): H1 com nome do template.
- [ ] **Central de ajuda** (`/help`): H1 “Central de ajuda” (sem H1 duplicado do layout).

### P2 — Dashboard
- [ ] No máximo **um** banner de novidades visível (R3, ou R2, ou R1).
- [ ] Seções visíveis: **Ações rápidas** (Próximas ações), **Visão geral** (cards de métricas), **Atividade recente** (tabela/cards).
- [ ] Período (7/30/90 dias) em componente **Select** com label.

### P3 — Detalhe do paciente
- [ ] CTA principal: **Nova avaliação**.
- [ ] Botão **Mais ações** (dropdown) com: Editar dados, Hub do paciente, Dieta, Voltar à lista.
- [ ] Dropdown abre/fecha e links funcionam.

### P4 — Sidebar
- [ ] Submenus **Planos** e **Relatórios** começam **expandidos** (Dieta, Treino, Agendamentos e Histórico, Uso de IA visíveis).
- [ ] Expandir/recolher continua funcionando.

### P5 — Listas e mobile
- [ ] **Avaliações** (`/sessions`): lista em **cards** (não tabela).
- [ ] **Dashboard — Atividade recente**: em viewport **estreito** (< 768px) aparecem **cards** por sessão (não tabela); em desktop, tabela.
- [ ] Botões nos cards: “Ver detalhes” e “Continuar anamnese”.

### P6 — Formulário de paciente
- [ ] Card único “Dados do paciente” com seções: **Consentimento (LGPD)** (só em novo), **Dados pessoais**, **Objetivo e queixa**, **Observações**.
- [ ] Headings de seção legíveis e ordem lógica.

### P7 — Componentes
- [ ] **Select** (ex.: período no dashboard): mesmo estilo de borda/foco do Input.
- [ ] **Empty state** em listas (ex.: Pacientes e Avaliações sem dados): título, opcionalmente descrição e CTA (ex.: “Novo paciente”).

### P8 — Rótulos e glossário
- [ ] Botões na tabela/cards de avaliações: **Ver detalhes** e **Continuar anamnese** (não só “Ver” e “Continuar”).
- [ ] Termos alinhados ao `docs/GLOSSARY_UI.md` (Avaliação, Questionário, Anamnese, etc.).

---

## Resumo

- **Testes:** suite frontend e build OK; teste de PatientFormPage cobre card e seções.
- **Validação completa:** executar o checklist manual acima no ambiente local (e em preview se houver) para fechar a validação de design e UI/UX das alterações do dia.
