import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import OnboardingLayout from '@/components/onboarding-layout';
import RadioCard from '@/components/radio-card';
import { useWaterStore } from '@/store/useWaterStore';

const OPTIONS = [
  'Boost my energy',
  'Clearer skin',
  'Reach weight goals',
  'Better overall health'
];

export default function GoalScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>('Better overall health');
  const setOnboarding = useWaterStore((s) => s.setOnboarding);
  const mainGoal = useWaterStore((s) => s.mainGoal);

  // Initialize from store if exists
  useEffect(() => {
    if (mainGoal) {
      setSelected(mainGoal);
    }
    router.prefetch('/onboarding/notifications');
  }, []);

  const handleNext = () => {
    if (selected) {
      setOnboarding({ mainGoal: selected });
      router.push('/onboarding/notifications');
    }
  };

  return (
    <OnboardingLayout
      title="What's your main goal?"
      subtitle="this helps me personalize your experience"
      onNext={handleNext}
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
