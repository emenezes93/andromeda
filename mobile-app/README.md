# Andromeda — App do Aluno

App Android (React Native / Expo) para o aluno ou paciente visualizar **treinos** e **planos de dieta** enviados pelo personal ou treinador, e registrar treinos realizados.

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) no celular (para desenvolvimento) ou Android Studio / emulador

## Configuração

1. Instale as dependências (já feito ao criar o app):

   ```bash
   cd patient-app
   npm install
   ```

2. Configure a URL da API:
   - Crie um arquivo `.env` na pasta `patient-app` com:
     ```env
     EXPO_PUBLIC_API_URL=http://SEU_IP:3000
     ```
   - **Emulador Android:** use `http://10.0.2.2:3000` (já é o padrão no código).
   - **Dispositivo físico:** use o IP da sua máquina na rede (ex: `http://192.168.1.10:3000`).

3. A API do backend (Andromeda) deve estar rodando e o **patient-portal** deve estar habilitado. O aluno precisa do **código da organização** (tenantId), e-mail e senha fornecidos pelo treinador.

## Primeiro login

O app **não tem usuário de teste**. Para fazer o primeiro acesso você precisa:

| Campo | O que é | Quem fornece |
|-------|---------|---------------|
| **Código da organização** | Identificador do tenant (ex.: sigla ou ID da academia/treinador) | Seu personal ou treinador |
| **E-mail** | E-mail da conta de paciente | Criada pelo treinador no painel Andromeda |
| **Senha** | Senha da conta | Definida pelo treinador ao criar o paciente ou enviada por e-mail |

**Requisitos:** o backend Andromeda deve estar rodando, o módulo **patient-portal** habilitado, e o treinador deve ter criado uma conta de paciente para você no sistema. A URL da API é a do `.env` (`EXPO_PUBLIC_API_URL`); no celular físico use o IP do seu computador na rede (ex.: `http://192.168.1.10:3000`).

### Usuário de teste (sem backend)

Para testar o app **sem** o backend Andromeda rodando, use estas credenciais (login simulado apenas em desenvolvimento):

| Campo | Valor |
|-------|--------|
| Código da organização | `demo` |
| E-mail | `teste@andromeda.demo` |
| Senha | `123456` |

Com esse usuário você verá **dados de exemplo**: dashboard com resumo (sessões, evoluções, metas), 2 planos de treino encaminhados (com dias e exercícios) e 2 planos de dieta (metas e restrições). Também é possível registrar treino realizado (simulado). Tudo sem backend.

## Rodar o app

```bash
npm run android
```

Ou apenas `npm start` e escaneie o QR code com o Expo Go.

## Funcionalidades

- **Login:** código da organização + e-mail + senha (conta de paciente criada pelo treinador).
- **Início:** tela de boas-vindas e botão Sair.
- **Treinos:** lista de planos de treino ativos; ao tocar, abre o detalhe com os dias e exercícios; botão para **registrar treino realizado** (data, duração, observações).
- **Dieta:** lista de planos de dieta ativos; ao tocar, abre o detalhe com metas diárias (kcal, macros, água) e restrições.

## Estrutura

- `src/api/` — cliente HTTP (auth, treinos, dieta).
- `src/context/AuthContext.tsx` — estado de login (token, tenantId, user).
- `src/screens/` — telas (Login, Home, listas e detalhes de treino/dieta, registrar treino).
- `src/navigation/AppNavigator.tsx` — navegação (stack + abas).
- `src/theme.ts` — tema (cores, espaçamentos, tipografia, alvos de toque).
- `src/components/ui/` — componentes reutilizáveis (Button, EmptyState).

## UI/UX e acessibilidade

O app segue boas práticas para apps mobile:

- **Alvos de toque:** botões e links com altura mínima de 44pt (Apple HIG / Material).
- **Inputs e botões:** altura consistente (48pt) para campos de texto e ações primárias.
- **Safe area:** telas principais respeitam notch e barra de navegação (SafeAreaView).
- **Listas:** padding inferior nas listas para rolagem confortável e área segura.
- **Estados vazios:** componente `EmptyState` com emoji, título e subtítulo.
- **Acessibilidade:** `accessibilityRole`, `accessibilityLabel` e `accessibilityState` em botões e itens clicáveis.
- **Teclado:** `tabBarHideOnKeyboard` para esconder a tab bar quando o teclado abre; `KeyboardAvoidingView` na tela de login.

## Integração com a plataforma Andromeda

O app integra com a API **patient-portal** da Andromeda. A base URL é definida em `EXPO_PUBLIC_API_URL` (`.env`).

### Módulos

- **`src/api/client.ts`** — `apiFetch`, base URL e headers (`Content-Type`, `x-tenant-id`, `Authorization`).
- **`src/api/andromeda.ts`** — Constantes e helpers da integração (incl. modo demo).
- **`src/api/auth.ts`** — Login e `GET /me` (perfil do paciente para o dashboard).
- **`src/api/training.ts`** — Lista e detalhe de planos de treino; registro de treino realizado.
- **`src/api/diet.ts`** — Lista e detalhe de planos de dieta.
- **`src/api/mockData.ts`** — Dados de exemplo usados quando o usuário está em modo demo (login de teste).

### Endpoints utilizados

| Método | Endpoint | Uso |
|--------|----------|-----|
| POST | `/v1/patient-portal/login` | Login (body: `email`, `password`; header: `x-tenant-id`) |
| GET | `/v1/patient-portal/me` | Perfil do paciente (sessões, evoluções, metas) |
| GET | `/v1/patient-portal/my-training-plans` | Lista de treinos encaminhados (`?page=&limit=&active=`) |
| GET | `/v1/patient-portal/my-training-plans/:id` | Detalhe do plano (dias e exercícios em `planJson`; cada exercício pode ter `imageUrl` e/ou `gifUrl` para foto e animação) |
| POST | `/v1/patient-portal/my-training-executions` | Registrar treino realizado |
| GET | `/v1/patient-portal/my-diet-plans` | Lista de dietas encaminhadas |
| GET | `/v1/patient-portal/my-diet-plans/:id` | Detalhe do plano (metas, restrições, `mealPlanJson`) |

Requisições autenticadas: `Authorization: Bearer <token>` e `x-tenant-id`.

## CI (GitHub Actions)

O pipeline de CI roda em **push** e **pull_request** nas branches `main` e `master`:

- **Typecheck:** `npm run typecheck` (TypeScript sem emitir arquivos)
- **Testes:** `npm run test` (Jest; testes em `src/**/*.test.ts`)

Para rodar a mesma validação localmente:

```bash
npm run ci
```

Configuração em `.github/workflows/ci.yml`.

## Publicar / mover para outro repositório

O projeto está em um diretório separado (`patient-app/`). Para usar em um repositório próprio:

1. Copie a pasta `patient-app` para o novo repositório.
2. Ajuste a URL da API (variável de ambiente ou build).
3. Para gerar um APK/AAB: use [EAS Build](https://docs.expo.dev/build/introduction/) ou `expo prebuild` + build nativo.

## Licença

Conforme o projeto Andromeda principal.
