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
  };
}

export const ptBR: Translations = {
  nav: {
    dashboard: 'Dashboard',
    templates: 'Templates',
    sessions: 'Avaliações',
    patients: 'Pacientes',
    trainingPlans: 'Planos de Treino',
    dietPlans: 'Planos de Dieta',
    scheduledQuestionnaires: 'Agendamentos',
    audit: 'Histórico de Atividades',
    aiUsage: 'Uso de IA',
    users: 'Usuários',
    tenants: 'Organizações',
    subscription: 'Assinatura',
    security: 'Segurança',
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
    patients: 'Pacientes',
    activeGoals: 'Metas ativas',
    recentSessions: 'Avaliações recentes',
    noSessionsYet: 'Nenhuma avaliação ainda. Que tal iniciar a primeira?',
    createFirstSession: 'Iniciar primeira avaliação',
    viewAllSessions: 'Ver todas as avaliações →',
    date: 'Data',
    template: 'Template',
    status: 'Status',
    actions: 'Ações',
    continue: 'Continuar',
    view: 'Ver',
    sessionsByDay: 'Avaliações nos últimos dias',
    sessionsByTemplate: 'Avaliações por template',
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
    continue: 'Continue',
    view: 'View',
    sessionsByDay: 'Assessments over the last days',
    sessionsByTemplate: 'Assessments by template',
  },
};

export const TRANSLATIONS: Record<Locale, Translations> = {
  'pt-BR': ptBR,
  'en-US': enUS,
};
