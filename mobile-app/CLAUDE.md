# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (scan QR with Expo Go)
npm run android    # Start on Android emulator
npm run ios        # Start on iOS simulator
npm run web        # Start for web
```

No lint or test scripts are configured in this project.

**Environment setup:** Create a `.env` file in the project root:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000   # Android emulator default
# EXPO_PUBLIC_API_URL=http://192.168.x.x:3000  # Physical device: use machine IP
```

**Demo mode (no backend needed):** Login with `demo` / `teste@andromeda.demo` / `123456` to use mock data.

## Architecture

### Entry point and providers
`App.tsx` wraps the app with `GestureHandlerRootView` → `AuthProvider` → `AppNavigator`.

### Authentication flow
`src/context/AuthContext.tsx` — The sole auth state manager. Persists `token`, `refreshToken`, `user`, and `tenantId` in AsyncStorage (keys prefixed `@patient_app_`). Exposes `isSignedIn`, `isLoading`, `login()`, and `logout()` via `useAuth()` hook.

`AppNavigator` reads `isSignedIn` from `useAuth()` to switch between the Login stack and the authenticated Main (tab) stack.

### Navigation structure
```
AppNavigator
├── (unauthenticated) Stack → LoginScreen
└── (authenticated) Stack → MainTabs
    ├── Tab: Home → HomeScreen
    ├── Tab: Treinos → TrainingStack
    │   ├── TrainingPlansScreen (list)
    │   ├── TrainingPlanDetailScreen (detail + exercises)
    │   └── LogWorkoutScreen (log a completed session)
    └── Tab: Dieta → DietStack
        ├── DietPlansScreen (list)
        └── DietPlanDetailScreen (detail + meals)
```

Stack param types (`TrainingStackParamList`, `DietStackParamList`) are exported from `AppNavigator.tsx` and used for typed `useNavigation`/`useRoute`.

### API layer (`src/api/`)
All HTTP calls go through `apiFetch` in `client.ts`, which reads `EXPO_PUBLIC_API_URL`, attaches `Content-Type`, `x-tenant-id`, and `Authorization: Bearer <token>` headers, and throws on non-OK responses.

**Demo mode pattern:** Every API function checks `isDevToken(token)` (from `andromeda.ts`) and short-circuits to `mockData.ts` before making any real request. The dev token constant is `ANDROMEDA_DEV_TOKEN = 'dev-test-token'`.

| File | Responsibility |
|------|---------------|
| `client.ts` | `apiFetch` base fetch wrapper |
| `andromeda.ts` | Base URL helper, dev token constant |
| `auth.ts` | `login()`, `getMe()` |
| `training.ts` | `getMyTrainingPlans()`, `getMyTrainingPlan()`, `logWorkout()` |
| `diet.ts` | `getMyDietPlans()`, `getMyDietPlan()` |
| `mockData.ts` | Full mock responses for demo mode |

### Types (`src/types/index.ts`)
Central type definitions: `PatientUser`, `LoginResponse`, `MeResponse`, `TrainingPlanSummary`, `TrainingPlanDetail`, `DietPlanSummary`, `DietPlanDetail`, `ListMeta`, `ExerciseMedia`, and workout log types (`SavedWorkoutLog`, `WorkoutExerciseLog`, `WorkoutSetRecord`).

`TrainingPlanDetail.planJson` and `DietPlanDetail.mealPlanJson` are typed as `Record<string, unknown>` — the shape is defined by the backend and parsed at the screen level. In practice `planJson` has `{ days: [{ dayLabel, exercises: [{ name, sets, reps, rest, muscleGroup, gifUrl?, imageUrl? }] }] }`.

### Theme (`src/theme.ts`)
Single source of truth for all visual constants: `colors`, `spacing` (xs→xxl), `radius` (sm→full), and `typography` presets. Import and use these instead of hardcoding values in StyleSheet.

### Components (`src/components/`)
`ExerciseMedia` — renders exercise `gifUrl` or `imageUrl` with a loading spinner and GIF badge. Silently hides itself on error or when no URI is provided.

## Backend integration

The app connects to the **Andromeda platform** (`patient-portal` module). All authenticated endpoints require:
- `Authorization: Bearer <token>`
- `x-tenant-id: <tenantId>`

The tenant ID is collected at login and stored in both AsyncStorage and `AuthContext`.
