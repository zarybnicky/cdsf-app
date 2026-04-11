import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { Text } from '@/components/Themed';
import {
  notificationPreferenceMetadata,
  notificationPreferenceOrder,
} from '@/lib/notification-preferences';
import { useNotificationPreferences } from '@/lib/notification-preferences-provider';
import { clearQueryCache } from '@/lib/react-query';
import { useSession } from '@/lib/session';

export default function SettingsScreen() {
  const { signOut } = useSession();
  const {
    isLoading: areNotificationPreferencesLoading,
    preferences: notificationPreferences,
    setPreference,
  } = useNotificationPreferences();
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
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nastaveni</Text>
        <Text style={styles.body}>
          Vyberte, ktere typy upozorneni zustanou viditelne v Aktualitach.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Filtry upozorneni</Text>
        <Text style={styles.cardBody}>
          Tohle nastaveni se uklada lokalne a bude se dat znovu pouzit i pro pozdejsi lokalni
          notifikace na pozadi.
        </Text>

        {areNotificationPreferencesLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#2f67ce" />
            <Text style={styles.loadingText}>Nacitam filtry upozorneni</Text>
          </View>
        ) : (
          notificationPreferenceOrder.map((type, index) => {
            const metadata = notificationPreferenceMetadata[type];
            const isEnabled = notificationPreferences[type];
            const isLastRow = index === notificationPreferenceOrder.length - 1;

            return (
              <View
                key={type}
                style={[styles.preferenceRow, !isLastRow ? styles.preferenceRowBorder : null]}
              >
                <View style={styles.preferenceCopy}>
                  <Text style={styles.preferenceTitle}>{metadata.label}</Text>
                  <Text style={styles.preferenceDescription}>{metadata.description}</Text>
                </View>
                <Switch
                  ios_backgroundColor="#cdd4e0"
                  onValueChange={(value) => {
                    setPreference(type, value);
                  }}
                  trackColor={{ false: '#cdd4e0', true: '#8eb6ff' }}
                  value={isEnabled}
                />
              </View>
            );
          })
        )}

        <Text style={styles.preferenceHint}>
          Oznameni s priznakem override muting zustanou zobrazena vzdy.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Odhlaseni</Text>
        <Text style={styles.cardBody}>
          Odhlaseni smaze ulozenou session a vycisti perzistentni React Query cache.
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
          <Text style={styles.buttonText}>{isSubmitting ? 'Odhlasuji...' : 'Odhlasit'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f7',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    color: '#394150',
    fontSize: 28,
    fontWeight: '700',
  },
  body: {
    color: '#6f7887',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  card: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: '#b8c2d1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 2,
  },
  cardTitle: {
    color: '#394150',
    fontSize: 18,
    fontWeight: '700',
  },
  cardBody: {
    color: '#778091',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  loadingText: {
    color: '#6f7887',
    fontSize: 14,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 18,
    paddingBottom: 18,
  },
  preferenceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#ebeff5',
  },
  preferenceCopy: {
    flex: 1,
  },
  preferenceTitle: {
    color: '#394150',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  preferenceDescription: {
    color: '#778091',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  preferenceHint: {
    color: '#7f8898',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
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
