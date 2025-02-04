import { isPagingProps, openapiClient } from "@/components/client";
import { LoadMoreIndicator } from "@/components/LoadMoreIndicator";
import { Notification } from "@/components/Notification";
import { httpHeadersAtom } from "@/store";
import { useAtomValue } from "jotai";
import React from "react";
import { FlatList } from "react-native";

export default function NotificationsTab() {
  const headers = useAtomValue(httpHeadersAtom);
  const notifications = openapiClient.useInfiniteQuery(
    "get",
    "/notifications",
    {
      headers,
      params: { query: { pageSize: 10 } },
    },
    {
      enabled: !!headers,
      ...isPagingProps,
    },
  );

  // Filter by allowed types, but allow overrideMuting

  return (
    <FlatList
      style={{ height: "100%" }}
      contentContainerStyle={{ flexGrow: 1 }}
      data={notifications.data?.pages.flatMap((xs) => xs?.collection || [])}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <Notification item={item} />}
      onEndReached={
        notifications.hasNextPage
          ? () => notifications.fetchNextPage()
          : undefined
      }
      ListFooterComponent={<LoadMoreIndicator infiniteQuery={notifications} />}
    />
  );
}
