import { StyleSheet, View } from "react-native";

import MarkdownText from "@/components/MarkdownText";
import { Text } from "@/components/Themed";

export type AnnouncementCardProps = {
  id?: string;
  title: string;
  publishedAt: string;
  markdown: string;
};

export default function AnnouncementCard({
  title,
  publishedAt,
  markdown,
}: AnnouncementCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.accent} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.meta}>{publishedAt}</Text>
      <View style={styles.divider} />
      <MarkdownText markdown={markdown} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: "#15243f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  accent: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 3,
    backgroundColor: "#2457b3",
  },
  title: {
    color: "#182334",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  meta: {
    color: "#2457b3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    marginTop: 7,
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: "#e8edf4",
    marginVertical: 12,
  },
});
