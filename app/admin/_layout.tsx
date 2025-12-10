import { useAuth } from '@/context/AuthContext';
import { Stack, router } from 'expo-router';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { isLoggedIn, isAdmin } = useAuth();

  useEffect(() => {
    // Redirect if not admin
    if (!isLoggedIn || !isAdmin) {
      router.replace('/login');
    }
  }, [isLoggedIn, isAdmin]);

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="departments" />
      <Stack.Screen name="students" />
      <Stack.Screen name="courses" />
      <Stack.Screen name="schedules" />
      <Stack.Screen name="exams" />
    </Stack>
  );
}

