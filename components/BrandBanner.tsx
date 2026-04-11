import {
  ImageBackground,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import BrandMark from "@/components/BrandMark";
import { Text } from "@/components/Themed";

type BrandBannerProps = {
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
};

export default function BrandBanner({
  style,
  subtitle,
}: BrandBannerProps) {
  return (
    <ImageBackground
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
      source={require("../assets/images/bg_header.png")}
      style={[styles.banner, style]}
    >
      <View style={styles.overlay} />
      <View style={styles.content}>
        <BrandMark size={60} />
        <View style={styles.copy}>
          <Text style={styles.title}>Český svaz{"\n"}tanečního sportu</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 154,
    justifyContent: "center",
    overflow: "hidden",
  },
  backgroundImage: {
    opacity: 0.96,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 22,
    paddingVertical: 22,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: "#121923",
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 32,
    textTransform: "uppercase",
  },
  subtitle: {
    color: "#2457b3",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 8,
  },
});
