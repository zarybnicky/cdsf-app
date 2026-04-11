import { StyleSheet, View } from 'react-native';

import MarkdownText from '@/components/MarkdownText';
import { Text } from '@/components/Themed';

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
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#b8c2d1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 22,
    elevation: 3,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#2f67ce',
  },
  title: {
    color: '#2f67ce',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    paddingLeft: 4,
  },
  meta: {
    color: '#7f8898',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 8,
    paddingLeft: 4,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#ebeff5',
    marginVertical: 14,
  },
});
