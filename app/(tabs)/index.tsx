import { Heading } from "@/components/ui/heading";
import Markdown from '@ronradtke/react-native-markdown-display';
import { useAtomValue } from "jotai";
import { httpHeadersAtom } from "@/store";
import { Box } from "@/components/ui/box";
import { ScrollView } from "@/components/ui/scroll-view";
import React from "react";
import { useQuery } from '@tanstack/react-query'
import { client } from "@/components/client";

export default function NotificationsTab() {
  const headers = useAtomValue(httpHeadersAtom);
  const notifications = useQuery({
    queryKey: ["notifications"],
    enabled: !!headers,
    async queryFn({ signal }) {
      const response = await client.GET("/notifications", { signal, headers });
      if (response.response.status >= 300) throw response;
      return response.data?.collection || [];
    },
  });

  return (
    <ScrollView className="flex-1">
      {notifications.data?.map(x => (
        <Box className="bg-background-0 my-2 p-2" key={x.id}>
          <Heading>{x.caption}</Heading>
          {x.message && <Markdown children={x.message} />}
        </Box>
      ))}
    </ScrollView>
  );
}
