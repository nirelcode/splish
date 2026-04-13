import { Platform } from 'react-native';

// Lazy-load so it's a no-op on iOS / web
let mod: { startLock: () => void; stopLock: () => void; canDrawOverlays: () => Promise<boolean> } | null = null;

function getModule() {
  if (mod) return mod;
  if (Platform.OS !== 'android') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireNativeModule } = require('expo-modules-core');
    mod = requireNativeModule('HardMode');
    return mod;
  } catch {
    return null;
  }
}

/**
 * Show the Hard Mode lock overlay above all other apps.
 * Android only — requires SYSTEM_ALERT_WINDOW permission.
 * Safe no-op on iOS / web or if permission not granted.
 */
export function startHardModeLock(): void {
  try { getModule()?.startLock(); } catch { /* safe no-op */ }
}

/** Dismiss the overlay once the drink has been verified. */
export function stopHardModeLock(): void {
  try { getModule()?.stopLock(); } catch { /* safe no-op */ }
}

/** Check if the user has granted the overlay ("Display over other apps") permission. */
export async function canDrawOverlays(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try { return (await getModule()?.canDrawOverlays()) ?? false; } catch { return false; }
}

/** Check if the user has granted Usage Access permission. */
export async function canAccessUsageStats(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try { return (await getModule()?.canAccessUsageStats()) ?? false; } catch { return false; }
}
