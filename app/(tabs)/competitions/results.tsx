import { openapiClient } from "@/components/client";
import { httpHeadersAtom } from "@/store";
import { useAtomValue } from "jotai";
import { ScrollView } from "@/components/ui/scroll-view";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";

export default function ResultsTab() {
  const headers = useAtomValue(httpHeadersAtom);
  const results = openapiClient.useInfiniteQuery(
    'get',
    '/athletes/current/competitions/results',
    {
      headers,
      params: { query: { pageSize: 5 } },
    },
    {
      enabled: !!headers,
      pageParamName: 'page',
      initialPageParam: 1,
      getNextPageParam(lastPage) {
        const { totalCount = 0, pageSize = 5, page = 0 } = lastPage?.paging || {};
        return (totalCount > pageSize * page) ? page + 1 : undefined;
      }
    }
  );

  return (
    <ScrollView className="flex-1">
      {results.data?.pages.flatMap(xs => xs?.collection || []).map(x => (
        <Box className="bg-background-0 my-2 p-2" key={x.eventId}>
          <Heading>{x.eventName}</Heading>
          <Text>{x.city}</Text>
          <Text>{x.date}</Text>
          {x.competitions.map(c => (
            <HStack className="p-1 justify-between" key={c.compId}>
              <Text>{c.age} {c.discipline}</Text>
              <Text>{c.ranking}{c.ranking !== c.rankingTo ? `-${c.rankingTo}` : ''}.</Text>
            </HStack>
          ))}
        </Box>
      ))}

      {results.hasNextPage && (
        <Button onPress={results.fetchNextPage}>
          <ButtonText>
            Načíst další
            {results.isFetchingNextPage ? '...' : ''}
          </ButtonText>
        </Button>
      )}
    </ScrollView>
  );
}
