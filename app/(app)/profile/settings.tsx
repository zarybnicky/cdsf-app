import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import ScreenHeader from "@/components/ScreenHeader";
import { Text } from "@/components/Themed";
import {
  notificationPreferenceMetadata,
  notificationPreferenceOrder,
  type NotificationType,
} from "@/lib/notification-preferences";
import { useNotificationPreferences } from "@/lib/notification-preferences-provider";
import { clearQueryCache } from "@/lib/react-query";
import { useSession } from "@/lib/session";

type NotificationPreferenceRowProps = {
  type: NotificationType;
  enabled: boolean;
  isLastRow: boolean;
  onValueChange: (value: boolean) => void;
};

function NotificationPreferenceRow({
  type,
  enabled,
  isLastRow,
  onValueChange,
}: NotificationPreferenceRowProps) {
  const metadata = notificationPreferenceMetadata[type];

  return (
    <View
      style={[
        styles.preferenceRow,
        !isLastRow ? styles.preferenceRowBorder : null,
      ]}
    >
      <View style={styles.preferenceCopy}>
        <Text style={styles.preferenceTitle}>{metadata.label}</Text>
        <Text style={styles.preferenceDescription}>{metadata.description}</Text>
      </View>
      <Switch
        ios_backgroundColor="#cdd4e0"
        onValueChange={onValueChange}
        trackColor={{ false: "#cdd4e0", true: "#8eb6ff" }}
        value={enabled}
      />
    </View>
  );
}

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
      <ScreenHeader
        body="Nastavte, která upozornění chcete zobrazovat v části Aktuality."
        eyebrow="Správa účtu"
        style={styles.header}
        title="Nastavení"
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Filtry upozornění</Text>
        <Text style={styles.cardBody}>
          Nastavení určuje, která sdělení se vám budou zobrazovat v části
          Aktuality.
        </Text>

        {areNotificationPreferencesLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#2f67ce" />
            <Text style={styles.loadingText}>Načítám nastavení upozornění</Text>
          </View>
        ) : (
          notificationPreferenceOrder.map((type, index) => (
            <NotificationPreferenceRow
              key={type}
              enabled={notificationPreferences[type]}
              isLastRow={index === notificationPreferenceOrder.length - 1}
              onValueChange={(value) => {
                setPreference(type, value);
              }}
              type={type}
            />
          ))
        )}

        <Text style={styles.preferenceHint}>
          Důležitá oznámení zůstávají viditelná vždy.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Odhlášení</Text>
        <Text style={styles.cardBody}>
          Odhlášením ukončíte přístup k aplikaci na tomto zařízení.
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
          <Text style={styles.buttonText}>
            {isSubmitting ? "Odhlašování..." : "Odhlásit se"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 10,
  },
  card: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#15243f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  cardTitle: {
    color: "#223045",
    fontSize: 17,
    fontWeight: "800",
  },
  cardBody: {
    color: "#627082",
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 6,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  loadingText: {
    color: "#6a7586",
    fontSize: 13,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 14,
    paddingBottom: 14,
  },
  preferenceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#edf1f6",
  },
  preferenceCopy: {
    flex: 1,
  },
  preferenceTitle: {
    color: "#223045",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  preferenceDescription: {
    color: "#677487",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  preferenceHint: {
    color: "#6f7b8d",
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  button: {
    marginTop: 20,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#b42318",
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
});
