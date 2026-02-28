export type Locale = 'pt-BR' | 'en-US';

export interface Translations {
  nav: {
    dashboard: string;
    templates: string;
    sessions: string;
    patients: string;
    trainingPlans: string;
    scheduledQuestionnaires: string;
    audit: string;
    aiUsage: string;
    users: string;
    tenants: string;
    subscription: string;
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
    sessions: 'Sessões',
    patients: 'Pacientes',
    trainingPlans: 'Planos de Treino',
    scheduledQuestionnaires: 'Agendamentos',
    audit: 'Auditoria',
    aiUsage: 'Uso de IA',
    users: 'Usuários',
    tenants: 'Tenants',
    subscription: 'Assinatura',
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
    subtitle: 'Acompanhe suas sessões, conquistas e métricas abaixo.',
    period: 'Período:',
    newSession: 'Nova sessão',
    totalSessions: 'Total de sessões',
    activeTemplates: 'Templates ativos',
    patients: 'Pacientes',
    activeGoals: 'Metas ativas',
    recentSessions: 'Sessões recentes',
    noSessionsYet: 'Nenhuma sessão ainda.',
    createFirstSession: 'Criar primeira sessão',
    viewAllSessions: 'Ver todas as sessões →',
    date: 'Data',
    template: 'Template',
    status: 'Status',
    actions: 'Ações',
    continue: 'Continuar',
    view: 'Ver',
    sessionsByDay: 'Sessões nos últimos dias',
    sessionsByTemplate: 'Sessões por template',
  },
};

export const enUS: Translations = {
  nav: {
    dashboard: 'Dashboard',
    templates: 'Templates',
    sessions: 'Sessions',
    patients: 'Patients',
    trainingPlans: 'Training Plans',
    scheduledQuestionnaires: 'Scheduled',
    audit: 'Audit',
    aiUsage: 'AI Usage',
    users: 'Users',
    tenants: 'Tenants',
    subscription: 'Subscription',
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
    subtitle: 'Track your sessions, achievements, and metrics below.',
    period: 'Period:',
    newSession: 'New session',
    totalSessions: 'Total sessions',
    activeTemplates: 'Active templates',
    patients: 'Patients',
    activeGoals: 'Active goals',
    recentSessions: 'Recent sessions',
    noSessionsYet: 'No sessions yet.',
    createFirstSession: 'Create first session',
    viewAllSessions: 'View all sessions →',
    date: 'Date',
    template: 'Template',
    status: 'Status',
    actions: 'Actions',
    continue: 'Continue',
    view: 'View',
    sessionsByDay: 'Sessions over the last days',
    sessionsByTemplate: 'Sessions by template',
  },
};

export const TRANSLATIONS: Record<Locale, Translations> = {
  'pt-BR': ptBR,
  'en-US': enUS,
};
