import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import OnboardingLayout from '@/components/onboarding-layout';
import RadioCard from '@/components/radio-card';
import { useWaterStore } from '@/store/useWaterStore';

const OPTIONS = ['Male', 'Female', 'Others', 'Prefer not to say'];

export default function GenderScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>('Male');
  const setOnboarding = useWaterStore((s) => s.setOnboarding);
  useEffect(() => { router.prefetch('/onboarding/age'); }, []);

  return (
    <OnboardingLayout
      title="How do you identify?"
      onNext={() => { setOnboarding({ gender: selected }); router.push('/onboarding/age'); }}
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
