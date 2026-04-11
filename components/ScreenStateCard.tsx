import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Text } from "@/components/Themed";

type ScreenStateCardProps = {
  title: string;
  body: string;
  isLoading?: boolean;
  onRetry?: () => void;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export default function ScreenStateCard({
  title,
  body,
  isLoading = false,
  onRetry,
  retryLabel = "Načíst znovu",
  style,
}: ScreenStateCardProps) {
  return (
    <View style={[styles.card, style]}>
      {isLoading ? <ActivityIndicator color="#2f67ce" /> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.button,
            pressed ? styles.buttonPressed : null,
          ]}
        >
          <Text style={styles.buttonText}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: "#15243f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  title: {
    color: "#223045",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 10,
    textAlign: "center",
  },
  body: {
    color: "#6a7586",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
  button: {
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: "#2457b3",
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
});
