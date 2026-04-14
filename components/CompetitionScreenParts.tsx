import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";

type CompetitionActionCardProps = {
  body: string;
  title: string;
  onPress: () => void;
};

export function CompetitionActionCard({
  body,
  title,
  onPress,
}: CompetitionActionCardProps) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionBody}>{body}</Text>
    </Pressable>
  );
}

type CompetitionActionLinkProps = {
  title: string;
  onPress: () => void;
};

export function CompetitionActionLink({
  title,
  onPress,
}: CompetitionActionLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionLink,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={styles.actionLinkText}>{title}</Text>
    </Pressable>
  );
}

type CompetitionDetailRowProps = {
  label: string;
  value?: string | null;
};

export function CompetitionDetailRow({
  label,
  value,
}: CompetitionDetailRowProps) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value.trim()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d6e1f1",
    backgroundColor: "#f8fbff",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  actionTitle: {
    color: "#1f4d9a",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  actionBody: {
    color: "#5f7289",
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 4,
  },
  actionLink: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d7e3f3",
    backgroundColor: "#f8fbff",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  actionLinkText: {
    color: "#1f4d9a",
    fontSize: 12,
    fontWeight: "800",
  },
  detailRow: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#edf1f6",
  },
  detailLabel: {
    color: "#728093",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  detailValue: {
    color: "#223045",
    fontSize: 13.5,
    fontWeight: "600",
    lineHeight: 19,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.85,
  },
});
