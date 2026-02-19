/**
 * Templates de Anamnese Gamificados e Otimizados
 * 
 * Princípios aplicados:
 * - Máximo 12-15 perguntas essenciais (evitar desistência)
 * - Gamificação: progresso visual, feedback positivo, badges implícitos
 * - Linguagem motivacional e positiva
 * - Perguntas condicionais inteligentes
 * - Tags para análise de insights e personalização
 * 
 * Baseado em melhores práticas de UX e pesquisa sobre gamificação em saúde.
 */

// ─── TEMPLATE 1: EMAGRECIMENTO ────────────────────────────────────────────────
export const templateEmagrecimento = {
  questions: [
    // Bloco 1: Objetivo e Motivação (Gamificação: "Vamos começar sua jornada!")
    {
      id: 'obj_principal',
      text: 'Qual seu principal objetivo com o programa de emagrecimento?',
      type: 'single',
      options: [
        'Perder peso para melhorar saúde',
        'Perder peso para melhorar autoestima',
        'Perder peso para ter mais energia',
        'Perder peso para um evento específico',
        'Outro motivo pessoal'
      ],
      required: true,
      tags: ['goal', 'motivation']
    },
    {
      id: 'peso_objetivo',
      text: 'Qual peso você gostaria de alcançar? (kg)',
      type: 'number',
      required: true,
      tags: ['goal', 'target']
    },
    {
      id: 'tempo_objetivo',
      text: 'Em quanto tempo você gostaria de alcançar esse objetivo?',
      type: 'single',
      options: ['1-3 meses', '3-6 meses', '6-12 meses', 'Mais de 1 ano'],
      required: true,
      tags: ['goal', 'timeline']
    },

    // Bloco 2: Situação Atual (Gamificação: "Conheça seu ponto de partida")
    {
      id: 'peso_atual',
      text: 'Qual seu peso atual? (kg)',
      type: 'number',
      required: true,
      tags: ['anthropometry', 'baseline']
    },
    {
      id: 'altura',
      text: 'Qual sua altura? (cm)',
      type: 'number',
      required: true,
      tags: ['anthropometry', 'baseline']
    },
    {
      id: 'circunferencia_cintura',
      text: 'Circunferência da cintura (cm) - opcional',
      type: 'number',
      required: false,
      tags: ['anthropometry']
    },

    // Bloco 3: Histórico e Tentativas (Gamificação: "Aprendendo com experiências passadas")
    {
      id: 'tentativas_anteriores',
      text: 'Você já tentou perder peso antes?',
      type: 'single',
      options: ['Não, esta é minha primeira vez', 'Sim, 1-2 vezes', 'Sim, várias vezes'],
      required: true,
      tags: ['history', 'experience']
    },
    {
      id: 'o_que_funcionou',
      text: 'O que funcionou nas tentativas anteriores? (se aplicável)',
      type: 'text',
      required: false,
      tags: ['history'],
      showWhen: { questionId: 'tentativas_anteriores', operator: 'in', value: ['Sim, 1-2 vezes', 'Sim, várias vezes'] }
    },
    {
      id: 'dificuldades_anteriores',
      text: 'Quais foram as principais dificuldades? (se aplicável)',
      type: 'text',
      required: false,
      tags: ['barriers'],
      showWhen: { questionId: 'tentativas_anteriores', operator: 'in', value: ['Sim, 1-2 vezes', 'Sim, várias vezes'] }
    },

    // Bloco 4: Estilo de Vida Atual (Gamificação: "Entendendo seu dia a dia")
    {
      id: 'atividade_fisica',
      text: 'Com que frequência você pratica atividade física atualmente?',
      type: 'single',
      options: ['Não pratico', '1-2x por semana', '3-4x por semana', '5+ vezes por semana'],
      required: true,
      tags: ['lifestyle', 'exercise']
    },
    {
      id: 'horario_treino',
      text: 'Qual horário você prefere treinar?',
      type: 'single',
      options: ['Manhã (6h-12h)', 'Tarde (12h-18h)', 'Noite (18h-22h)', 'Não tenho preferência'],
      required: false,
      tags: ['lifestyle', 'preference'],
      showWhen: { questionId: 'atividade_fisica', operator: 'in', value: ['1-2x por semana', '3-4x por semana', '5+ vezes por semana'] }
    },
    {
      id: 'padrao_alimentar',
      text: 'Como você descreveria seu padrão alimentar atual?',
      type: 'single',
      options: [
        'Muito irregular, como quando dá tempo',
        'Regular, mas com muitas escolhas não saudáveis',
        'Regular com algumas escolhas saudáveis',
        'Muito disciplinado e saudável'
      ],
      required: true,
      tags: ['lifestyle', 'nutrition']
    },
    {
      id: 'refeicoes_dia',
      text: 'Quantas refeições você faz por dia?',
      type: 'single',
      options: ['1-2 refeições', '3 refeições', '4-5 refeições', '6+ refeições'],
      required: true,
      tags: ['lifestyle', 'nutrition']
    },

    // Bloco 5: Desafios e Barreiras (Gamificação: "Identificando obstáculos para superá-los")
    {
      id: 'maior_desafio',
      text: 'Qual seu maior desafio para perder peso?',
      type: 'single',
      options: [
        'Falta de tempo para preparar refeições',
        'Ansiedade/estresse que leva a comer',
        'Falta de motivação/disciplina',
        'Dificuldade em manter consistência',
        'Não sei por onde começar',
        'Outro'
      ],
      required: true,
      tags: ['barriers', 'challenges']
    },
    {
      id: 'nivel_estresse',
      text: 'Como você avalia seu nível de estresse atual? (1-10)',
      type: 'number',
      required: true,
      tags: ['stress', 'mental_health']
    },
    {
      id: 'qualidade_sono',
      text: 'Como você avalia sua qualidade de sono? (1-10)',
      type: 'number',
      required: true,
      tags: ['sleep', 'recovery']
    },

    // Bloco 6: Saúde e Condições (Gamificação: "Cuidando da sua saúde")
    {
      id: 'condicoes_saude',
      text: 'Você tem alguma condição de saúde que devemos considerar?',
      type: 'single',
      options: ['Não', 'Sim, mas controlada', 'Sim, preciso de atenção especial'],
      required: true,
      tags: ['health', 'medical']
    },
    {
      id: 'quais_condicoes',
      text: 'Quais condições? (ex: diabetes, hipertensão, hipotireoidismo)',
      type: 'text',
      required: false,
      tags: ['health', 'medical'],
      showWhen: { questionId: 'condicoes_saude', operator: 'in', value: ['Sim, mas controlada', 'Sim, preciso de atenção especial'] }
    },
    {
      id: 'medicamentos',
      text: 'Você toma algum medicamento contínuo?',
      type: 'single',
      options: ['Não', 'Sim'],
      required: true,
      tags: ['health', 'medications']
    },
    {
      id: 'quais_medicamentos',
      text: 'Quais medicamentos?',
      type: 'text',
      required: false,
      tags: ['health', 'medications'],
      showWhen: { questionId: 'medicamentos', operator: 'eq', value: 'Sim' }
    }
  ],
  conditionalLogic: [
    { ifQuestion: 'tentativas_anteriores', ifValue: ['Sim, 1-2 vezes', 'Sim, várias vezes'], thenShow: ['o_que_funcionou', 'dificuldades_anteriores'] },
    { ifQuestion: 'atividade_fisica', ifValue: ['1-2x por semana', '3-4x por semana', '5+ vezes por semana'], thenShow: ['horario_treino'] },
    { ifQuestion: 'condicoes_saude', ifValue: ['Sim, mas controlada', 'Sim, preciso de atenção especial'], thenShow: ['quais_condicoes'] },
    { ifQuestion: 'medicamentos', ifValue: ['Sim'], thenShow: ['quais_medicamentos'] }
  ],
  tags: ['weight_loss', 'gamified', 'optimized']
};

// ─── TEMPLATE 2: GANHO DE MASSA MAGRA ─────────────────────────────────────────
export const templateGanhoMassa = {
  questions: [
    // Bloco 1: Objetivo e Expectativas (Gamificação: "Construindo seu físico ideal")
    {
      id: 'obj_principal',
      text: 'Qual seu principal objetivo com o ganho de massa magra?',
      type: 'single',
      options: [
        'Aumentar massa muscular e força',
        'Melhorar definição e proporções',
        'Aumentar performance esportiva',
        'Melhorar autoestima e confiança',
        'Outro objetivo pessoal'
      ],
      required: true,
      tags: ['goal', 'motivation']
    },
    {
      id: 'peso_atual',
      text: 'Qual seu peso atual? (kg)',
      type: 'number',
      required: true,
      tags: ['anthropometry', 'baseline']
    },
    {
      id: 'altura',
      text: 'Qual sua altura? (cm)',
      type: 'number',
      required: true,
      tags: ['anthropometry', 'baseline']
    },
    {
      id: 'peso_objetivo',
      text: 'Qual peso você gostaria de alcançar? (kg)',
      type: 'number',
      required: true,
      tags: ['goal', 'target']
    },

    // Bloco 2: Experiência com Treino (Gamificação: "Nível de experiência")
    {
      id: 'experiencia_treino',
      text: 'Há quanto tempo você treina?',
      type: 'single',
      options: [
        'Iniciante (menos de 6 meses)',
        'Intermediário (6 meses - 2 anos)',
        'Avançado (2+ anos)'
      ],
      required: true,
      tags: ['experience', 'level']
    },
    {
      id: 'frequencia_treino',
      text: 'Quantas vezes por semana você treina atualmente?',
      type: 'single',
      options: ['3x por semana', '4x por semana', '5x por semana', '6+ vezes por semana'],
      required: true,
      tags: ['exercise', 'frequency']
    },
    {
      id: 'tipo_treino',
      text: 'Qual tipo de treino você pratica?',
      type: 'multiple',
      options: [
        'Musculação',
        'CrossFit',
        'Calistenia',
        'Treino funcional',
        'Outro'
      ],
      required: true,
      tags: ['exercise', 'modality']
    },

    // Bloco 3: Nutrição e Suplementação (Gamificação: "Combustível para crescimento")
    {
      id: 'consumo_proteina',
      text: 'Você acompanha seu consumo de proteína?',
      type: 'single',
      options: ['Não', 'Às vezes', 'Sim, sempre'],
      required: true,
      tags: ['nutrition', 'protein']
    },
    {
      id: 'suplementos',
      text: 'Você usa suplementos?',
      type: 'single',
      options: ['Não uso', 'Uso alguns básicos', 'Uso vários suplementos'],
      required: true,
      tags: ['nutrition', 'supplements']
    },
    {
      id: 'quais_suplementos',
      text: 'Quais suplementos você usa? (ex: whey, creatina, BCAA)',
      type: 'text',
      required: false,
      tags: ['nutrition', 'supplements'],
      showWhen: { questionId: 'suplementos', operator: 'in', value: ['Uso alguns básicos', 'Uso vários suplementos'] }
    },
    {
      id: 'refeicoes_dia',
      text: 'Quantas refeições você faz por dia?',
      type: 'single',
      options: ['3 refeições', '4-5 refeições', '6+ refeições'],
      required: true,
      tags: ['nutrition', 'meals']
    },

    // Bloco 4: Recuperação e Descanso (Gamificação: "Recuperação é treino também")
    {
      id: 'horas_sono',
      text: 'Quantas horas você dorme por noite em média?',
      type: 'number',
      required: true,
      tags: ['sleep', 'recovery']
    },
    {
      id: 'qualidade_sono',
      text: 'Como você avalia sua qualidade de sono? (1-10)',
      type: 'number',
      required: true,
      tags: ['sleep', 'recovery']
    },
    {
      id: 'dores_limites',
      text: 'Você sente dores ou limitações que afetam seu treino?',
      type: 'single',
      options: ['Não', 'Às vezes', 'Frequentemente'],
      required: true,
      tags: ['health', 'injuries']
    },
    {
      id: 'quais_dores',
      text: 'Quais dores ou limitações?',
      type: 'text',
      required: false,
      tags: ['health', 'injuries'],
      showWhen: { questionId: 'dores_limites', operator: 'in', value: ['Às vezes', 'Frequentemente'] }
    },

    // Bloco 5: Dificuldades e Barreiras (Gamificação: "Superando obstáculos")
    {
      id: 'maior_dificuldade',
      text: 'Qual sua maior dificuldade para ganhar massa?',
      type: 'single',
      options: [
        'Comer calorias suficientes',
        'Falta de tempo para treinar',
        'Falta de consistência',
        'Não vejo resultados',
        'Falta de conhecimento sobre nutrição',
        'Outro'
      ],
      required: true,
      tags: ['barriers', 'challenges']
    },
    {
      id: 'nivel_estresse',
      text: 'Como você avalia seu nível de estresse atual? (1-10)',
      type: 'number',
      required: true,
      tags: ['stress', 'mental_health']
    },

    // Bloco 6: Saúde e Condições
    {
      id: 'condicoes_saude',
      text: 'Você tem alguma condição de saúde que devemos considerar?',
      type: 'single',
      options: ['Não', 'Sim'],
      required: true,
      tags: ['health', 'medical']
    },
    {
      id: 'quais_condicoes',
      text: 'Quais condições?',
      type: 'text',
      required: false,
      tags: ['health', 'medical'],
      showWhen: { questionId: 'condicoes_saude', operator: 'eq', value: 'Sim' }
    }
  ],
  conditionalLogic: [
    { ifQuestion: 'suplementos', ifValue: ['Uso alguns básicos', 'Uso vários suplementos'], thenShow: ['quais_suplementos'] },
    { ifQuestion: 'dores_limites', ifValue: ['Às vezes', 'Frequentemente'], thenShow: ['quais_dores'] },
    { ifQuestion: 'condicoes_saude', ifValue: ['Sim'], thenShow: ['quais_condicoes'] }
  ],
  tags: ['muscle_gain', 'gamified', 'optimized']
};

// ─── TEMPLATE 3: MELHORIA DE SAÚDE ────────────────────────────────────────────
export const templateMelhoriaSaude = {
  questions: [
    // Bloco 1: Objetivo e Motivação (Gamificação: "Investindo na sua saúde")
    {
      id: 'obj_principal',
      text: 'Qual seu principal objetivo com a melhoria da saúde?',
      type: 'single',
      options: [
        'Prevenir doenças',
        'Melhorar energia e disposição',
        'Melhorar qualidade de vida',
        'Controlar condições existentes',
        'Sentir-me melhor no dia a dia',
        'Outro'
      ],
      required: true,
      tags: ['goal', 'motivation']
    },
    {
      id: 'motivacao',
      text: 'O que te motiva a cuidar melhor da sua saúde agora?',
      type: 'text',
      required: false,
      tags: ['motivation']
    },

    // Bloco 2: Situação Atual de Saúde (Gamificação: "Avaliando seu estado atual")
    {
      id: 'peso_atual',
      text: 'Qual seu peso atual? (kg)',
      type: 'number',
      required: true,
      tags: ['anthropometry', 'baseline']
    },
    {
      id: 'altura',
      text: 'Qual sua altura? (cm)',
      type: 'number',
      required: true,
      tags: ['anthropometry', 'baseline']
    },
    {
      id: 'autoavaliacao_saude',
      text: 'Como você avalia sua saúde geral? (1-10)',
      type: 'number',
      required: true,
      tags: ['health', 'self_assessment']
    },
    {
      id: 'nivel_energia',
      text: 'Como você avalia seu nível de energia ao longo do dia? (1-10)',
      type: 'number',
      required: true,
      tags: ['energy', 'vitality']
    },

    // Bloco 3: Condições de Saúde (Gamificação: "Conhecendo sua saúde")
    {
      id: 'condicoes_saude',
      text: 'Você tem alguma condição de saúde diagnosticada?',
      type: 'single',
      options: ['Não', 'Sim, uma condição', 'Sim, múltiplas condições'],
      required: true,
      tags: ['health', 'medical']
    },
    {
      id: 'quais_condicoes',
      text: 'Quais condições? (ex: diabetes, hipertensão, colesterol alto)',
      type: 'text',
      required: false,
      tags: ['health', 'medical'],
      showWhen: { questionId: 'condicoes_saude', operator: 'in', value: ['Sim, uma condição', 'Sim, múltiplas condições'] }
    },
    {
      id: 'medicamentos',
      text: 'Você toma algum medicamento contínuo?',
      type: 'single',
      options: ['Não', 'Sim'],
      required: true,
      tags: ['health', 'medications']
    },
    {
      id: 'quais_medicamentos',
      text: 'Quais medicamentos?',
      type: 'text',
      required: false,
      tags: ['health', 'medications'],
      showWhen: { questionId: 'medicamentos', operator: 'eq', value: 'Sim' }
    },

    // Bloco 4: Estilo de Vida (Gamificação: "Analisando seus hábitos")
    {
      id: 'atividade_fisica',
      text: 'Com que frequência você pratica atividade física?',
      type: 'single',
      options: ['Não pratico', '1-2x por semana', '3-4x por semana', '5+ vezes por semana'],
      required: true,
      tags: ['lifestyle', 'exercise']
    },
    {
      id: 'qualidade_alimentacao',
      text: 'Como você avalia sua alimentação atual?',
      type: 'single',
      options: [
        'Muito ruim, preciso melhorar muito',
        'Ruim, preciso melhorar',
        'Regular, posso melhorar',
        'Boa, mas posso otimizar',
        'Muito boa'
      ],
      required: true,
      tags: ['lifestyle', 'nutrition']
    },
    {
      id: 'horas_sono',
      text: 'Quantas horas você dorme por noite em média?',
      type: 'number',
      required: true,
      tags: ['sleep', 'recovery']
    },
    {
      id: 'qualidade_sono',
      text: 'Como você avalia sua qualidade de sono? (1-10)',
      type: 'number',
      required: true,
      tags: ['sleep', 'recovery']
    },

    // Bloco 5: Estresse e Bem-estar Mental (Gamificação: "Cuidando da mente")
    {
      id: 'nivel_estresse',
      text: 'Como você avalia seu nível de estresse? (1-10)',
      type: 'number',
      required: true,
      tags: ['stress', 'mental_health']
    },
    {
      id: 'ansiedade_depressao',
      text: 'Você sente ansiedade ou sintomas de depressão?',
      type: 'single',
      options: ['Não', 'Às vezes', 'Frequentemente'],
      required: true,
      tags: ['mental_health']
    },

    // Bloco 6: Hábitos e Comportamentos (Gamificação: "Identificando áreas de melhoria")
    {
      id: 'fumante',
      text: 'Você fuma?',
      type: 'single',
      options: ['Não', 'Sim, ocasionalmente', 'Sim, regularmente'],
      required: true,
      tags: ['lifestyle', 'habits']
    },
    {
      id: 'consumo_alcool',
      text: 'Com que frequência você consome álcool?',
      type: 'single',
      options: ['Não consumo', 'Raramente', '1-2x por semana', '3+ vezes por semana'],
      required: true,
      tags: ['lifestyle', 'habits']
    },
    {
      id: 'agua_dia',
      text: 'Quantos litros de água você bebe por dia?',
      type: 'number',
      required: true,
      tags: ['lifestyle', 'hydration']
    }
  ],
  conditionalLogic: [
    { ifQuestion: 'condicoes_saude', ifValue: ['Sim, uma condição', 'Sim, múltiplas condições'], thenShow: ['quais_condicoes'] },
    { ifQuestion: 'medicamentos', ifValue: ['Sim'], thenShow: ['quais_medicamentos'] }
  ],
  tags: ['health_improvement', 'gamified', 'optimized']
};

// ─── TEMPLATE 4: MANTER BOM CORPO ────────────────────────────────────────────
export const templateManterBomCorpo = {
  questions: [
    // Bloco 1: Situação Atual (Gamificação: "Mantendo sua forma")
    {
      id: 'peso_atual',
      text: 'Qual seu peso atual? (kg)',
      type: 'number',
      required: true,
      tags: ['anthropometry', 'baseline']
    },
    {
      id: 'altura',
      text: 'Qual sua altura? (cm)',
      type: 'number',
      required: true,
      tags: ['anthropometry', 'baseline']
    },
    {
      id: 'satisfacao_corpo',
      text: 'Como você avalia sua satisfação com seu corpo atual? (1-10)',
      type: 'number',
      required: true,
      tags: ['satisfaction', 'body_image']
    },
    {
      id: 'obj_manutencao',
      text: 'O que você quer manter ou melhorar?',
      type: 'multiple',
      options: [
        'Manter peso atual',
        'Manter massa muscular',
        'Manter definição',
        'Melhorar composição corporal',
        'Manter energia e disposição',
        'Outro'
      ],
      required: true,
      tags: ['goal', 'maintenance']
    },

    // Bloco 2: Rotina Atual (Gamificação: "Sua rotina que funciona")
    {
      id: 'frequencia_treino',
      text: 'Quantas vezes por semana você treina?',
      type: 'single',
      options: ['3x por semana', '4x por semana', '5x por semana', '6+ vezes por semana'],
      required: true,
      tags: ['exercise', 'routine']
    },
    {
      id: 'tipo_treino',
      text: 'Qual tipo de treino você pratica?',
      type: 'multiple',
      options: [
        'Musculação',
        'Cardio',
        'Treino funcional',
        'Yoga/Pilates',
        'Esportes',
        'Outro'
      ],
      required: true,
      tags: ['exercise', 'modality']
    },
    {
      id: 'disciplina_alimentar',
      text: 'Como você avalia sua disciplina alimentar?',
      type: 'single',
      options: [
        'Muito disciplinado',
        'Disciplinado na maioria das vezes',
        'Regular, preciso melhorar',
        'Preciso melhorar muito'
      ],
      required: true,
      tags: ['nutrition', 'discipline']
    },
    {
      id: 'refeicoes_dia',
      text: 'Quantas refeições você faz por dia?',
      type: 'single',
      options: ['3 refeições', '4-5 refeições', '6+ refeições'],
      required: true,
      tags: ['nutrition', 'meals']
    },

    // Bloco 3: Desafios de Manutenção (Gamificação: "Superando desafios")
    {
      id: 'maior_desafio',
      text: 'Qual seu maior desafio para manter a forma?',
      type: 'single',
      options: [
        'Manter consistência',
        'Variedade na alimentação',
        'Falta de tempo',
        'Motivação',
        'Não tenho grandes desafios',
        'Outro'
      ],
      required: true,
      tags: ['barriers', 'challenges']
    },
    {
      id: 'periodos_dificil',
      text: 'Em quais períodos você tem mais dificuldade?',
      type: 'multiple',
      options: [
        'Fins de semana',
        'Férias',
        'Períodos de estresse',
        'Eventos sociais',
        'Não tenho períodos difíceis',
        'Outro'
      ],
      required: true,
      tags: ['barriers', 'challenges']
    },

    // Bloco 4: Recuperação e Descanso (Gamificação: "Cuidando da recuperação")
    {
      id: 'horas_sono',
      text: 'Quantas horas você dorme por noite em média?',
      type: 'number',
      required: true,
      tags: ['sleep', 'recovery']
    },
    {
      id: 'qualidade_sono',
      text: 'Como você avalia sua qualidade de sono? (1-10)',
      type: 'number',
      required: true,
      tags: ['sleep', 'recovery']
    },
    {
      id: 'recuperacao_treino',
      text: 'Como você avalia sua recuperação entre treinos? (1-10)',
      type: 'number',
      required: true,
      tags: ['recovery', 'performance']
    },

    // Bloco 5: Saúde e Bem-estar (Gamificação: "Mantendo saúde em dia")
    {
      id: 'nivel_energia',
      text: 'Como você avalia seu nível de energia? (1-10)',
      type: 'number',
      required: true,
      tags: ['energy', 'vitality']
    },
    {
      id: 'nivel_estresse',
      text: 'Como você avalia seu nível de estresse? (1-10)',
      type: 'number',
      required: true,
      tags: ['stress', 'mental_health']
    },
    {
      id: 'condicoes_saude',
      text: 'Você tem alguma condição de saúde que devemos considerar?',
      type: 'single',
      options: ['Não', 'Sim'],
      required: true,
      tags: ['health', 'medical']
    },
    {
      id: 'quais_condicoes',
      text: 'Quais condições?',
      type: 'text',
      required: false,
      tags: ['health', 'medical'],
      showWhen: { questionId: 'condicoes_saude', operator: 'eq', value: 'Sim' }
    }
  ],
  conditionalLogic: [
    { ifQuestion: 'condicoes_saude', ifValue: ['Sim'], thenShow: ['quais_condicoes'] }
  ],
  tags: ['maintenance', 'gamified', 'optimized']
};
