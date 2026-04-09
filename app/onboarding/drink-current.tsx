import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import OnboardingLayout from '@/components/onboarding-layout';
import RadioCard from '@/components/radio-card';
import { useWaterStore } from '@/store/useWaterStore';

const OPTIONS = ['Less than 1L', '1 – 1.5L', '1.5 – 2L', 'More than 2L'];

export default function DrinkCurrentScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>('Less than 1L');
  const setOnboarding = useWaterStore((s) => s.setOnboarding);
  useEffect(() => { router.prefetch('/onboarding/goal'); }, []);

  return (
    <OnboardingLayout
      title="How much do you drink daily?"
      subtitle="help me personalize your experience"
      onNext={() => { setOnboarding({ currentDrink: selected }); router.push('/onboarding/goal'); }}
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
