import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import type { HeaderTitleProps } from "@react-navigation/elements";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { ImageBackground, StyleSheet, Text, View } from "react-native";

import BrandMark from "@/components/BrandMark";

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#f4f7fb",
    overflow: "hidden",
  },
  headerBackground: {
    flex: 1,
    backgroundColor: "#edf2f7",
    overflow: "hidden",
  },
  headerBackgroundImage: {
    opacity: 0.18,
  },
  headerBackgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#f4f7fb",
  },
  headerBackgroundBorder: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 1,
    backgroundColor: "#d9e1eb",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "100%",
  },
  titleCopy: {
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

type TitleProps = HeaderTitleProps & {
  subtitle?: string;
};

function HeaderBackground() {
  return (
    <View pointerEvents="none" style={styles.headerBackground}>
      <ImageBackground
        imageStyle={styles.headerBackgroundImage}
        resizeMode="cover"
        source={require("../assets/images/bg_header.png")}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.headerBackgroundOverlay} />
      <View style={styles.headerBackgroundBorder} />
    </View>
  );
}

function HeaderTitle({ children, subtitle }: TitleProps) {
  const title = typeof children === "string" ? children : "";

  return (
    <View style={styles.titleContainer}>
      <BrandMark size={25} />
      <View style={styles.titleCopy}>
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

const sharedHeaderOptions = {
  headerBackground: () => <HeaderBackground />,
  headerShadowVisible: false,
  headerStyle: styles.header,
  headerTitle: HeaderTitle,
  headerTitleAlign: "left",
  headerTintColor: "#182334",
  headerTransparent: false,
} satisfies BottomTabNavigationOptions;

export const tabHeaderScreenOptions = sharedHeaderOptions;

export const stackHeaderScreenOptions = {
  ...sharedHeaderOptions,
  headerBackButtonDisplayMode: "minimal",
} satisfies NativeStackNavigationOptions;

export function withHeaderSubtitle(title: string, subtitle?: string) {
  return {
    title,
    headerTitle: (props) => (
      <HeaderTitle {...props} subtitle={subtitle}>
        {title}
      </HeaderTitle>
    ),
  } satisfies NativeStackNavigationOptions;
}
