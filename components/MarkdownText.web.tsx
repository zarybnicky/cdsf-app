import { StyleSheet, Text } from "react-native";

type MarkdownTextProps = {
  markdown: string;
};

export default function MarkdownText({ markdown }: MarkdownTextProps) {
  return <Text style={styles.fallbackText}>{markdown}</Text>;
}

const styles = StyleSheet.create({
  fallbackText: {
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 23,
  },
});
