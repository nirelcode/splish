import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DrinkEntry {
  id: string;
  ml: number;
  timestamp: number; // ms epoch
}

export interface WaterState {
  // Onboarding
  onboardingDone: boolean;
  name: string | null;
  gender: string | null;
  age: string | null;
  weightKg: number;
  activity: string | null;
  climate: string | null;
  currentDrink: string | null;
  mainGoal: string | null;

  // Goal (ml)
  dailyGoalMl: number;

  // Notifications
  notifStart: { hour: number; minute: number; period: 'AM' | 'PM' };
  notifEnd:   { hour: number; minute: number; period: 'AM' | 'PM' };
  notifCount: number;

  // Log — keyed by date string 'YYYY-MM-DD', array of entries
  log: Record<string, DrinkEntry[]>;

  // Streak
  streak: number;
  lastStreakDate: string | null;

  // Actions
  setOnboarding: (data: Partial<Pick<WaterState,
    'gender' | 'age' | 'weightKg' | 'activity' | 'climate' | 'currentDrink' | 'dailyGoalMl' | 'mainGoal'
  >>) => void;
  setName: (name: string) => void;
  setGender: (gender: string) => void;
  setNotifications: (data: { start: WaterState['notifStart']; end: WaterState['notifEnd']; count: number }) => void;
  finishOnboarding: () => void;
  addDrink: (ml: number) => void;
  removeLast: () => void;
  resetDay: () => void;
  setDailyGoal: (ml: number) => void;
  checkStreak: () => void;
  reset: () => void;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function calcGoal(state: Partial<WaterState>): number {
  // Base: 35ml per kg of body weight
  const weight = state.weightKg ?? 70;
  let base = weight * 35;

  // Activity modifier
  const act = state.activity ?? '';
  if (act === 'Quite active') base += 300;
  else if (act === 'Very active') base += 600;
  else if (act === 'Super active') base += 900;

  // Climate modifier
  const cli = state.climate ?? '';
  if (cli === 'Hot') base += 400;
  else if (cli === 'Chill') base += 100;

  // Goal modifier
  const goal = state.mainGoal ?? '';
  if (goal === 'Boost my energy') base += 200;
  else if (goal === 'Reach weight goals') base += 300;
  else if (goal === 'Clearer skin') base += 100;

  // Clamp to sensible range
  return Math.round(Math.max(1500, Math.min(4000, base)));
}

function updateStreak(state: WaterState, today: string): { streak: number; lastStreakDate: string | null } {
  const todayEntries = state.log[today] ?? [];
  const totalToday = todayEntries.reduce((s, e) => s + e.ml, 0);
  const goalMet = totalToday >= state.dailyGoalMl;

  if (!goalMet) return { streak: state.streak, lastStreakDate: state.lastStreakDate };

  if (state.lastStreakDate === today) {
    return { streak: state.streak, lastStreakDate: today };
  }

  // Check if yesterday's goal was also met (consecutive day)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);

  const newStreak = state.lastStreakDate === yKey ? state.streak + 1 : 1;
  return { streak: newStreak, lastStreakDate: today };
}

export const useWaterStore = create<WaterState>()(
  persist(
    (set, get) => ({
      onboardingDone: false,
      name: null,
      gender: null,
      age: null,
      weightKg: 70,
      activity: null,
      climate: null,
      currentDrink: null,
      mainGoal: null,
      dailyGoalMl: 2100,
      notifStart: { hour: 9, minute: 0, period: 'AM' },
      notifEnd:   { hour: 10, minute: 0, period: 'PM' },
      notifCount: 5,
      log: {},
      streak: 0,
      lastStreakDate: null,

      setOnboarding: (data) => {
        set((s) => {
          const next = { ...s, ...data };
          const goal = calcGoal(next);
          return { ...next, dailyGoalMl: goal };
        });
      },

      setName: (name) => set({ name }),
      setGender: (gender) => set({ gender }),

      setNotifications: ({ start, end, count }) => {
        set({ notifStart: start, notifEnd: end, notifCount: count });
      },

      finishOnboarding: () => set({ onboardingDone: true }),

      addDrink: (ml) => {
        const today = todayKey();
        set((s) => {
          const existing = s.log[today] ?? [];
          const entry: DrinkEntry = { id: Date.now().toString(), ml, timestamp: Date.now() };
          const updated = { ...s.log, [today]: [...existing, entry] };
          const streakData = updateStreak({ ...s, log: updated }, today);
          return { log: updated, ...streakData };
        });
      },

      removeLast: () => {
        const today = todayKey();
        set((s) => {
          const existing = s.log[today] ?? [];
          if (existing.length === 0) return s;
          return { log: { ...s.log, [today]: existing.slice(0, -1) } };
        });
      },

      resetDay: () => {
        const today = todayKey();
        set((s) => ({ log: { ...s.log, [today]: [] } }));
      },

      setDailyGoal: (ml) => set({ dailyGoalMl: ml }),

      checkStreak: () => {
        const s = get();
        if (!s.lastStreakDate) return;

        const today = todayKey();
        if (s.lastStreakDate === today) return; // already up-to-date today

        // If last streak date is older than yesterday, streak is broken
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yKey = yesterday.toISOString().slice(0, 10);

        if (s.lastStreakDate < yKey) {
          set({ streak: 0, lastStreakDate: null });
        }
      },

      reset: () => set({
        onboardingDone: false,
        name: null,
        gender: null, age: null, weightKg: 70,
        activity: null, climate: null, currentDrink: null,
        mainGoal: null,
        dailyGoalMl: 2100,
        log: {}, streak: 0, lastStreakDate: null,
      }),
    }),
    {
      name: 'splish-water-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export function useTodayMl() {
  return useWaterStore((s) => {
    const today = todayKey();
    return (s.log[today] ?? []).reduce((sum, e) => sum + e.ml, 0);
  });
}

export function useTodayEntries() {
  return useWaterStore((s) => {
    const today = todayKey();
    return s.log[today] ?? [];
  });
}

export function useProgress() {
  const todayMl = useTodayMl();
  const goal = useWaterStore((s) => s.dailyGoalMl);
  return { todayMl, goal, pct: Math.min(todayMl / goal, 1) };
}

export function useWeeklyData() {
  return useWaterStore((s) => {
    const result: { key: string; label: string; ml: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
      const ml = (s.log[key] ?? []).reduce((sum, e) => sum + e.ml, 0);
      result.push({ key, label, ml });
    }
    return result;
  });
}
