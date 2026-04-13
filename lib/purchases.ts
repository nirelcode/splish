import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';

// ── Bypass flag ───────────────────────────────────────────────────────────────
// Set to true to skip RevenueCat entirely and treat all users as premium.
// Flip to false and add real keys below before releasing to production.
const PURCHASES_ENABLED = false;

// ── Keys ──────────────────────────────────────────────────────────────────────
// Replace these with your real keys from the RevenueCat dashboard.
const API_KEYS = {
  android: 'goog_REPLACE_WITH_REAL_KEY',
  ios:     'appl_REPLACE_WITH_REAL_KEY',
};

// The entitlement identifier you set up in the RevenueCat dashboard
export const PREMIUM_ENTITLEMENT = 'Splish Pro';

// ── Init ──────────────────────────────────────────────────────────────────────
export function initPurchases() {
  if (!PURCHASES_ENABLED) return;
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.ERROR);
  const key = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;
  Purchases.configure({ apiKey: key });
}

// ── Check premium ─────────────────────────────────────────────────────────────
export async function checkPremium(): Promise<boolean> {
  if (!PURCHASES_ENABLED) return true;
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
  } catch {
    return false;
  }
}

// ── Get available packages ────────────────────────────────────────────────────
export async function getOfferings(): Promise<PurchasesPackage[]> {
  if (!PURCHASES_ENABLED) return [];
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  } catch {
    return [];
  }
}

// ── Purchase a package ────────────────────────────────────────────────────────
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  if (!PURCHASES_ENABLED) return true;
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
  } catch (e: any) {
    if (e.userCancelled) return false;
    throw e;
  }
}

// ── Restore purchases ─────────────────────────────────────────────────────────
export async function restorePurchases(): Promise<boolean> {
  if (!PURCHASES_ENABLED) return true;
  try {
    const info = await Purchases.restorePurchases();
    return info.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
  } catch {
    return false;
  }
}
