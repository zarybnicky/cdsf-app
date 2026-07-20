import { StyleSheet, Switch, Text, View } from "react-native";
import { useAtomValue, useSetAtom } from "jotai";

import {
  notificationPreferencesAtom,
  preferenceMetadata,
  preferenceOrder,
} from "@/lib/notification-preferences";

export default function NotificationPreferencesCard() {
  const preferences = useAtomValue(notificationPreferencesAtom);
  const setPreferences = useSetAtom(notificationPreferencesAtom);

  return (
    <View style={styles.card}>
      {preferenceOrder.map((type, index) => {
        const metadata = preferenceMetadata[type];

        return (
          <View
            key={type}
            style={[
              styles.preferenceRow,
              index < preferenceOrder.length - 1
                ? styles.preferenceRowBorder
                : null,
            ]}
          >
            <View style={styles.preferenceCopy}>
              <Text style={styles.preferenceTitle}>{metadata.label}</Text>
              <Text style={styles.preferenceDescription}>
                {metadata.description}
              </Text>
            </View>
            <Switch
              ios_backgroundColor="#cdd4e0"
              onValueChange={(value) => {
                setPreferences((current) => ({ ...current, [type]: value }));
              }}
              thumbColor="#ffffff"
              trackColor={{ false: "#cfd6e0", true: "#7ea5ee" }}
              value={preferences[type]}
            />
          </View>
        );
      })}

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
