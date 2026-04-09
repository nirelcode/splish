import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import OnboardingLayout from '@/components/onboarding-layout';
import RadioCard from '@/components/radio-card';
import { useWaterStore } from '@/store/useWaterStore';

const OPTIONS = ['Hot', 'Chill', 'Cold', 'Varies'];

export default function WeatherScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>('Hot');
  const setOnboarding = useWaterStore((s) => s.setOnboarding);
  useEffect(() => { router.prefetch('/onboarding/drink-current'); }, []);

  return (
    <OnboardingLayout
      title="What's the climate like?"
      onNext={() => { setOnboarding({ climate: selected }); router.push('/onboarding/drink-current'); }}
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
