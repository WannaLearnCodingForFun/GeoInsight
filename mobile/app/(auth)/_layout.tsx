import { Stack, router } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/src/auth/auth-provider';

export default function AuthLayout() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

