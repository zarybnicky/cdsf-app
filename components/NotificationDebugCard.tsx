import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { Text } from "@/components/Themed";
import {
  getDebugSnapshot,
  replayLatestForTest,
  runWorkerForTest,
  type DebugSnapshot,
} from "@/lib/notification-runtime";

const emptySnapshot: DebugSnapshot = {
  announcementLatestMs: null,
  announcementLatestIds: 0,
  bgStatus: "Načítám",
  canAskAgain: false,
  allowed: false,
  permissionStatus: "Načítám",
  platform: Platform.OS,
  resultsSeenCount: 0,
  taskManager: false,
  registered: false,
};

function formatAnnouncementHead(createdMs: number | null) {
  if (createdMs === null) {
    return "Žádný";
  }

  const date = new Date(createdMs);

  return Number.isNaN(date.getTime()) ? createdMs.toString() : date.toISOString();
}

export default function NotificationDebugCard() {
  const [snapshot, setSnapshot] = useState<DebugSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const rows = [
    ["Platforma", snapshot.platform],
    ["Oprávnění", snapshot.permissionStatus],
    ["Lze znovu požádat", snapshot.canAskAgain ? "Ano" : "Ne"],
    ["Lokální oznámení", snapshot.allowed ? "Povolena" : "Nepovolena"],
    ["Task Manager", snapshot.taskManager ? "Dostupný" : "Nedostupný"],
    ["Úloha na pozadí", snapshot.bgStatus],
    ["Úloha registrována", snapshot.registered ? "Ano" : "Ne"],
    ["Head aktuality", formatAnnouncementHead(snapshot.announcementLatestMs)],
    ["ID v headu", snapshot.announcementLatestIds.toString()],
    ["Seen výsledky", snapshot.resultsSeenCount.toString()],
  ] as const;
  async function refreshSnapshot() {
    setSnapshot(await getDebugSnapshot());
  }

  useEffect(() => {
    void refreshSnapshot();
  }, []);

  async function runAction(
    action: () => Promise<boolean>,
    successMessage: string,
  ) {
    setLoading(true);
    setFeedback(null);

    try {
      const result = await action();
      setFeedback(result ? successMessage : "Akce zde není k dispozici.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Akci se nepodařilo dokončit.",
      );
    } finally {
      setLoading(false);
      await refreshSnapshot();
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Vývojářské testování</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void refreshSnapshot();
          }}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed ? styles.refreshButtonPressed : null,
          ]}
        >
          <Text style={styles.refreshButtonText}>Obnovit</Text>
        </Pressable>
      </View>

      <View style={styles.statusCard}>
        {rows.map(([label, value], index) => (
          <View
            key={label}
            style={[
              styles.statusRow,
              index < rows.length - 1 ? styles.statusRowBorder : null,
            ]}
          >
            <Text style={styles.statusLabel}>{label}</Text>
            <Text style={styles.statusValue}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          disabled={loading}
          onPress={() => {
            void runAction(runWorkerForTest, "Worker byl spuštěn.");
          }}
          style={({ pressed }) => [
            styles.actionButton,
            pressed ? styles.actionButtonPressed : null,
            loading ? styles.actionButtonDisabled : null,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#2457b3" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>Spustit worker</Text>
          )}
        </Pressable>

        <Pressable
          disabled={loading}
          onPress={() => {
            void runAction(
              replayLatestForTest,
              "Poslední oznámení bylo znovu připraveno a worker byl spuštěn.",
            );
          }}
          style={({ pressed }) => [
            styles.actionButton,
            pressed ? styles.actionButtonPressed : null,
            loading ? styles.actionButtonDisabled : null,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#2457b3" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>Znovu oznámit poslední</Text>
          )}
        </Pressable>
      </View>

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
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
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: "#223045",
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
  },
  refreshButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dfe6ef",
    backgroundColor: "#f8fbff",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  refreshButtonPressed: {
    opacity: 0.8,
  },
  refreshButtonText: {
    color: "#2457b3",
    fontSize: 12,
    fontWeight: "700",
  },
  statusCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6ebf2",
    backgroundColor: "#fbfcfe",
    overflow: "hidden",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statusRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#edf1f6",
  },
  statusLabel: {
    color: "#6c7889",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  statusValue: {
    color: "#182334",
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: "600",
    lineHeight: 17,
    textAlign: "right",
  },
  actions: {
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d7e2f1",
    backgroundColor: "#f8fbff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonPressed: {
    opacity: 0.84,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: "#2457b3",
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: "700",
    lineHeight: 17,
    textAlign: "center",
  },
  feedback: {
    color: "#627082",
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 12,
  },
});
