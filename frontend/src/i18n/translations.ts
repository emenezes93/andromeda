export type Locale = 'pt-BR' | 'en-US';

export interface Translations {
  nav: {
    dashboard: string;
    templates: string;
    sessions: string;
    patients: string;
    trainingPlans: string;
    dietPlans: string;
    scheduledQuestionnaires: string;
    audit: string;
    aiUsage: string;
    users: string;
    tenants: string;
    subscription: string;
    security: string;
    notifications: string;
    /** Fase 2: menu orientado a tarefas (5–7 itens) */
    taskInicio: string;
    taskPacientes: string;
    taskAvaliacoes: string;
    taskQuestionarios: string;
    taskPlanos: string;
    taskRelatorios: string;
    tooltipInicio: string;
    tooltipPacientes: string;
    tooltipAvaliacoes: string;
    tooltipQuestionarios: string;
    tooltipPlanos: string;
    tooltipRelatorios: string;
    planosDieta: string;
    planosTreino: string;
    planosAgendamentos: string;
    planosExercicios: string;
    relatoriosHistorico: string;
    relatoriosUsoIa: string;
    help: string;
  };
  navBanner: {
    title: string;
    cta: string;
    dismiss: string;
  };
  sidebar: {
    logout: string;
    terms: string;
    openMenu: string;
    closeMenu: string;
  };
  roles: {
    owner: string;
    admin: string;
    practitioner: string;
    viewer: string;
  };
  dashboard: {
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    subtitle: string;
    period: string;
    newSession: string;
    totalSessions: string;
    activeTemplates: string;
    patients: string;
    activeGoals: string;
    recentSessions: string;
    noSessionsYet: string;
    createFirstSession: string;
    viewAllSessions: string;
    date: string;
    template: string;
    status: string;
    actions: string;
    continue: string;
    view: string;
    sessionsByDay: string;
    sessionsByTemplate: string;
    nextActionsEmpty: string;
    nextActionsEmptySub: string;
    onboardingCtaTitle: string;
    onboardingCtaButton: string;
    onboardingCtaDismiss: string;
    releaseR1Title: string;
    releaseR1Message1: string;
    releaseR1Message2: string;
    releaseR1Dismiss: string;
    /** R2 — Encontrabilidade: menu por tarefas + tour */
    releaseR2Title: string;
    releaseR2Message: string;
    releaseR2CtaTour: string;
    releaseR2Dismiss: string;
    tourR2Title: string;
    tourR2Summary: string;
    tourR2Understand: string;
    tourR2ViewArticle: string;
    /** R3 — Escala e Autonomia: busca/filtros + ajuda in-app */
    releaseR3Title: string;
    releaseR3MessageSearch: string;
    releaseR3MessageHelp: string;
    releaseR3Dismiss: string;
  };
  exportSession?: {
    json: string;
    report: string;
  };
  signup?: {
    title: string;
    subtitle: string;
    trialNote: string;
    name: string;
    email: string;
    password: string;
    tenantName: string;
    submit: string;
    hasAccount: string;
    signIn: string;
  };
  billing?: {
    trialBanner: string;
    trialBannerCta: string;
    planCurrent: string;
    invoices: string;
    cancelSubscription: string;
    cancelConfirm: string;
    keepSubscription: string;
    cancelScheduled: string;
  };
  exercises: {
    title: string;
    subtitle: string;
    newExercise: string;
    search: string;
    muscleGroup: string;
    equipment: string;
    global: string;
    edit: string;
    delete: string;
    deleteConfirm: string;
    name: string;
    videoUrl: string;
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
  };
  invite?: {
    title: string;
    subtitle: string;
    button: string;
    linkLabel: string;
    copyLink: string;
    copied: string;
    sendWhatsApp: string;
    sendEmail: string;
    emailSent: string;
    noEmail: string;
    success: string;
    close: string;
  };
}

export const ptBR: Translations = {
  nav: {
    dashboard: 'Dashboard',
    templates: 'Templates',
    sessions: 'Avaliações',
    patients: 'Alunos',
    trainingPlans: 'Planos de Treino',
    dietPlans: 'Planos de Dieta',
    scheduledQuestionnaires: 'Agendamentos',
    audit: 'Histórico de Atividades',
    aiUsage: 'Uso de IA',
    users: 'Usuários',
    tenants: 'Organizações',
    subscription: 'Assinatura',
    security: 'Segurança',
    notifications: 'Notificações',
    taskInicio: 'Início',
    taskPacientes: 'Alunos',
    taskAvaliacoes: 'Avaliações',
    taskQuestionarios: 'Questionários',
    taskPlanos: 'Planos',
    taskRelatorios: 'Relatórios',
    tooltipInicio: 'Visão geral e próximas ações',
    tooltipPacientes: 'Cadastro e histórico dos alunos',
    tooltipAvaliacoes: 'Sessões e questionários de anamnese',
    tooltipQuestionarios: 'Modelos de questionário',
    tooltipPlanos: 'Planos de dieta, treino e agendamentos',
    tooltipRelatorios: 'Histórico de atividades e uso de IA',
    planosDieta: 'Planos de dieta',
    planosTreino: 'Planos de treino',
    planosAgendamentos: 'Agendamentos',
    planosExercicios: 'Exercícios',
    relatoriosHistorico: 'Histórico de atividades',
    relatoriosUsoIa: 'Uso de IA',
    help: 'Ajuda',
  },
  navBanner: {
    title: 'O menu foi reorganizado para facilitar o seu dia a dia.',
    cta: 'Conhecer',
    dismiss: 'Fechar',
  },
  sidebar: {
    logout: 'Sair',
    terms: 'Política de privacidade e termos de uso',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
  },
  roles: {
    owner: 'Proprietário',
    admin: 'Administrador',
    practitioner: 'Praticante',
    viewer: 'Visualizador',
  },
  dashboard: {
    greetingMorning: 'Bom dia',
    greetingAfternoon: 'Boa tarde',
    greetingEvening: 'Boa noite',
    subtitle: 'Acompanhe suas avaliações, conquistas e métricas abaixo.',
    period: 'Período:',
    newSession: 'Nova avaliação',
    totalSessions: 'Total de avaliações',
    activeTemplates: 'Templates ativos',
    patients: 'Alunos',
    activeGoals: 'Metas ativas',
    recentSessions: 'Avaliações recentes',
    noSessionsYet: 'Nenhuma avaliação ainda. Que tal iniciar a primeira?',
    createFirstSession: 'Iniciar primeira avaliação',
    viewAllSessions: 'Ver todas as avaliações →',
    date: 'Data',
    template: 'Template',
    status: 'Status',
    actions: 'Ações',
    continue: 'Continuar anamnese',
    view: 'Ver detalhes',
    sessionsByDay: 'Avaliações nos últimos dias',
    sessionsByTemplate: 'Avaliações por template',
    nextActionsEmpty: 'Você está em dia! Nada pendente no momento.',
    nextActionsEmptySub: 'Quando houver pendências, elas aparecerão aqui.',
    onboardingCtaTitle: 'Complete sua configuração para aproveitar melhor o sistema.',
    onboardingCtaButton: 'Ir para configuração',
    onboardingCtaDismiss: 'Dispensar',
    releaseR1Title: 'Novidades',
    releaseR1Message1: 'Agora ficou mais claro salvar e enviar: feedbacks de carregamento e confirmações para ações importantes.',
    releaseR1Message2: 'Seu painel de Próximas Ações: veja o que fazer agora e vá direto para cada tarefa.',
    releaseR1Dismiss: 'Fechar',
    releaseR2Title: 'O menu mudou (para ficar mais simples)',
    releaseR2Message: 'Organizamos por tarefas: Alunos, Avaliações, Relatórios e mais. Faça um tour de 30s.',
    releaseR2CtaTour: 'Fazer tour',
    releaseR2Dismiss: 'Fechar',
    tourR2Title: 'Menu por tarefas',
    tourR2Summary: 'Uso diário: Início, Alunos, Avaliações, Questionários, Planos (dieta, treino, agendamentos), Relatórios (histórico, uso de IA), Ajuda. Administração no final: Usuários, Organizações, Assinatura, Segurança.',
    tourR2Understand: 'Entendi',
    tourR2ViewArticle: 'Ver artigo "Onde encontro X agora?"',
    releaseR3Title: 'Novidades',
    releaseR3MessageSearch: 'Busca e filtros melhorados: encontre alunos e avaliações mais rápido, mesmo com listas grandes.',
    releaseR3MessageHelp: 'Ajuda dentro do app: consulte artigos e resolva dúvidas sem sair daqui.',
    releaseR3Dismiss: 'Fechar',
  },
  exportSession: {
    json: 'Exportar JSON',
    report: 'Exportar relatório (HTML)',
  },
  signup: {
    title: 'Criar conta',
    subtitle: 'Nome completo, e-mail, senha e nome da clínica ou empresa.',
    trialNote: '14 dias grátis, sem cartão de crédito',
    name: 'Nome completo',
    email: 'E-mail',
    password: 'Senha',
    tenantName: 'Nome da clínica/empresa',
    submit: 'Criar conta',
    hasAccount: 'Já tem conta?',
    signIn: 'Entrar',
  },
  billing: {
    trialBanner: 'Teste grátis por mais {days} dias.',
    trialBannerCta: 'Assine agora',
    planCurrent: 'Plano atual',
    invoices: 'Faturas',
    cancelSubscription: 'Cancelar assinatura',
    cancelConfirm: 'Sua assinatura será cancelada ao final do período. Tem certeza?',
    keepSubscription: 'Manter assinatura',
    cancelScheduled: 'Sua assinatura será cancelada em {date}.',
  },
  exercises: {
    title: 'Biblioteca de exercícios',
    subtitle: 'Gerencie exercícios globais e personalizados para usar nos planos de treino.',
    newExercise: 'Novo exercício',
    search: 'Buscar por nome...',
    muscleGroup: 'Grupo muscular',
    equipment: 'Equipamento',
    global: 'Global',
    edit: 'Editar',
    delete: 'Excluir',
    deleteConfirm: 'Excluir este exercício? Só é possível excluir exercícios criados por você.',
    name: 'Nome',
    videoUrl: 'URL do vídeo',
    createSuccess: 'Exercício criado.',
    updateSuccess: 'Exercício atualizado.',
    deleteSuccess: 'Exercício excluído.',
  },
  invite: {
    title: 'Convidar para o app',
    subtitle: 'Envie o convite para o aluno baixar o app e se registrar.',
    button: 'Convidar para o app',
    linkLabel: 'Link de convite',
    copyLink: 'Copiar link',
    copied: 'Link copiado!',
    sendWhatsApp: 'Enviar por WhatsApp',
    sendEmail: 'Enviar por email',
    emailSent: 'Email enviado com sucesso!',
    noEmail: 'Aluno sem email cadastrado.',
    success: 'Convite gerado com sucesso!',
    close: 'Fechar',
  },
};

export const enUS: Translations = {
  nav: {
    dashboard: 'Dashboard',
    templates: 'Templates',
    sessions: 'Assessments',
    patients: 'Patients',
    trainingPlans: 'Training Plans',
    dietPlans: 'Diet Plans',
    scheduledQuestionnaires: 'Scheduled',
    audit: 'Activity log',
    aiUsage: 'AI Usage',
    users: 'Users',
    tenants: 'Organizations',
    subscription: 'Subscription',
    security: 'Security',
    notifications: 'Notifications',
    taskInicio: 'Home',
    taskPacientes: 'Patients',
    taskAvaliacoes: 'Assessments',
    taskQuestionarios: 'Questionnaires',
    taskPlanos: 'Plans',
    taskRelatorios: 'Reports',
    tooltipInicio: 'Overview and next actions',
    tooltipPacientes: 'Patient records and history',
    tooltipAvaliacoes: 'Sessions and anamnesis questionnaires',
    tooltipQuestionarios: 'Questionnaire templates',
    tooltipPlanos: 'Diet, training and scheduled plans',
    tooltipRelatorios: 'Activity log and AI usage',
    planosDieta: 'Diet plans',
    planosTreino: 'Training plans',
    planosAgendamentos: 'Scheduled',
    planosExercicios: 'Exercises',
    relatoriosHistorico: 'Activity log',
    relatoriosUsoIa: 'AI usage',
    help: 'Help',
  },
  navBanner: {
    title: 'The menu has been reorganized to make your day easier.',
    cta: 'Learn more',
    dismiss: 'Dismiss',
  },
  sidebar: {
    logout: 'Sign out',
    terms: 'Privacy policy & terms of use',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  roles: {
    owner: 'Owner',
    admin: 'Admin',
    practitioner: 'Practitioner',
    viewer: 'Viewer',
  },
  dashboard: {
    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    subtitle: 'Track your assessments, achievements, and metrics below.',
    period: 'Period:',
    newSession: 'New assessment',
    totalSessions: 'Total assessments',
    activeTemplates: 'Active templates',
    patients: 'Patients',
    activeGoals: 'Active goals',
    recentSessions: 'Recent assessments',
    noSessionsYet: 'No assessments yet. Start your first one?',
    createFirstSession: 'Start first assessment',
    viewAllSessions: 'View all assessments →',
    date: 'Date',
    template: 'Template',
    status: 'Status',
    actions: 'Actions',
    continue: 'Continue questionnaire',
    view: 'View details',
    sessionsByDay: 'Assessments over the last days',
    sessionsByTemplate: 'Assessments by template',
    nextActionsEmpty: "You're all set! Nothing pending right now.",
    nextActionsEmptySub: 'When you have pending items, they will appear here.',
    onboardingCtaTitle: 'Complete your setup to get the most out of the system.',
    onboardingCtaButton: 'Go to setup',
    onboardingCtaDismiss: 'Dismiss',
    releaseR1Title: "What's new",
    releaseR1Message1: 'Saving and sending are clearer: loading feedback and confirmations for important actions.',
    releaseR1Message2: 'Your Next Actions panel: see what to do now and go straight to each task.',
    releaseR1Dismiss: 'Dismiss',
    releaseR2Title: 'The menu changed (to keep it simple)',
    releaseR2Message: 'We organized it by task: Patients, Assessments, Reports and more. Take a 30s tour.',
    releaseR2CtaTour: 'Take tour',
    releaseR2Dismiss: 'Dismiss',
    tourR2Title: 'Menu by task',
    tourR2Summary:
      'Daily use: Home, Patients, Assessments, Questionnaires, Plans (diet, training, scheduling), Reports (history, AI usage), Help. Administration at the bottom: Users, Organizations, Subscription, Security.',
    tourR2Understand: 'Got it',
    tourR2ViewArticle: 'See "Where do I find X now?" article',
    releaseR3Title: "What's new",
    releaseR3MessageSearch: 'Improved search and filters: find patients and sessions faster, even with large lists.',
    releaseR3MessageHelp: 'Help inside the app: browse articles and resolve doubts without leaving.',
    releaseR3Dismiss: 'Dismiss',
  },
  exportSession: {
    json: 'Export JSON',
    report: 'Export report (HTML)',
  },
  signup: {
    title: 'Create account',
    subtitle: 'Full name, email, password and clinic or company name.',
    trialNote: '14-day free trial, no credit card required',
    name: 'Full name',
    email: 'Email',
    password: 'Password',
    tenantName: 'Clinic/company name',
    submit: 'Create account',
    hasAccount: 'Already have an account?',
    signIn: 'Sign in',
  },
  billing: {
    trialBanner: 'Free trial for {days} more days.',
    trialBannerCta: 'Subscribe now',
    planCurrent: 'Current plan',
    invoices: 'Invoices',
    cancelSubscription: 'Cancel subscription',
    cancelConfirm: 'Your subscription will be canceled at the end of the period. Are you sure?',
    keepSubscription: 'Keep subscription',
    cancelScheduled: 'Your subscription will be canceled on {date}.',
  },
  exercises: {
    title: 'Exercise library',
    subtitle: 'Manage global and custom exercises for use in training plans.',
    newExercise: 'New exercise',
    search: 'Search by name...',
    muscleGroup: 'Muscle group',
    equipment: 'Equipment',
    global: 'Global',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirm: 'Delete this exercise? You can only delete exercises you created.',
    name: 'Name',
    videoUrl: 'Video URL',
    createSuccess: 'Exercise created.',
    updateSuccess: 'Exercise updated.',
    deleteSuccess: 'Exercise deleted.',
  },
  invite: {
    title: 'Invite to app',
    subtitle: 'Send an invite for the student to download the app and register.',
    button: 'Invite to app',
    linkLabel: 'Invite link',
    copyLink: 'Copy link',
    copied: 'Link copied!',
    sendWhatsApp: 'Send via WhatsApp',
    sendEmail: 'Send via email',
    emailSent: 'Email sent successfully!',
    noEmail: 'Patient has no email registered.',
    success: 'Invite generated successfully!',
    close: 'Close',
  },
};

export const TRANSLATIONS: Record<Locale, Translations> = {
  'pt-BR': ptBR,
  'en-US': enUS,
};
