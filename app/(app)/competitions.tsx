import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function CompetitionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Competitions</Text>
      <Text style={styles.body}>
        Competition listings, deadlines, and participation details will live on this tab.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 12,
    fontSize: 28,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
});
