import { Text as DefaultText, View as DefaultView } from "react-native";

import { useColorScheme } from "./useColorScheme";

import Colors from "@/constants/Colors";

export type TextProps = DefaultText["props"];
export type ViewProps = DefaultView["props"];

function useThemeColor(
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  return Colors[useColorScheme()][colorName];
}

export function Text(props: TextProps) {
  const { style, ...otherProps } = props;
  const color = useThemeColor("text");

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeColor("background");

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
