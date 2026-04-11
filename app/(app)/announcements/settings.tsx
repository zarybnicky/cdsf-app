import { ScrollView, StyleSheet } from "react-native";

import NotificationPreferencesCard from "@/components/NotificationPreferencesCard";

export default function AnnouncementSettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <NotificationPreferencesCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 18,
  },
});
