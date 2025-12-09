import { Redirect } from 'expo-router';
import { useUserStore } from '../src/core/store';

export default function Index() {
  const { hasCompletedOnboarding } = useUserStore();

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding/welcome" />;
  }

  return <Redirect href="/start" />;
}
