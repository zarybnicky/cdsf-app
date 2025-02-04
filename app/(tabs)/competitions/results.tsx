import { isPagingProps, openapiClient } from "@/components/client";
import { EventRegistration } from "@/components/EventRegistration";
import { LoadMoreIndicator } from "@/components/LoadMoreIndicator";
import { httpHeadersAtom } from "@/store";
import { useAtomValue } from "jotai";
import { FlatList } from "react-native";

export default function ResultsTab() {
  const headers = useAtomValue(httpHeadersAtom);
  const results = openapiClient.useInfiniteQuery(
    "get",
    "/athletes/current/competitions/results",
    {
      headers,
      params: { query: { pageSize: 5 } },
    },
    {
      enabled: !!headers,
      ...isPagingProps,
    },
  );

  return (
    <FlatList
      style={{ height: "100%" }}
      contentContainerStyle={{ flexGrow: 1 }}
      data={results.data?.pages.flatMap((xs) => xs?.collection || [])}
      keyExtractor={(item) => item.eventId?.toString() || ""}
      renderItem={({ item }) => <EventRegistration item={item} />}
      onEndReached={
        results.hasNextPage ? () => results.fetchNextPage() : undefined
      }
      ListFooterComponent={<LoadMoreIndicator infiniteQuery={results} />}
    />
  );
}
