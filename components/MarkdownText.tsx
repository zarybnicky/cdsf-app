import {
  Linking,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";

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
      <EnrichedMarkdownText
        allowTrailingMargin={false}
        containerStyle={styles.container}
        markdown={markdown}
        markdownStyle={markdownStyle}
        onLinkPress={({ url }) => {
          void Linking.openURL(url);
        }}
      />
    </View>
  );
}

const markdownStyle = {
  paragraph: {
    color: "#455264",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 0,
    marginBottom: 8,
  },
  strong: {
    color: "#182334",
    fontWeight: "bold" as const,
  },
  list: {
    color: "#455264",
    fontSize: 14,
    lineHeight: 22,
    bulletColor: "#2457b3",
    bulletSize: 6,
    gapWidth: 9,
    marginBottom: 8,
  },
  link: {
    color: "#2457b3",
    underline: false,
  },
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
