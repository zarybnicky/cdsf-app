import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type MarkdownTextProps = {
  markdown: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function MarkdownText({
  markdown,
  containerStyle,
}: MarkdownTextProps) {
  return (
    <View style={containerStyle}>
      <Text style={styles.fallbackText}>{markdown}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackText: {
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 23,
  },
});
