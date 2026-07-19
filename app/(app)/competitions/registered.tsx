import { useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { useState } from "react";

import CompetitionListScreen from "@/components/CompetitionListScreen";
import { registrationsAtom, syncStateAtom } from "@/lib/atoms";
import { getDateMs } from "@/lib/cdsf";
import { sync } from "@/lib/sync";

export default function RegisteredCompetitionsScreen() {
  const router = useRouter();
  const registrations = useAtomValue(registrationsAtom);
  const syncState = useAtomValue(syncStateAtom).registrations;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const registrationsStart = new Date();
  registrationsStart.setHours(0, 0, 0, 0);
  registrationsStart.setDate(registrationsStart.getDate() - 1);
  const registrationsStartMs = registrationsStart.getTime();
  const events = registrations
    .filter((event) => getDateMs(event.date) >= registrationsStartMs)
    .sort((left, right) => {
      const timestampDifference = getDateMs(left.date) - getDateMs(right.date);

      if (timestampDifference !== 0) {
        return timestampDifference;
      }

      return left.eventName.localeCompare(right.eventName, "cs");
    });
  const isLoading =
    registrations.length === 0 &&
    syncState.lastSync === null &&
    syncState.lastError === null;
  const stateCard = isLoading
    ? {
        body: "Přehled soutěží se načítá.",
        isLoading: true,
        title: "Načítám přehled soutěží",
      }
    : syncState.lastError
      ? {
          body: "Zkuste načtení zopakovat.",
          onRetry: () => {
            void refresh();
          },
          title: "Nepodařilo se načíst přehled soutěží",
        }
      : {
          body: "Jakmile budou přihlášky na soutěže evidovány, zobrazí se zde.",
          title: "Žádné přihlášky na soutěže",
        };

  async function refresh() {
    setIsRefreshing(true);
    try {
      await sync({ trigger: "manual", domains: ["registrations"] }).catch(
        () => {},
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <CompetitionListScreen
      events={events}
      isRefreshing={isRefreshing}
      onPressEvent={(eventId) => {
        router.push({
          pathname: "/competitions/events/[eventId]",
          params: { eventId },
        });
      }}
      onRefresh={() => {
        void refresh();
      }}
      stateCard={stateCard}
      tab="registered"
    />
  );
}
