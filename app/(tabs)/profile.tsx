import { client } from "@/components/client";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { httpHeadersAtom } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { ScrollView } from "react-native";

export default function ProfileTab() {
  const headers = useAtomValue(httpHeadersAtom);
  const athletes = useQuery({
    queryKey: ["athletes"],
    enabled: !!headers,
    async queryFn({ signal }) {
      const response = await client.GET("/athletes/current", { signal, headers });
      if (response.response.status >= 300) throw response;
      return response.data?.collection || [];
    },
  });

  return (
    <ScrollView className="flex-1">
      {athletes.data?.map(x => (
        <Box className="bg-background-0 my-2 p-2" key={x.idt}>
          <Text>{x.name}</Text>
        </Box>
      ))}
    </ScrollView>
  );
}
