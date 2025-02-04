import { openapiClient } from "@/components/client";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { credentialsAtom, httpHeadersAtom, logOutAtom } from "@/store";
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
    router.dismissTo("/");
  }, [logOut, router]);

  const athletes = openapiClient.useQuery("get", "/athletes/current", {
    enabled: !!headers,
  });

  return (
    <ScrollView className="flex-1 p-4">
      {(athletes.data?.collection || []).map((x) => (
        <Box key={x.idt}>
          <Heading>{x.name}</Heading>

          <Image
            size="none"
            className="w-full max-w-128 h-48 mx-auto"
            resizeMode="contain"
            source={{
              uri: x.barcode,
            }}
          />
        </Box>
      ))}

      <Text>Přihlášen jako: {credentials?.email}</Text>
      <Button className="mt-4" size="sm" onPress={handleSubmit}>
        <ButtonText>Odhlásit</ButtonText>
      </Button>
    </ScrollView>
  );
}
