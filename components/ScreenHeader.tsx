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
    paddingHorizontal: 4,
  },
  title: {
    color: "#394150",
    fontSize: 28,
    fontWeight: "700",
  },
  body: {
    color: "#6f7887",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  caption: {
    color: "#7a8596",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
});
