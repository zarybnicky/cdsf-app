import { FlatList, StyleSheet } from "react-native";

import ProfileAthleteCard from "@/components/ProfileAthleteCard";
import ScreenHeader from "@/components/ScreenHeader";
import ScreenStateCard from "@/components/ScreenStateCard";
import { openapiClient } from "@/lib/cdsf-client";
import { useSession } from "@/lib/session";

export default function ProfileScreen() {
  const { authHeaders, session } = useSession();

  const athletesQuery = openapiClient.useQuery(
    "get",
    "/athletes/current",
    {
      headers: authHeaders,
    },
    {
      enabled: !!authHeaders,
    },
  );

  const athletes = athletesQuery.data?.collection || [];
  const stateTitle = athletesQuery.isLoading
    ? "Načítám profil"
    : athletesQuery.isError
      ? "Nepodařilo se načíst profilové údaje"
      : "K tomuto účtu nejsou dostupné členské údaje";
  const stateBody = athletesQuery.isLoading
    ? "Profilové údaje se načítají."
    : athletesQuery.isError
      ? "Zkuste načtení zopakovat."
      : "Jakmile budou údaje k účtu dostupné, zobrazí se zde.";

  function handleRetry() {
    void athletesQuery.refetch();
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={athletes}
      keyExtractor={(item) => item.idt.toString()}
      ListHeaderComponent={
        <ScreenHeader
          body={`Účet: ${session?.email ?? "neznámý účet"}`}
          bodyStyle={styles.body}
          caption="Nastavení upozornění a odhlášení najdete v pravém horním rohu."
          captionStyle={styles.caption}
          eyebrow="Osobní údaje a účet"
          style={styles.header}
          title="Členské údaje"
        />
      }
      ListEmptyComponent={
        <ScreenStateCard
          body={stateBody}
          isLoading={athletesQuery.isLoading}
          onRetry={athletesQuery.isError ? handleRetry : undefined}
          style={styles.stateCard}
          title={stateTitle}
        />
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
    backgroundColor: "#f4f6f8",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 10,
  },
  body: {
    color: "#223045",
    fontWeight: "600",
  },
  caption: {
    color: "#687588",
  },
  stateCard: {
    borderRadius: 16,
  },
});
