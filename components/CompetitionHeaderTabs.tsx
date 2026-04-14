import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";
import { competitionTabs, type CompetitionTab } from "@/lib/competition-routes";

type CompetitionHeaderTabsProps = {
  active: CompetitionTab;
};

const tabs = Object.entries(competitionTabs) as [
  CompetitionTab,
  (typeof competitionTabs)[CompetitionTab],
][];

export default function CompetitionHeaderTabs({
  active,
}: CompetitionHeaderTabsProps) {
  const router = useRouter();

  return (
    <View accessibilityRole="tablist" style={styles.headerToggle}>
      {tabs.map(([tab, { href, label }]) => {
        const isActive = tab === active;

        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            hitSlop={4}
            onPress={() => {
              if (!isActive) {
                router.replace(href);
              }
            }}
            style={({ pressed }) => [
              styles.segment,
              isActive ? styles.segmentActive : null,
              pressed ? styles.segmentPressed : null,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                isActive ? styles.segmentTextActive : null,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  headerToggle: {
    flexDirection: "row",
    gap: 3,
    marginRight: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dfe6ef",
    backgroundColor: "#eef3f8",
    padding: 3,
  },
  segment: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  segmentActive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dce4ef",
    shadowColor: "#183769",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentPressed: {
    opacity: 0.86,
  },
  segmentText: {
    color: "#7e8997",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  segmentTextActive: {
    color: "#2457b3",
  },
});
