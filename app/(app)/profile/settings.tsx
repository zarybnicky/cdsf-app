import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { clearQueryCache } from '@/lib/react-query';
import { useSession } from '@/lib/session';

export default function SettingsScreen() {
  const { signOut } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await clearQueryCache();
      await signOut();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.body}>
        Logging out clears the secure session and wipes the persisted React Query cache.
      </Text>

      <Pressable
        disabled={isSubmitting}
        onPress={() => {
          void handleLogout();
        }}
        style={({ pressed }) => [
          styles.button,
          pressed ? styles.buttonPressed : null,
          isSubmitting ? styles.buttonDisabled : null,
        ]}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Logging out...' : 'Log out'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 12,
    fontSize: 28,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  button: {
    marginTop: 24,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#b42318',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
