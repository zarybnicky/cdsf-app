import { useSetAtom } from "jotai";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";

import BrandBanner from "@/components/BrandBanner";
import { Text, View } from "@/components/Themed";
import { signInAtom } from "@/lib/session";

export default function LoginScreen() {
  const signIn = useSetAtom(signInAtom);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Zadejte e-mailovou adresu i heslo.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await signIn({ email: normalizedEmail, password });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Přihlášení se nepodařilo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <BrandBanner style={styles.banner} subtitle="#tanciscsts" />

          <View style={styles.card}>
            <Text style={styles.eyebrow}>Členský účet</Text>
            <Text style={styles.title}>Přihlášení</Text>
            <Text style={styles.body}>
              Přihlaste se e-mailovou adresou a heslem ke svému účtu.
            </Text>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="jmeno@priklad.cz"
                  placeholderTextColor="#8894a7"
                  style={styles.input}
                  value={email}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Heslo</Text>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="password"
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#8894a7"
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                disabled={isSubmitting}
                onPress={() => void handleLogin()}
                style={({ pressed }) => [
                  styles.button,
                  pressed ? styles.buttonPressed : null,
                  isSubmitting ? styles.buttonDisabled : null,
                ]}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? "Přihlašování..." : "Přihlásit se"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: "#e6ebf0",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    backgroundColor: "transparent",
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  banner: {
    borderRadius: 22,
  },
  eyebrow: {
    color: "#2457b3",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  card: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d8dee7",
    backgroundColor: "#fff",
    padding: 22,
    shadowColor: "#14233c",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 4,
  },
  title: {
    color: "#151d2a",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginTop: 8,
  },
  body: {
    color: "#59667a",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  form: {
    marginTop: 18,
    gap: 15,
  },
  field: {
    gap: 7,
  },
  label: {
    color: "#253042",
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cad3df",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#11181c",
    backgroundColor: "#fbfcfe",
  },
  error: {
    borderRadius: 10,
    backgroundColor: "#fff3f0",
    color: "#b42318",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    marginTop: 6,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#2457b3",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
});
