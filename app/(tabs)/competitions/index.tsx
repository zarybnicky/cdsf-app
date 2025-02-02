import { client } from "@/components/client";
import { Text } from "@/components/Themed";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { httpHeadersAtom } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { ScrollView } from "react-native";

export default function RegistrationsTab() {
  const headers = useAtomValue(httpHeadersAtom);
  const registrations = useQuery({
    queryKey: ["myRegistrations"],
    enabled: !!headers,
    async queryFn({ signal }) {
      const response = await client.GET("/athletes/current/competitions/registrations", { signal, headers });
      if (response.response.status >= 300) throw response;
      return response.data?.collection || [];
    },
  });

  return (
    <ScrollView className="flex-1">
      {registrations.data?.map(x => (
        <Box className="bg-background-0 my-2 p-2" key={x.eventId}>
          <Heading>{x.eventName}</Heading>
          <Text>{x.city}</Text>
          <Text>{x.date}</Text>
          {x.competitions.map(c => (
            <Text key={c.compId}>
              {c.series}
            </Text>
          ))}
        </Box>
      ))}
    </ScrollView>
  );
}
