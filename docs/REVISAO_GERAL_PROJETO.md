# Revisão geral do projeto Fit Insight

Visão consolidada do estado atual (pós-auditoria do site e implementação das melhorias). Referência para alinhar o app mobile e próximas entregas.

---

## 1. Visão do produto

- **Fit Insight:** plataforma multi-tenant para profissionais de saúde (personal trainers e nutricionistas) com foco em anamnese adaptativa, prescrição de treino e dieta, acompanhamento de evolução e insights com IA.
- **Usuários:** (1) **Profissional** — usa o frontend web (dashboard); (2) **Paciente** — consome planos, questionários e evolução; hoje a API patient-portal existe; a experiência mobile do paciente é o alvo do app mobile.
- **Landing (website/):** captação e conversão; público: profissionais que ainda não usam a plataforma.

---

## 2. Estado atual por camada

### 2.1 Backend (src/)

- **Core (hexagonal):** auth, users, tenants, patients, anamnesis (templates + sessions), insights, audit, stats, goals, quota. Controllers e use cases organizados; RLS e multi-tenancy.
- **Módulos:** health, auth (2FA), billing, patient-portal, patients-legacy (evolutions), progress-photos, diet, exercises, alerts, scheduled-questionnaires, training-plans, training-executions, patient-notifications.
- **Patient-portal (API):** rotas `/v1/patient-portal/*`: login, register, me, my-sessions, my-evolutions, my-goals, my-training-plans, my-diet-plans, my-training-executions, my-notifications (com mark-as-read). Autenticação JWT com `patientId`; fora do auth padrão (tenant/membership).
- **Conclusão:** API pronta para um cliente “portal do paciente” (web ou mobile). Falta apenas o cliente (app mobile ou SPA) consumir e expor as telas.

### 2.2 Frontend web (frontend/)

- **Stack:** React 18, Vite, React Router, TanStack Query, React Hook Form, Tailwind, Recharts, Lottie, PostHog.
- **Uso:** dashboard do **profissional** (templates, sessões, pacientes, evoluções, planos de treino/dieta, insights, billing, etc.). Não é o portal do paciente.
- **Rotas:** login/signup, dashboard, templates, sessions (incl. fill público), patients (list, form, detail, evolution, timeline, hub, report), diet, training-plans, goals, insights, billing, settings, etc.
- **Conclusão:** foco 100% no profissional. O “portal do paciente” citado na landing e no FAQ é a experiência que o **app mobile** deve entregar (ou uma PWA futura).

### 2.3 Site / landing (website/)

- **Stack:** React, Vite, Tailwind. Single-page com seções: Hero, Pain, SocialProof, Features, ForProfessionals, ForPatients, Pricing, Testimonials, FAQ, CTA, Footer.
- **Pós-auditoria:** design system (tokens de cor, tipografia body-sm/body/lead/caption, section-default/section-tight), componente Button, cores semânticas (success, warning, error), FAQ na navegação, links do footer tratados (Em breve), CTA “Falar com vendas” com mailto, PainSection com bullets, skip-link e bento-card com tokens, reveal com delay inline, IconPulse com variáveis CSS.
- **Conclusão:** landing alinhada à conversão e à identidade visual; serve de referência de tom, cores e proposta de valor para o app mobile (especialmente a seção “Para o paciente” e o copy de gamificação).

---

## 3. Gaps e alinhamento para o app mobile

| Aspecto | Situação atual | Necessário para o app mobile |
|--------|----------------|------------------------------|
| API paciente | Pronta (patient-portal) | App consome os mesmos endpoints; eventualmente push (FCM) e deep links. |
| Autenticação paciente | JWT (login/register) | App deve implementar login/registro e armazenar token/refresh; fluxo de “esqueci senha” verificar se existe na API. |
| Gamificação (XP, streak, níveis) | Citada na landing; backend pode ter ou não campos específicos | Definir modelo (tabelas/campos ou apenas no app); API de “progresso gamificado” se necessário. |
| Portal do paciente web | Não existe no repo como SPA | Opcional: PWA ou subpath no frontend; prioridade é o app nativo/híbrido. |
| Design system | Landing com tokens (primary, accent, success, etc.) | Replicar ou adaptar no app (tema claro/escuro, a11y, touch). |

---

## 4. Resumo executivo

- **Backend:** estável; patient-portal pronto para consumo por um cliente dedicado.
- **Frontend web:** focado no profissional; não substitui o app do paciente.
- **Landing:** revisada e consistente; define promessas (questionários pelo celular, gamificação, treino/dieta/evolução em um lugar) que o app mobile deve cumprir.
- **Próximo passo lógico:** construir o **app mobile do paciente** (React Native, Expo ou Flutter) consumindo `/v1/patient-portal/*`, com design e funcionalidades alinhados ao documento de prompt do app mobile.

---

*Documento gerado como base para o prompt do app mobile e para revisões futuras do produto.*
