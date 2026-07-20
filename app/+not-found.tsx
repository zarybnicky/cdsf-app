import { useAtomValue } from "jotai";
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { sessionStateAtom } from "@/lib/session";

export default function NotFoundScreen() {
  const session = useAtomValue(sessionStateAtom);
  const homeHref = session ? "/dashboard" : "/login";

  return (
    <>
      <Stack.Screen options={{ title: "Nenalezeno" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Tuto obrazovku se nepodařilo najít.</Text>

        <Link href={homeHref} style={styles.link}>
          <Text style={styles.linkText}>Přejít na úvod</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#2e78b7",
  },
});
