import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import OnboardingLayout from '@/components/onboarding-layout';
import RadioCard from '@/components/radio-card';
import { useWaterStore } from '@/store/useWaterStore';

const OPTIONS = ['Not very', 'Quite active', 'Very active', 'Super active'];

export default function ActivityScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>('Not very');
  const setOnboarding = useWaterStore((s) => s.setOnboarding);
  useEffect(() => { router.prefetch('/onboarding/weather'); }, []);

  return (
    <OnboardingLayout
      title="How active are you"
      onNext={() => { setOnboarding({ activity: selected }); router.push('/onboarding/weather'); }}
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
