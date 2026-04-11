import {
  ImageBackground,
  StyleSheet,
  View,
} from "react-native";

export default function BrandHeaderBackground() {
  return (
    <View style={styles.container}>
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
    backgroundColor: "#e4e9ef",
  },
  image: {
    opacity: 0.95,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
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
