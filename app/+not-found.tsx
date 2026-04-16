import { useAtomValue } from "jotai";
import { Link, Stack } from "expo-router";
import { StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { currentSessionAtom } from "@/lib/session";

export default function NotFoundScreen() {
  const session = useAtomValue(currentSessionAtom);
  const homeHref = session ? "/feed" : "/login";

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
