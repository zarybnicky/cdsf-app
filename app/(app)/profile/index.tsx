import { useAtomValue, useSetAtom } from "jotai";
import { SymbolView } from "expo-symbols";
import { Stack } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";

import ListTopShadow from "@/components/ListTopShadow";
import ProfileAthleteCard from "@/components/ProfileAthleteCard";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text, View } from "@/components/Themed";
import { profileAtom } from "@/lib/profile-query";
import { currentSessionAtom, signOutAtom } from "@/lib/session";

export default function ProfileScreen() {
  const { data, isError, isLoading, isRefetching, refetch } =
    useAtomValue(profileAtom);
  const session = useAtomValue(currentSessionAtom);
  const signOut = useSetAtom(signOutAtom);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const athletes = data?.collection ?? [];
  const isRefreshing = isRefetching && !isLoading;
  let stateTitle = "K tomuto účtu nejsou dostupné členské údaje";
  let stateBody = "Jakmile budou údaje k účtu dostupné, zobrazí se zde.";

  if (isLoading) {
    stateTitle = "Načítám profil";
    stateBody = "Profilové údaje se načítají.";
  } else if (isError) {
    stateTitle = "Nepodařilo se načíst profilové údaje";
    stateBody = "Zkuste načtení zopakovat.";
  }

  function refreshProfile() {
    setIsMenuOpen(false);
    void refetch();
  }

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await signOut();
    } finally {
      setIsSubmitting(false);
      setIsMenuOpen(false);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityHint="Otevře nabídku účtu"
              accessibilityLabel="Nabídka účtu"
              accessibilityRole="button"
              onPress={() => setIsMenuOpen((value) => !value)}
              style={({ pressed }) => [
                styles.headerMenuButton,
                pressed ? styles.headerMenuButtonPressed : null,
                isMenuOpen ? styles.headerMenuButtonActive : null,
              ]}
            >
              <SymbolView
                name={{
                  ios: "ellipsis",
                  android: "more_horiz",
                  web: "more_horiz",
                }}
                size={16}
                tintColor="#2457b3"
              />
            </Pressable>
          ),
        }}
      />
      <ListTopShadow />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={athletes}
        keyExtractor={(item) => item.idt.toString()}
        ListEmptyComponent={
          <ScreenStateCard
            body={stateBody}
            isLoading={isLoading}
            onRetry={isError ? refreshProfile : undefined}
            title={stateTitle}
          />
        }
        onScrollBeginDrag={() => setIsMenuOpen(false)}
        onRefresh={refreshProfile}
        renderItem={({ item }) => <ProfileAthleteCard athlete={item} />}
        refreshing={isRefreshing}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
      {isMenuOpen ? (
        <>
          <Pressable onPress={() => setIsMenuOpen(false)} style={styles.menuBackdrop} />
          <View style={styles.headerMenu}>
            <View style={styles.headerMenuSection}>
              <Text style={styles.headerMenuLabel}>Účet</Text>
              <Text style={styles.headerMenuValue}>
                {session?.email ?? "neznámý účet"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={() => void handleLogout()}
              style={({ pressed }) => [
                styles.headerMenuItem,
                styles.headerMenuItemBorder,
                pressed ? styles.headerMenuItemPressed : null,
                isSubmitting ? styles.headerMenuItemDisabled : null,
              ]}
            >
              <Text style={styles.headerMenuText}>
                {isSubmitting ? "Odhlašování…" : "Odhlásit se"}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerMenuButton: {
    marginRight: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dfe6ef",
    backgroundColor: "#f8fbff",
    padding: 7,
  },
  headerMenuButtonActive: {
    backgroundColor: "#eef5ff",
    borderColor: "#bfd0ea",
  },
  headerMenuButtonPressed: {
    opacity: 0.8,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  headerMenu: {
    position: "absolute",
    top: 10,
    right: 12,
    minWidth: 176,
    maxWidth: 248,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    padding: 4,
    shadowColor: "#15243f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
    zIndex: 4,
  },
  headerMenuSection: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 9,
  },
  headerMenuLabel: {
    color: "#6b7889",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  headerMenuValue: {
    color: "#182334",
    fontSize: 13.5,
    fontWeight: "600",
    lineHeight: 19,
    marginTop: 4,
  },
  headerMenuItem: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  headerMenuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#edf1f6",
  },
  headerMenuItemPressed: {
    backgroundColor: "#f6f8fb",
  },
  headerMenuItemDisabled: {
    opacity: 0.6,
  },
  headerMenuText: {
    color: "#182334",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
});
