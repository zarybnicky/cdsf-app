import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type BrandMarkProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export default function BrandMark({
  size = 34,
  style,
}: BrandMarkProps) {
  return (
    <View style={[styles.container, { width: size * 1.1, height: size }, style]}>
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
