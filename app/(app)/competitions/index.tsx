import { Redirect } from "expo-router";

import { competitionTabs } from "@/lib/competition-routes";

export default function CompetitionsIndexScreen() {
  return <Redirect href={competitionTabs.registered.href} />;
}
