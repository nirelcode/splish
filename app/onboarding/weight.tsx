import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import OnboardingLayout from '@/components/onboarding-layout';
import RadioCard from '@/components/radio-card';
import { useWaterStore } from '@/store/useWaterStore';

const OPTIONS = ['Under 60 kg', '60 – 75 kg', '75 – 90 kg', '90 kg +'];
const WEIGHT_MAP: Record<string, number> = {
  'Under 60 kg': 55,
  '60 – 75 kg': 67,
  '75 – 90 kg': 82,
  '90 kg +': 100,
};

export default function WeightScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>('60 – 75 kg');
  const setOnboarding = useWaterStore((s) => s.setOnboarding);
  useEffect(() => { router.prefetch('/onboarding/activity'); }, []);

  return (
    <OnboardingLayout
      title="What is your weight?"
      onNext={() => { setOnboarding({ weightKg: WEIGHT_MAP[selected!] }); router.push('/onboarding/activity'); }}
      nextDisabled={!selected}
    >
      {OPTIONS.map((opt) => (
        <RadioCard
          key={opt}
          label={opt}
          selected={selected === opt}
          onPress={() => setSelected(opt)}
        />
      ))}
    </OnboardingLayout>
  );
}
