import { ImageBackground, StyleSheet, Text, View } from "react-native";

import BrandMark from "@/components/BrandMark";

export default function BrandBanner() {
  return (
    <ImageBackground
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
      source={require("../assets/images/bg_header.png")}
      style={styles.banner}
    >
      <View style={styles.overlay} />
      <View style={styles.content}>
        <BrandMark size={60} />
        <View style={styles.copy}>
          <Text style={styles.title}>Český svaz{"\n"}tanečního sportu</Text>
          <Text style={styles.subtitle}>#tanciscsts</Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 146,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d9e1ea",
    justifyContent: "center",
    overflow: "hidden",
  },
  backgroundImage: {
    opacity: 0.96,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255, 255, 255, 0.58)",
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
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 30,
    textTransform: "uppercase",
  },
  subtitle: {
    color: "#2457b3",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 6,
  },
});
