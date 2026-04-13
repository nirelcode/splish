import { useEffect } from 'react';
import { useWaterStore } from '@/store/useWaterStore';
import { updateWidgetData } from '@/modules/widget-sync';

function getDateKey(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function useWidgetSync() {
  const log = useWaterStore((s) => s.log);
  const dailyGoalMl = useWaterStore((s) => s.dailyGoalMl);
  const streak = useWaterStore((s) => s.streak);

  useEffect(() => {
    const today = getDateKey(0);
    const todayEntries = log[today] ?? [];
    const todayMl = todayEntries.reduce((sum, e) => sum + e.ml, 0);
    const drinkCount = todayEntries.length;

    // Build 7-day weekly array (Mon–today)
    const weeklyMl: number[] = [];
    const todayDow = new Date().getDay(); // 0=Sun..6=Sat
    // We want last 7 days ending today
    for (let i = 6; i >= 0; i--) {
      const key = getDateKey(-i);
      const dayEntries = log[key] ?? [];
      weeklyMl.push(dayEntries.reduce((sum, e) => sum + e.ml, 0));
    }

    // Last 3 drinks today (most recent first)
    const recentLogs = [...todayEntries]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3)
      .map((e) => ({ ml: e.ml, time: e.timestamp }));

    updateWidgetData({
      todayMl,
      dailyGoalMl,
      streak,
      drinkCount,
      weeklyMl,
      recentLogs,
      lastUpdated: Date.now(),
    });
  }, [log, dailyGoalMl, streak]);
}
