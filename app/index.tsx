import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/lib/session';

export default function IndexScreen() {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Redirect href={session ? '/announcements' : '/login'} />
    </>
  );
}
