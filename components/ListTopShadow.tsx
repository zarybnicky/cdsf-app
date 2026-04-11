import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type ListTopShadowProps = {
  style?: StyleProp<ViewStyle>;
};

const shadowOpacities = [0.08, 0.055, 0.038, 0.026, 0.017, 0.01, 0.005];

export default function ListTopShadow({ style }: ListTopShadowProps) {
  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      <View style={styles.edge} />
      {shadowOpacities.map((opacity, index) => (
        <View
          key={opacity}
          style={[
            styles.band,
            {
              top: index + 1,
              backgroundColor: `rgba(19, 36, 58, ${opacity})`,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 12,
    zIndex: 4,
  },
  edge: {
    height: 1,
    backgroundColor: "rgba(217, 225, 235, 0.9)",
  },
  band: {
    position: "absolute",
    right: 0,
    left: 0,
    height: 1,
  },
});
