import { client } from "@/components/client";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Text } from "@/components/ui/text";
import { httpHeadersAtom, credentialsAtom, logInAtom } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue } from "jotai";

export default function ProifleTab() {
  const credentials = useAtomValue(credentialsAtom);
  const headers = useAtomValue(httpHeadersAtom);
  const [isLoggedIn, logInOut] = useAtom(logInAtom);
  const handleSubmit = () => logInOut(null);

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
    <Center className="flex-1">
      <Text>
        {credentials?.email}
      </Text>

      <Text>
        {(athletes.data || []).map(x =>x.name).join(', ')}
      </Text>

      <Button className="mt-4" size="sm" onPress={handleSubmit}>
        <ButtonText>Log out</ButtonText>
      </Button>
    </Center>
  );
}
