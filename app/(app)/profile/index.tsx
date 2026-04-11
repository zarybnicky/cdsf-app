import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import ProfileAthleteCard from '@/components/ProfileAthleteCard';
import { Text } from '@/components/Themed';
import { openapiClient } from '@/lib/cdsf-client';
import { useSession } from '@/lib/session';

export default function ProfileScreen() {
  const { authHeaders, session } = useSession();

  const athletesQuery = openapiClient.useQuery(
    'get',
    '/athletes/current',
    {
      headers: authHeaders,
    },
    {
      enabled: !!authHeaders,
    },
  );

  const athletes = athletesQuery.data?.collection || [];

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={athletes}
      keyExtractor={(item) => item.idt.toString()}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.body}>Prihlasen jako {session?.email ?? 'neznamy uzivatel'}</Text>
          <Text style={styles.caption}>Nastaveni a odhlaseni najdete pod ikonou ozubeneho kola.</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.stateCard}>
          {athletesQuery.isLoading ? <ActivityIndicator color="#2f67ce" /> : null}
          <Text style={styles.stateTitle}>
            {athletesQuery.isLoading
              ? 'Nacitam profil'
              : athletesQuery.isError
                ? 'Nepodarilo se nacist profil'
                : 'Zadni sportovci nenalezeni'}
          </Text>
          <Text style={styles.stateBody}>
            {athletesQuery.isLoading
              ? 'Data sportovcu se nacitaji z CDSF API a ulozi se do cache pro offline pouziti.'
              : athletesQuery.isError
                ? 'Zkuste nacitani zopakovat.'
                : 'Jakmile budou k uctu prirazeni sportovci, objevi se tady.'}
          </Text>
          {athletesQuery.isError ? (
            <Pressable
              onPress={() => {
                void athletesQuery.refetch();
              }}
              style={({ pressed }) => [styles.retryButton, pressed ? styles.retryButtonPressed : null]}
            >
              <Text style={styles.retryButtonText}>Zkusit znovu</Text>
            </Pressable>
          ) : null}
        </View>
      }
      renderItem={({ item }) => <ProfileAthleteCard athlete={item} />}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#eef2f7',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  title: {
    color: '#394150',
    fontSize: 28,
    fontWeight: '700',
  },
  body: {
    color: '#525c6b',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  caption: {
    color: '#7a8596',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  stateCard: {
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stateTitle: {
    color: '#394150',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  stateBody: {
    color: '#778091',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#2f67ce',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  retryButtonPressed: {
    opacity: 0.9,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
