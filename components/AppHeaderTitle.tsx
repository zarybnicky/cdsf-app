import type { HeaderTitleProps } from "@react-navigation/elements";
import { StyleSheet, Text, View } from "react-native";

import BrandMark from "@/components/BrandMark";

function getHeaderTitleText(children: HeaderTitleProps["children"]) {
  return typeof children === "string" ? children : "";
}

export default function AppHeaderTitle({ children }: HeaderTitleProps) {
  const title = getHeaderTitleText(children);

  return (
    <View style={styles.container}>
      <BrandMark size={25} />
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
  },
  title: {
    flexShrink: 1,
    color: "#223045",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
