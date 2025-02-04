import { Heading } from "@/components/ui/heading";
import Markdown from '@ronradtke/react-native-markdown-display';
import { useAtomValue } from "jotai";
import { httpHeadersAtom } from "@/store";
import { Box } from "@/components/ui/box";
import React from "react";
import { openapiClient } from "@/components/client";
import { Text } from "@/components/ui/text";
import { ExternalLink } from "@/components/ExternalLink";
import { Button, ButtonText } from "@/components/ui/button";
import { FlatList } from "react-native";
import { components } from "@/CDSF";

export default function NotificationsTab() {
  const headers = useAtomValue(httpHeadersAtom);
  const notifications = openapiClient.useInfiniteQuery(
    'get',
    '/notifications',
    {
      headers,
      params: { query: { pageSize: 10 } },
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

  // Filter by allowed types, but allow overrideMuting

  return (
    <FlatList
      style={{ height: "100%" }}
      contentContainerStyle={{ flexGrow: 1 }}
      data={notifications.data?.pages.flatMap(xs => xs?.collection || [])}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => <Notification item={item} />}

      onEndReached={notifications.hasNextPage ? () => notifications.fetchNextPage() : undefined}
      ListFooterComponent={!notifications.hasNextPage ? null : (
        <Button onPress={notifications.fetchNextPage}>
          <ButtonText>
            Načíst další
            {notifications.isFetchingNextPage ? '...' : ''}
          </ButtonText>
        </Button>
      )}
    />
  );
}

function Notification({ item }: { item: components['schemas']['Notification'] }) {
  return (
    <Box className="bg-background-0 my-2 p-2" key={item.id}>
      <Heading>
        {item.link ? (
          <ExternalLink href={item.link}>
            {item.caption}
          </ExternalLink>
        ) : (
          item.caption
        )}
      </Heading>
      <Text>
        {[item.author, item.created].filter(Boolean).join(' / ')}
      </Text>
      {item.message && <Markdown children={item.message} />}
    </Box>
  );
}
