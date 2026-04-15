import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useAtomValue, useSetAtom } from "jotai";

import { Text } from "@/components/Themed";
import {
  defaultPreferences,
  notificationPreferencesStateAtom,
  preferenceMetadata,
  preferenceOrder,
  setNotificationPreferenceAtom,
  type NotificationType,
} from "@/lib/notification-preferences";

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
  const metadata = preferenceMetadata[type];

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
  const preferencesState = useAtomValue(notificationPreferencesStateAtom);
  const setPreference = useSetAtom(setNotificationPreferenceAtom);
  const isPreferencesLoading = preferencesState === undefined;
  const preferences = preferencesState ?? defaultPreferences;

  return (
    <View style={[styles.card, style]}>
      {isPreferencesLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#2f67ce" />
          <Text style={styles.loadingText}>Načítám nastavení upozornění</Text>
        </View>
      ) : (
        preferenceOrder.map((type, index) => (
          <NotificationPreferenceRow
            key={type}
            enabled={preferences[type]}
            isLastRow={index === preferenceOrder.length - 1}
            onValueChange={(value) => {
              void setPreference({ enabled: value, type });
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
