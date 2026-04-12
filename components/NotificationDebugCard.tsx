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
  getAnnouncementsNotificationDebugSnapshotAsync,
  replayLatestAnnouncementThroughBackgroundTaskForTestingAsync,
  requestAnnouncementsNotificationPermissionsAsync,
  scheduleSampleAnnouncementsNotificationAsync,
  triggerAnnouncementsBackgroundTaskForTestingAsync,
  type AnnouncementsNotificationDebugSnapshot,
} from "@/lib/notification-runtime";
import { useSession } from "@/lib/session";

const defaultStatus: AnnouncementsNotificationDebugSnapshot = {
  backgroundStatusLabel: "Načítám",
  canAskAgain: false,
  notificationsAllowed: false,
  permissionStatusLabel: "Načítám",
  platform: Platform.OS,
  seenCount: 0,
  taskManagerAvailable: false,
  taskRegistered: false,
};

type ActionState = "idle" | "loading";

type DebugActionButtonProps = {
  actionState: ActionState;
  label: string;
  onPress: () => void;
};

function DebugActionButton({
  actionState,
  label,
  onPress,
}: DebugActionButtonProps) {
  return (
    <Pressable
      disabled={actionState === "loading"}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        pressed ? styles.actionButtonPressed : null,
        actionState === "loading" ? styles.actionButtonDisabled : null,
      ]}
    >
      {actionState === "loading" ? (
        <ActivityIndicator color="#2457b3" size="small" />
      ) : (
        <Text style={styles.actionButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

type StatusRowProps = {
  label: string;
  value: string;
};

function StatusRow({ label, value }: StatusRowProps) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
}

export default function NotificationDebugCard() {
  const { session } = useSession();
  const [snapshot, setSnapshot] =
    useState<AnnouncementsNotificationDebugSnapshot>(defaultStatus);
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadSnapshot() {
      const nextSnapshot = await getAnnouncementsNotificationDebugSnapshotAsync(
        session?.email,
      );

      if (!isCancelled) {
        setSnapshot(nextSnapshot);
      }
    }

    void loadSnapshot();

    return () => {
      isCancelled = true;
    };
  }, [session?.email]);

  async function refreshSnapshot() {
    setSnapshot(
      await getAnnouncementsNotificationDebugSnapshotAsync(session?.email),
    );
  }

  async function runAction(
    action: () => Promise<boolean>,
    successMessage: string,
  ) {
    setActionState("loading");
    setFeedback(null);

    try {
      const result = await action();
      setFeedback(result ? successMessage : "Akce zde není k dispozici.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Akci se nepodařilo dokončit.",
      );
    } finally {
      setActionState("idle");
      await refreshSnapshot();
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Vývojářské testování</Text>
          <Text style={styles.body}>
            Ověření oprávnění, místních oznámení a běhu úlohy na pozadí.
          </Text>
        </View>
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
        <StatusRow label="Platforma" value={snapshot.platform} />
        <StatusRow label="Oprávnění" value={snapshot.permissionStatusLabel} />
        <StatusRow
          label="Lze znovu požádat"
          value={snapshot.canAskAgain ? "Ano" : "Ne"}
        />
        <StatusRow
          label="Lokální oznámení"
          value={snapshot.notificationsAllowed ? "Povolena" : "Nepovolena"}
        />
        <StatusRow
          label="Task Manager"
          value={snapshot.taskManagerAvailable ? "Dostupný" : "Nedostupný"}
        />
        <StatusRow
          label="Úloha na pozadí"
          value={snapshot.backgroundStatusLabel}
        />
        <StatusRow
          label="Úloha registrována"
          value={snapshot.taskRegistered ? "Ano" : "Ne"}
        />
        <StatusRow label="Seen ID" value={snapshot.seenCount.toString()} />
      </View>

      <View style={styles.actions}>
        <DebugActionButton
          actionState={actionState}
          label="Požádat o oprávnění"
          onPress={() => {
            void runAction(
              requestAnnouncementsNotificationPermissionsAsync,
              "Oprávnění byla zkontrolována.",
            );
          }}
        />
        <DebugActionButton
          actionState={actionState}
          label="Spustit worker"
          onPress={() => {
            void runAction(
              triggerAnnouncementsBackgroundTaskForTestingAsync,
              "Worker byl spuštěn.",
            );
          }}
        />
        <DebugActionButton
          actionState={actionState}
          label="Znovu oznámit poslední"
          onPress={() => {
            void runAction(
              replayLatestAnnouncementThroughBackgroundTaskForTestingAsync,
              "Poslední oznámení bylo znovu připraveno a worker byl spuštěn.",
            );
          }}
        />
        <DebugActionButton
          actionState={actionState}
          label="Poslat testovací oznámení"
          onPress={() => {
            void runAction(
              scheduleSampleAnnouncementsNotificationAsync,
              "Testovací oznámení bylo odesláno.",
            );
          }}
        />
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
  headerCopy: {
    flex: 1,
  },
  title: {
    color: "#223045",
    fontSize: 15,
    fontWeight: "800",
  },
  body: {
    color: "#647286",
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 4,
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
