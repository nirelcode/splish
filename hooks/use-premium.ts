import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { checkPremium, getOfferings, purchasePackage, restorePurchases } from '@/lib/purchases';
import type { PurchasesPackage } from 'react-native-purchases';

export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);

  const refresh = useCallback(async () => {
    const premium = await checkPremium();
    setIsPremium(premium);
    setLoading(false);
  }, []);

  // Load premium status + offerings on mount
  useEffect(() => {
    refresh();
    getOfferings().then(setPackages);
  }, []);

  // Re-check when app comes back to foreground (e.g. after payment flow)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    const success = await purchasePackage(pkg);
    if (success) setIsPremium(true);
    return success;
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    const success = await restorePurchases();
    if (success) setIsPremium(true);
    return success;
  }, []);

  return { isPremium, loading, packages, purchase, restore, refresh };
}
