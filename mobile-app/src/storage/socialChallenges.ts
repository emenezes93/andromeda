import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SocialChallenge {
  id: string;
  title: string;
  description: string;
  metric: 'workouts' | 'water' | 'streak';
  target: number;
  periodDays: number;
  icon: 'barbell' | 'water' | 'flame';
}

export interface SocialProgress {
  challengeId: string;
  value: number;
  updatedAt: string;
}

const CHALLENGES_KEY = '@patient_app_social_challenges';
const PROGRESS_KEY = '@patient_app_social_progress';

const DEFAULT_CHALLENGES: SocialChallenge[] = [
  {
    id: 'ch-7-workouts',
    title: 'Ritmo de Aço',
    description: 'Complete 4 treinos em 7 dias.',
    metric: 'workouts',
    target: 4,
    periodDays: 7,
    icon: 'barbell',
  },
  {
    id: 'ch-water-7',
    title: 'Hidratação em Dia',
    description: 'Bata 2500 ml de água por 5 dias nesta semana.',
    metric: 'water',
    target: 5,
    periodDays: 7,
    icon: 'water',
  },
  {
    id: 'ch-streak-14',
    title: 'Constância 14',
    description: 'Mantenha streak de 14 dias com qualquer registro.',
    metric: 'streak',
    target: 14,
    periodDays: 14,
    icon: 'flame',
  },
];

export async function getChallenges(): Promise<SocialChallenge[]> {
  try {
    const raw = await AsyncStorage.getItem(CHALLENGES_KEY);
    if (!raw) {
      await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(DEFAULT_CHALLENGES));
      return DEFAULT_CHALLENGES;
    }
    const parsed = JSON.parse(raw) as SocialChallenge[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CHALLENGES;
    return parsed;
  } catch {
    return DEFAULT_CHALLENGES;
  }
}

export async function getSocialProgress(): Promise<SocialProgress[]> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SocialProgress[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveSocialProgress(entry: SocialProgress): Promise<void> {
  const list = await getSocialProgress();
  const next = [entry, ...list.filter((i) => i.challengeId !== entry.challengeId)];
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
}

export async function getLeaderboardSeed(displayName: string): Promise<Array<{ name: string; score: number }>> {
  const base = [
    { name: displayName || 'Você', score: 84 },
    { name: 'Ana', score: 92 },
    { name: 'Bruno', score: 88 },
    { name: 'Carla', score: 81 },
    { name: 'Diego', score: 78 },
  ];
  return base.sort((a, b) => b.score - a.score);
}
