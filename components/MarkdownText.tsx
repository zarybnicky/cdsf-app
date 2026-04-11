import { Linking, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';

type MarkdownTextProps = {
  markdown: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function MarkdownText({ markdown, containerStyle }: MarkdownTextProps) {
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
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 0,
    marginBottom: 10,
  },
  strong: {
    color: '#1f2937',
    fontWeight: 'bold' as const,
  },
  list: {
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 23,
    bulletColor: '#356ed6',
    bulletSize: 6,
    gapWidth: 10,
    marginBottom: 10,
  },
  link: {
    color: '#356ed6',
    underline: false,
  },
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
