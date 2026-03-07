/**
 * Base de conhecimento da Central de Ajuda (F2 — Fase 3).
 * Top dúvidas + artigos contextuais; pode ser migrado para CMS/backend depois.
 */

export interface HelpArticle {
  id: string;
  category: string;
  title: string;
  body: string;
  tags: string[];
}

export const HELP_CATEGORIES = [
  { id: 'conta', label: 'Conta e login' },
  { id: 'pacientes', label: 'Pacientes' },
  { id: 'avaliacoes', label: 'Avaliações e questionários' },
  { id: 'planos', label: 'Planos (dieta, treino, agendamentos)' },
  { id: 'relatorios', label: 'Relatórios e IA' },
  { id: 'config', label: 'Configurações e assinatura' },
] as const;

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'login-esqueci-senha',
    category: 'conta',
    title: 'Esqueci minha senha',
    body: 'Na tela de login, clique em "Esqueci minha senha" e informe seu e-mail. Você receberá um link para redefinir a senha. Verifique a pasta de spam se não encontrar na caixa de entrada. O link expira em 1 hora.',
    tags: ['login', 'senha', 'recuperar'],
  },
  {
    id: 'login-credenciais-invalidas',
    category: 'conta',
    title: 'Mensagem "Credenciais inválidas"',
    body: 'Verifique se o e-mail e a senha estão corretos. Lembre-se: o e-mail é o mesmo em todas as organizações em que você participa. Se tiver certeza e ainda assim não conseguir, use "Esqueci minha senha" ou entre em contato com o administrador da sua organização.',
    tags: ['login', 'erro', 'acesso'],
  },
  {
    id: 'cadastrar-paciente',
    category: 'pacientes',
    title: 'Como cadastrar um paciente',
    body: 'No menu, vá em Pacientes e clique em "Novo paciente". Preencha pelo menos o nome completo. Os demais campos são opcionais e podem ser preenchidos depois. Ao salvar, o paciente ficará disponível para vincular a avaliações e planos.',
    tags: ['paciente', 'cadastro', 'novo'],
  },
  {
    id: 'buscar-paciente',
    category: 'pacientes',
    title: 'Como encontrar um paciente na lista',
    body: 'Na lista de Pacientes, use o campo de busca no topo para filtrar por nome. A lista é paginada; você pode navegar pelas páginas com os botões "Anterior" e "Próxima". Os filtros são aplicados no servidor para manter a lista rápida.',
    tags: ['paciente', 'busca', 'lista', 'filtro'],
  },
  {
    id: 'iniciar-avaliacao',
    category: 'avaliacoes',
    title: 'Como iniciar uma avaliação (questionário)',
    body: 'Vá em Avaliações e clique em "Nova avaliação". Escolha o template do questionário e o paciente (se aplicável). Após criar, você pode abrir o questionário pelo link "Continuar" na lista ou no dashboard, em Próximas ações.',
    tags: ['avaliação', 'questionário', 'sessão', 'template'],
  },
  {
    id: 'questionario-preferir-nao-responder',
    category: 'avaliacoes',
    title: 'Posso pular uma pergunta no questionário?',
    body: 'Perguntas marcadas como obrigatórias precisam ser respondidas para avançar. Em algumas perguntas sensíveis, há a opção "Prefiro não responder" — ao marcá-la, você pode seguir sem preencher o campo. O profissional que aplica o questionário pode configurar isso no template.',
    tags: ['questionário', 'pergunta', 'pular', 'privacidade'],
  },
  {
    id: 'sessao-em-andamento',
    category: 'avaliacoes',
    title: 'O que significa "sessão em andamento"?',
    body: 'É uma avaliação que foi iniciada mas ainda não foi finalizada. O paciente ou o profissional pode continuar de onde parou acessando a sessão e seguindo o fluxo do questionário até a assinatura final.',
    tags: ['sessão', 'status', 'andamento'],
  },
  {
    id: 'planos-dieta-treino',
    category: 'planos',
    title: 'Onde ficam os planos de dieta e treino?',
    body: 'No menu, abra "Planos" e escolha "Planos de dieta" ou "Planos de treino". Os agendamentos de questionários ficam em "Agendamentos". Cada tipo de plano é criado e editado na sua própria tela.',
    tags: ['plano', 'dieta', 'treino', 'menu'],
  },
  {
    id: 'relatorio-insights',
    category: 'relatorios',
    title: 'Como ver os insights e relatórios de uma avaliação?',
    body: 'Após concluir um questionário (incluindo a assinatura), acesse a sessão e abra "Insights" ou o relatório do paciente. Os insights são gerados com base nas respostas e podem variar conforme a configuração de IA do tenant.',
    tags: ['relatório', 'insights', 'sessão', 'IA'],
  },
  {
    id: 'historico-atividades',
    category: 'relatorios',
    title: 'O que é o Histórico de atividades (audit)?',
    body: 'É o registro de ações importantes no sistema (criação, edição, exclusão) para auditoria e conformidade. Acesso em Relatórios > Histórico de atividades. O uso de IA pode ser visto em Relatórios > Uso de IA.',
    tags: ['audit', 'histórico', 'relatório'],
  },
  {
    id: 'assinatura-cancelar',
    category: 'config',
    title: 'Como alterar ou cancelar minha assinatura?',
    body: 'Vá em Administração > Assinatura. Lá você pode ver o plano atual e acessar o portal de pagamento para atualizar forma de pagamento ou cancelar. Dúvidas de cobrança devem ser tratadas com o suporte ou pelo portal do provedor de pagamento.',
    tags: ['assinatura', 'pagamento', 'cancelar'],
  },
  {
    id: 'seguranca-2fa',
    category: 'config',
    title: 'Como ativar autenticação em duas etapas (2FA)?',
    body: 'Em Administração > Segurança você pode ativar 2FA usando um app autenticador (Google Authenticator, Authy, etc.). Será exibido um QR code para escanear. Guarde os códigos de backup em local seguro.',
    tags: ['segurança', '2FA', 'autenticação'],
  },
  // R1 — Materiais para suporte (release Ativação e Confiança)
  {
    id: 'r1-perfil-incompleto',
    category: 'conta',
    title: "Por que estou vendo 'perfil incompleto'?",
    body: 'Se você pulou etapas no onboarding ou saiu antes de concluir a configuração inicial, o sistema pode sugerir que você complete seu perfil. Isso não impede o uso do sistema: você pode acessar o dashboard e as funções normalmente. Quando quiser, vá em "Complete sua configuração" no dashboard ou acesse o onboarding pelo menu para preencher o que faltou. Nenhum dado é obrigatório para começar, exceto o que sua organização definir.',
    tags: ['onboarding', 'perfil', 'configuração', 'pular'],
  },
  {
    id: 'r1-como-sei-que-salvou',
    category: 'avaliacoes',
    title: 'Como sei que salvou?',
    body: 'Todas as ações importantes (salvar, enviar, excluir) agora têm feedback claro: o botão entra em estado de carregamento enquanto a requisição é processada e, ao concluir, uma mensagem de sucesso aparece no canto da tela (toast). Em caso de erro, uma mensagem em vermelho explica o que aconteceu. Em exclusões, há sempre uma confirmação antes de remover. Se você não vir a mensagem de sucesso, verifique sua conexão e tente novamente; em dúvida, confira se o dado aparece na lista ou na tela de detalhe.',
    tags: ['salvar', 'feedback', 'toast', 'confirmação'],
  },
  {
    id: 'r1-proximas-acoes',
    category: 'conta',
    title: 'O que são Próximas Ações?',
    body: 'O painel "Próximas ações" no topo do dashboard mostra até 5 tarefas sugeridas para você fazer agora: por exemplo, continuar um questionário em andamento, avaliar um paciente que não tem sessão recente, criar seu primeiro template ou iniciar uma avaliação. Cada item é um link direto para a tela correspondente. Se não houver nada pendente, você verá "Você está em dia!". Use esse painel para ir direto ao que importa sem procurar no menu.',
    tags: ['dashboard', 'próximas ações', 'tarefas', 'foco'],
  },
  // R2 — Encontrabilidade: mapeamento "onde estava → onde está"
  {
    id: 'onde-encontro',
    category: 'conta',
    title: 'Onde encontro X agora? (O que mudou no menu)',
    body: `O menu foi reorganizado por tarefas para você achar tudo mais rápido.

**Onde estava → Onde está:**
• **Templates / Modelos de questionário** → **Questionários** (menu "Uso diário")
• **Avaliações / Sessões** → **Avaliações** (sessões e questionários de anamnese)
• **Planos de dieta** → **Planos** > Planos de dieta
• **Planos de treino** → **Planos** > Planos de treino
• **Agendamentos de questionários** → **Planos** > Agendamentos
• **Histórico de atividades / Audit** → **Relatórios** > Histórico de atividades
• **Uso de IA** → **Relatórios** > Uso de IA
• **Usuários, Organizações, Assinatura, Segurança** → no final do menu, em **Administração**

**Tour rápido:** No dashboard, use o botão "Fazer tour" no aviso do novo menu para ver em 30 segundos onde ficou cada coisa.`,
    tags: ['menu', 'navegação', 'tour', 'R2', 'encontrabilidade'],
  },
];
