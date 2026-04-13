import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { useWaterStore } from '@/store/useWaterStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const MESSAGES = [
  { title: 'Time to hydrate! 💧', body: "Don't forget to drink some water." },
  { title: 'Splish reminder 💧', body: 'Your body will thank you later!' },
  { title: 'Stay hydrated! 💧', body: "You're doing great — keep it up." },
  { title: 'Water break 💧', body: 'A sip a day keeps the headaches away.' },
  { title: 'Hydration check 💧', body: 'How are you tracking today?' },
];

const HARD_MODE_DELAY_MS = 10 * 60 * 1000; // 10 minutes

function timeToMinutes(t: { hour: number; minute: number; period: 'AM' | 'PM' }): number {
  let h = t.hour % 12;
  if (t.period === 'PM') h += 12;
  return h * 60 + t.minute;
}

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: newStatus } = await Notifications.requestPermissionsAsync();
  if (newStatus !== 'granted') {
    Alert.alert(
      'Notifications disabled',
      'To receive hydration reminders, enable notifications for Splish in your device Settings.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

async function scheduleNotifications(
  start: { hour: number; minute: number; period: 'AM' | 'PM' },
  end:   { hour: number; minute: number; period: 'AM' | 'PM' },
  count: number,
) {
  if (Platform.OS === 'web') return;
  if (typeof Notifications.cancelAllScheduledNotificationsAsync !== 'function') return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  const granted = await requestPermission();
  if (!granted) return;

  const startMin = timeToMinutes(start);
  const endMin   = timeToMinutes(end);
  const span     = endMin > startMin ? endMin - startMin : 0;
  if (span <= 0 || count <= 0) return;

  const interval = span / count;

  for (let i = 0; i < count; i++) {
    const totalMin = Math.round(startMin + interval * i + interval / 2);
    const hour   = Math.floor(totalMin / 60) % 24;
    const minute = totalMin % 60;
    const msg = MESSAGES[i % MESSAGES.length];

    await Notifications.scheduleNotificationAsync({
      content: { title: msg.title, body: msg.body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

export function useScheduleNotifications() {
  const notifStart = useWaterStore((s) => s.notifStart);
  const notifEnd   = useWaterStore((s) => s.notifEnd);
  const notifCount = useWaterStore((s) => s.notifCount);
  const onboardingDone = useWaterStore((s) => s.onboardingDone);

  useEffect(() => {
    if (!onboardingDone) return;
    scheduleNotifications(notifStart, notifEnd, notifCount);
  }, [onboardingDone, notifStart, notifEnd, notifCount]);
}

// ── Hard Mode: listen for notifications, start 10-min timer ──────────────────
export function useHardModeNotificationListener() {
  const hardMode = useWaterStore((s) => s.hardMode ?? false);
  const triggerHardModePending = useWaterStore((s) => s.triggerHardModePending);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hardMode) return;

    // Fires when a notification is received while app is in foreground
    const foregroundSub = Notifications.addNotificationReceivedListener(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // If still no drink logged after 10 min, activate hard mode lock
        triggerHardModePending();
      }, HARD_MODE_DELAY_MS);
    });

    // Fires when user taps a notification (app was in background)
    const responseSub = Notifications.addNotificationResponseReceivedListener(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        triggerHardModePending();
      }, HARD_MODE_DELAY_MS);
    });

    return () => {
      foregroundSub.remove();
      responseSub.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hardMode, triggerHardModePending]);
}
