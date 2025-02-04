import { components } from "@/CDSF";
import { isPagingProps, openapiClient } from "@/components/client";
import { ExternalLink } from "@/components/ExternalLink";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { httpHeadersAtom } from "@/store";
import Markdown from "@ronradtke/react-native-markdown-display";
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
      ...isPagingProps
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
      ListFooterComponent={
        !notifications.hasNextPage ? null : (
          <Button onPress={notifications.fetchNextPage}>
            <ButtonText>
              Načíst další
              {notifications.isFetchingNextPage ? "..." : ""}
            </ButtonText>
          </Button>
        )
      }
    />
  );
}

function Notification({
  item,
}: {
  item: components["schemas"]["Notification"];
}) {
  return (
    <Box className="bg-background-0 my-2 p-2" key={item.id}>
      <Heading>
        {item.link ? (
          <ExternalLink href={item.link}>{item.caption}</ExternalLink>
        ) : (
          item.caption
        )}
      </Heading>
      <Text>{[item.author, item.created].filter(Boolean).join(" / ")}</Text>
      {item.message && <Markdown children={item.message} />}
    </Box>
  );
}
