import {
  Linking,
  StyleSheet,
} from "react-native";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";

const allowedLinkPattern = /^(https?:|mailto:|tel:)/i;

type MarkdownTextProps = {
  markdown: string;
};

export default function MarkdownText({ markdown }: MarkdownTextProps) {
  return (
    <EnrichedMarkdownText
      allowTrailingMargin={false}
      containerStyle={styles.container}
      markdown={markdown}
      markdownStyle={markdownStyle}
      onLinkPress={({ url }) => {
        if (allowedLinkPattern.test(url)) {
          void Linking.openURL(url);
        }
      }}
    />
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
