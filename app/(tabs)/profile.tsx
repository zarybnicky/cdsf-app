import { client } from "@/components/client";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { credentialsAtom, httpHeadersAtom, logOutAtom } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import React from "react";
import { ScrollView } from "react-native";

export default function ProifleTab() {
  const router = useRouter();
  const credentials = useAtomValue(credentialsAtom);
  const headers = useAtomValue(httpHeadersAtom);
  const logOut = useSetAtom(logOutAtom);

  const handleSubmit = React.useCallback(() => {
    logOut();
    router.dismissTo('/');
  }, [logOut, router]);

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
    <ScrollView className="flex-1 p-4">
      {(athletes.data || []).map(x => (
        <Box key={x.idt}>
          <Heading>{x.name}</Heading>

          <Image
            size="none"
            className="w-full max-w-128 h-48 mx-auto"
            resizeMode="contain"
            source={{
              uri: x.barcode
            }}
          />
        </Box>
      ))}

      <Text>
        Přihlášen jako:{' '}
        {credentials?.email}
      </Text>
      <Button className="mt-4" size="sm" onPress={handleSubmit}>
        <ButtonText>Odhlásit</ButtonText>
      </Button>
    </ScrollView>
  );
}
