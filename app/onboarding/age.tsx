import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import OnboardingLayout from '@/components/onboarding-layout';
import RadioCard from '@/components/radio-card';
import { useWaterStore } from '@/store/useWaterStore';

const OPTIONS = ['13-18', '19-25', '26-40', '40+'];

export default function AgeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>('13-18');
  const setOnboarding = useWaterStore((s) => s.setOnboarding);
  useEffect(() => { router.prefetch('/onboarding/weight'); }, []);

  return (
    <OnboardingLayout
      title="Choose your age"
      onNext={() => { setOnboarding({ age: selected }); router.push('/onboarding/weight'); }}
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
