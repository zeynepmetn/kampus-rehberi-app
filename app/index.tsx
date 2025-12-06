import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { isLoggedIn, student } = useAuth();

  // If not logged in, go to login
  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  // If logged in but no department selected, go to department selection
  if (!student?.department) {
    return <Redirect href="/department-selection" />;
  }

  // Otherwise, go to main tabs
  return <Redirect href="/(tabs)" />;
}

