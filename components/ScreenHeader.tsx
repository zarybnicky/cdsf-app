import type { ReactNode } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { Text } from "@/components/Themed";

type ScreenHeaderProps = {
  eyebrow?: string;
  title: string;
  body?: string;
  caption?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  bodyStyle?: StyleProp<TextStyle>;
  captionStyle?: StyleProp<TextStyle>;
};

export default function ScreenHeader({
  eyebrow,
  title,
  body,
  caption,
  children,
  style,
  titleStyle,
  bodyStyle,
  captionStyle,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {body ? <Text style={[styles.body, bodyStyle]}>{body}</Text> : null}
      {caption ? (
        <Text style={[styles.caption, captionStyle]}>{caption}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 2,
  },
  eyebrow: {
    color: "#2457b3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    color: "#182334",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  body: {
    color: "#58667b",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  caption: {
    color: "#6f7a8b",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
});
