# Device QA Checklist (Release Visual Pass)

## Alvos
- Android pequeno: `360dp` (ex.: 1080x2400 @3x)
- Android grande: `411dp` (ex.: 1080x2340 @2.625x)
- iOS: largura equivalente `390pt` (ex.: iPhone 13/14)

## Setup
1. Rodar `npm start`
2. Abrir app em cada device target
3. Tema: validar em `Sistema`, `Claro`, `Escuro`
4. Fonte: tamanho padrão do sistema (100%)

## Checklist Global
- [ ] Não há corte de texto em títulos principais
- [ ] Botões principais têm altura confortável e alinhamento vertical correto
- [ ] Cards não encostam nas bordas da tela
- [ ] Tab bar flutuante não cobre CTA no final da tela
- [ ] Ícones e textos mantêm contraste AA (principalmente no modo escuro)

## Fluxos Prioritários

### 1) Home
- [ ] Saudação e subtítulo sem quebra estranha
- [ ] Linha de 3 métricas sem overflow
- [ ] Card “Ações rápidas” com toque confortável (44+)
- [ ] “Resumo da semana” totalmente visível acima da tab bar

### 2) Treinos
- [ ] Hero card de `TrainingPlans` sem clipping
- [ ] Lista de cards mantém espaçamento vertical uniforme
- [ ] `TrainingPlanDetail`: botões empilhados com respiro consistente
- [ ] `WorkoutHistory`: modal detalhado sem cortar conteúdo

### 3) Dieta
- [ ] Hero de `DietPlans` proporcional ao device
- [ ] Chips de macro não estouram largura
- [ ] `DietPlanDetail`: grid de metas sem cards esmagados
- [ ] `DailyLog`: inputs e botões sem sobreposição com teclado

### 4) Progresso
- [ ] `ProgressHub`: 3 cards de foco sem truncar subtítulo
- [ ] `WeightLog`: campos e CTA com espaçamento consistente
- [ ] `ProgressPhotos`: grid/lista e modal de comparação sem clipping
- [ ] `Notifications`: cards de mensagem legíveis em todos os temas

## Registro de Evidências
Para cada device:
1. Screenshot da Home
2. Screenshot de uma lista (Treinos ou Dieta)
3. Screenshot de uma tela de detalhe
4. Screenshot de uma tela de Progresso
5. Screenshot de uma tela com modal aberto

## Template de Feedback (copiar e preencher)
```
Device: [Android 360dp | Android 411dp | iOS]
Tema: [Sistema | Claro | Escuro]
Tela: [nome]
Problema: [ex: texto truncado no card X]
Severidade: [Alta | Média | Baixa]
Sugestão: [ex: reduzir fontSize do título de 25 -> 23]
Screenshot: [arquivo]
```

## Critério de saída (release-ready)
- 0 problemas de severidade Alta
- No máximo 3 problemas de severidade Média
- Nenhum problema repetido entre telas da mesma família
