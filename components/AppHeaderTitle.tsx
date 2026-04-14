import type { HeaderTitleProps } from "@react-navigation/elements";
import { StyleSheet, Text, View } from "react-native";

import BrandMark from "@/components/BrandMark";

type AppHeaderTitleProps = HeaderTitleProps & {
  subtitle?: string;
};

function getHeaderTitleText(children: HeaderTitleProps["children"]) {
  return typeof children === "string" ? children : "";
}

export default function AppHeaderTitle({
  children,
  subtitle,
}: AppHeaderTitleProps) {
  const title = getHeaderTitleText(children);

  return (
    <View style={styles.container}>
      <BrandMark size={25} />
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
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
  copy: {
    flexShrink: 1,
  },
  title: {
    color: "#223045",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.15,
    lineHeight: 20,
  },
  subtitle: {
    color: "#6a7788",
    fontSize: 11.5,
    fontWeight: "600",
    lineHeight: 14,
  },
});
