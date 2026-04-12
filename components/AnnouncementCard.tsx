import type { components } from "@/CDSF";
import { StyleSheet, View } from "react-native";

import MarkdownText from "@/components/MarkdownText";
import { Text } from "@/components/Themed";
import { parseCdsfDate } from "@/lib/cdsf";
import { stripMarkdown } from "@/lib/markdown";

type Notification = components["schemas"]["Notification"];

export type AnnouncementCardProps = {
  id?: string;
  title: string;
  publishedAt: string;
  markdown: string;
};

const weekdayLabels = ["NE", "PO", "ÚT", "ST", "ČT", "PÁ", "SO"];

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatPublishedAt(createdAt: string) {
  const date = parseCdsfDate(createdAt);

  if (!date) {
    return createdAt;
  }

  return `${weekdayLabels[date.getDay()]} ${date.getDate()}.\u2009${date.getMonth() + 1}.\u2009${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function announcementFromNotification(
  notification: Notification,
): AnnouncementCardProps {
  const sections: string[] = [];

  if (notification.message?.trim()) {
    sections.push(notification.message.trim());
  }

  if (notification.author?.trim()) {
    sections.push(`Autor: **${notification.author.trim()}**`);
  }

  if (notification.contact?.trim()) {
    sections.push(
      `Kontakt: [${notification.contact.trim()}](mailto:${notification.contact.trim()})`,
    );
  }

  if (notification.link?.trim()) {
    sections.push(`[Otevřít odkaz](${notification.link.trim()})`);
  }

  return {
    id: notification.id.toString(),
    title: stripMarkdown(notification.caption),
    publishedAt: formatPublishedAt(notification.created),
    markdown: sections.join("\n\n") || stripMarkdown(notification.caption),
  };
}

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
