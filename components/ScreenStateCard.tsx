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
    borderRadius: 18,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    color: "#394150",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  body: {
    color: "#778091",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: "center",
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: "#2f67ce",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
