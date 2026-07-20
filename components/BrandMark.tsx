import { Image, StyleSheet, View } from "react-native";

type BrandMarkProps = {
  size: number;
};

export default function BrandMark({ size }: BrandMarkProps) {
  return (
    <View style={[styles.container, { width: size * 1.1, height: size }]}>
      <Image
        resizeMode="contain"
        source={require("../assets/images/logo_color.png")}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
