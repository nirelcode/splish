import { NativeModules, Platform } from 'react-native';

interface WidgetData {
  todayMl: number;
  dailyGoalMl: number;
  streak: number;
  drinkCount: number;
  weeklyMl: number[];      // 7 values Mon-Sun, today last
  recentLogs: { ml: number; time: number }[];
  lastUpdated: number;
}

/**
 * Writes widget data to native storage and triggers a widget refresh.
 * On iOS: writes to App Groups UserDefaults → WidgetKit picks it up.
 * On Android: writes to SharedPreferences → AppWidgetProvider re-renders.
 *
 * No-ops on web or if the native module is not linked yet (dev builds without prebuild).
 */
export function updateWidgetData(data: WidgetData): void {
  try {
    const mod = NativeModules.WidgetSync;
    if (!mod) return; // native module not linked — safe no-op
    mod.updateWidgetData(JSON.stringify(data));
  } catch {
    // Fail silently — widgets are non-critical
  }
}

/** Android only: prompts the user to pin a specific widget to their home screen. */
export function requestPinWidget(widgetType: 'small' | 'ring' | 'streak' | 'medium' | 'daily' | 'weekly' | 'large'): void {
  if (Platform.OS !== 'android') return;
  try {
    const mod = NativeModules.WidgetSync;
    if (!mod?.requestPinWidget) return;
    mod.requestPinWidget(widgetType);
  } catch {
    // Fail silently
  }
}
