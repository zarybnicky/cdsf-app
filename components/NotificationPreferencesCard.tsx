import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Text } from "@/components/Themed";
import {
  notificationPreferenceMetadata,
  notificationPreferenceOrder,
  type NotificationType,
} from "@/lib/notification-preferences";
import { useNotificationPreferences } from "@/lib/notification-preferences-provider";

type NotificationPreferenceRowProps = {
  type: NotificationType;
  enabled: boolean;
  isLastRow: boolean;
  onValueChange: (value: boolean) => void;
};

type NotificationPreferencesCardProps = {
  style?: StyleProp<ViewStyle>;
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
        thumbColor="#ffffff"
        trackColor={{ false: "#cfd6e0", true: "#7ea5ee" }}
        value={enabled}
      />
    </View>
  );
}

export default function NotificationPreferencesCard({
  style,
}: NotificationPreferencesCardProps) {
  const {
    isLoading: areNotificationPreferencesLoading,
    preferences: notificationPreferences,
    setPreference,
  } = useNotificationPreferences();

  return (
    <View style={[styles.card, style]}>
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
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: "#15243f",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.035,
    shadowRadius: 12,
    elevation: 1,
  },
  cardTitle: {
    color: "#223045",
    fontSize: 16,
    fontWeight: "800",
  },
  cardBody: {
    color: "#627082",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  loadingText: {
    color: "#6a7586",
    fontSize: 12.5,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    paddingBottom: 12,
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
    fontSize: 14.5,
    fontWeight: "700",
    lineHeight: 19,
  },
  preferenceDescription: {
    color: "#677487",
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 3,
  },
  preferenceHint: {
    color: "#6f7b8d",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 0,
  },
});
