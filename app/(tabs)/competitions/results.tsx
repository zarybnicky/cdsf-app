import { client } from "@/components/client";
import { httpHeadersAtom } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { ScrollView } from "@/components/ui/scroll-view";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/Themed";
import { HStack } from "@/components/ui/hstack";
import { components } from "@/CDSF";

// Missing in OpenAPI spec
type EventResult = {
  eventId: number;
  eventName: string;
  city: string;
  date: string;
  competitions: {
    idt: components["schemas"]["Id.Person"];
    compId: components["schemas"]["Id.Competition"];
    competitionId: components["schemas"]["Id.Competition"];
    category: components["schemas"]["CompetitionCompetitors"];
    competitors: components["schemas"]["CompetitionCompetitors"];
    class: components["schemas"]["RankingClass"];
    fromClass: components["schemas"]["RankingClass"];
    discipline: components["schemas"]["Discipline"];
    age: components["schemas"]["Age"];
    grade: components["schemas"]["CompetitionGrade"];
    series: components["schemas"]["CompetitionSeries"];
    ranking: number;
    rankingTo: number;
    completedAt: string;
  }[];
};

export default function ResultsTab() {
  const headers = useAtomValue(httpHeadersAtom);
  const results = useQuery<EventResult[]>({
    queryKey: ["myResults"],
    enabled: !!headers,
    async queryFn({ signal }) {
      const response = await client.GET("/athletes/current/competitions/results", { signal, headers });
      if (response.response.status >= 300) throw response;
      return (response.data?.collection || []) as EventResult[];
    },
  });

  console.log(results.data);

  return (
    <ScrollView className="flex-1">
      {results.data?.map(x => (
        <Box className="bg-background-0 my-2 p-2" key={x.eventId}>
          <Heading>{x.eventName}</Heading>
          <Text>{x.city}</Text>
          <Text>{x.date}</Text>
          {x.competitions.map(c => (
            <HStack className="p-1 justify-between" key={c.compId}>
              <Text>{c.series} {c.discipline}</Text>
              <Text>{c.ranking}{c.ranking !== c.rankingTo ? `-${c.rankingTo}` : ''}.</Text>
            </HStack>
          ))}
        </Box>
      ))}
    </ScrollView>
  );
}
