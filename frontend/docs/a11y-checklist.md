# Checklist de acessibilidade (WCAG AA)

Fluxos críticos para auditoria manual e testes com leitor de tela.

## Contraste e tipografia
- [ ] Texto normal: contraste ≥ 4.5:1 (tokens `--color-content`, `--color-content-muted` em `index.css`)
- [ ] Texto grande (≥ 18px ou 14px bold): contraste ≥ 3:1
- [ ] Fonte base 16px (1rem) no body

## Foco visível
- [ ] Todos os elementos interativos recebem anel de foco visível (`:focus-visible`, 2px primary)
- [ ] Ordem de tabulação lógica (formulários, modais, listas)
- [ ] Skip link "Pular para o conteúdo principal" visível ao receber foco

## Fluxos críticos
1. **Login** – campo e-mail, senha, botão, link "Esqueci minha senha"
2. **Questionário (Anamnese)** – pergunta, opções, botão Próxima/Concluir, barra de progresso
3. **Cadastro de paciente** – formulário longo, botão Salvar, modal de confirmação ao sair
4. **Dashboard** – Próximas ações (links), cards, tabela de sessões
5. **Lista de pacientes** – busca, filtros, links para detalhe

## Leitor de tela
- [ ] Landmarks e headings (h1–h6) em ordem
- [ ] Botões e links com rótulos descritivos (evitar "Clique aqui")
- [ ] Mensagens de erro e sucesso com `role="alert"` ou `aria-live`
- [ ] Modais com foco trap e retorno ao disparador ao fechar

## Referência
- Tokens e estilos globais: `frontend/src/styles/index.css`
- Skip link e redução de movimento: já implementados em `index.css`
