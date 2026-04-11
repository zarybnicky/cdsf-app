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
      : "K tomuto účtu nejsou přiřazeny žádné údaje";
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
          body={`Přihlášený účet: ${session?.email ?? "neznámý účet"}`}
          bodyStyle={styles.body}
          caption="Nastavení upozornění a odhlášení jsou dostupné v pravém horním rohu."
          captionStyle={styles.caption}
          style={styles.header}
          title="Profil"
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
    backgroundColor: "#eef2f7",
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 14,
  },
  body: {
    color: "#525c6b",
  },
  caption: {
    color: "#7a8596",
  },
  stateCard: {
    borderRadius: 20,
  },
});
