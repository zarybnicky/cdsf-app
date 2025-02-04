import { openapiClient } from "@/components/client";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { httpHeadersAtom } from "@/store";
import { useAtomValue } from "jotai";
import { ScrollView } from "react-native";
import { Button, ButtonText } from "@/components/ui/button";

export default function RegistrationsTab() {
  const headers = useAtomValue(httpHeadersAtom);
  const registrations = openapiClient.useInfiniteQuery(
    'get',
    '/athletes/current/competitions/registrations',
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

  // Cancel registration button
  // nice date

  return (
    <ScrollView className="flex-1">
      {registrations.data?.pages.flatMap(xs => xs?.collection || []).map(x => (
        <Box className="bg-background-0 my-1 p-2" key={x.eventId}>
          <Text>{x.date}</Text>
          <Text>{x.city}</Text>
          <Heading>{x.eventName}</Heading>
          {x.competitions.map(c => (
            <Box key={c.compId}>
              <Text>{c.age} {c.discipline} {c.registrationEnd}</Text>
              <Text>{c.ranking}{c.rankingTo ? `-${c.rankingTo}` : ''}</Text>
            </Box>
          ))}
        </Box>
      ))}
      {registrations.hasNextPage && (
        <Button onPress={registrations.fetchNextPage}>
          <ButtonText>
            Načíst další
            {registrations.isFetchingNextPage ? '...' : ''}
          </ButtonText>
        </Button>
      )}
    </ScrollView>
  );
}
