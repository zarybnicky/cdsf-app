import { ImageBackground, StyleSheet, View } from "react-native";

export default function BrandHeaderBackground() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <ImageBackground
        imageStyle={styles.image}
        resizeMode="cover"
        source={require("../assets/images/bg_header.png")}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.overlay} />
      <View style={styles.border} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#edf2f7",
    overflow: "hidden",
  },
  image: {
    opacity: 0.18,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#f4f7fb",
  },
  border: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 1,
    backgroundColor: "#d9e1eb",
  },
});
