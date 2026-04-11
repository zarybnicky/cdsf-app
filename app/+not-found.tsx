import { Link, Stack } from "expo-router";
import { StyleSheet } from "react-native";

import { Text, View } from "@/components/Themed";
import { getAppEntryHref } from "@/lib/app-routes";
import { useSession } from "@/lib/session";

export default function NotFoundScreen() {
  const { session } = useSession();
  const href = getAppEntryHref(session);

  return (
    <>
      <Stack.Screen options={{ title: "Nenalezeno" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Tuto obrazovku se nepodařilo najít.</Text>

        <Link href={href} style={styles.link}>
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
