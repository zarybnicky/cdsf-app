import { isPagingProps, openapiClient } from "@/components/client";
import { EventRegistration } from "@/components/EventRegistration";
import { LoadMoreIndicator } from "@/components/LoadMoreIndicator";
import { httpHeadersAtom } from "@/store";
import { useAtomValue } from "jotai";
import { FlatList } from "react-native";

export default function RegistrationsTab() {
  const headers = useAtomValue(httpHeadersAtom);
  const registrations = openapiClient.useInfiniteQuery(
    "get",
    "/athletes/current/competitions/registrations",
    {
      headers,
      params: { query: { pageSize: 5 } },
    },
    {
      enabled: !!headers,
      ...isPagingProps,
    },
  );

  // Cancel registration button
  // nice date

  return (
    <FlatList
      style={{ height: "100%" }}
      contentContainerStyle={{ flexGrow: 1 }}
      data={registrations.data?.pages.flatMap((xs) => xs?.collection || [])}
      keyExtractor={(item) => item.eventId?.toString() || ""}
      renderItem={({ item }) => <EventRegistration item={item} />}
      onEndReached={
        registrations.hasNextPage
          ? () => registrations.fetchNextPage()
          : undefined
      }
      ListFooterComponent={<LoadMoreIndicator infiniteQuery={registrations} />}
    />
  );
}
