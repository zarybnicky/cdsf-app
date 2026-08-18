import { Image } from "react-native";

type BrandMarkProps = {
  size: number;
};

export default function BrandMark({ size }: BrandMarkProps) {
  return (
    <Image
      resizeMode="contain"
      source={require("../assets/images/logo_color.png")}
      style={{ width: size * 1.1, height: size }}
    />
  );
}
