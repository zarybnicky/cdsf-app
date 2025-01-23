import { Heading } from "@/components/ui/heading";
import Markdown from '@ronradtke/react-native-markdown-display';
import { useAtomValue } from "jotai";
import { notificationsAtom } from "@/store";
import { Box } from "@/components/ui/box";
import { ScrollView } from "@/components/ui/scroll-view";
import React from "react";

export default function Tab2() {
  const notifications = useAtomValue(notificationsAtom);

  return (
    <ScrollView className="flex-1">
      {notifications.map(x => (
        <React.Fragment key={x.id}>
          <Box className="bg-background-0 my-2 p-2">
            <Heading>{x.caption}</Heading>
            {x.message && <Markdown children={x.message} />}
          </Box>
        </React.Fragment>
      ))}
    </ScrollView>
  );
}
