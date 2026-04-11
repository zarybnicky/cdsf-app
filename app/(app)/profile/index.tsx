import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useSession } from '@/lib/session';

export default function ProfileScreen() {
  const { session } = useSession();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.body}>Signed in as {session}</Text>
      <Text style={styles.caption}>Use the cog in the header to open Settings.</Text>
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
    opacity: 0.85,
  },
  caption: {
    marginTop: 10,
    fontSize: 14,
    opacity: 0.65,
  },
});
