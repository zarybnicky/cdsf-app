import { LoginForm } from "@/components/LoginForm";
import { Box } from "@/components/ui/box";
import { credentialsAtom, logInAtom } from "@/store";
import { Redirect } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import React from "react";
import { ScrollView } from "react-native";

export default function Home() {
  const isLoggedIn = useAtomValue(credentialsAtom);
  const logIn = useSetAtom(logInAtom);
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleSubmit = React.useCallback(async (credentials: { email: string; password: string; }) => {
    setErrorMessage('');

    const response = await logIn(credentials);
    if (response >= 400) {
      setErrorMessage(response.toString());
    }
  }, []);

  if (isLoggedIn)
    return <Redirect href="/(tabs)" />;

  return (
    <Box className="flex-1 bg-black h-[100vh]">
      <ScrollView
        style={{ height: "100%" }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Box className="flex flex-1 items-center my-16 mx-5 lg:my-24 lg:mx-32">
          {errorMessage || null}

          <LoginForm onSubmit={handleSubmit} />
        </Box>
      </ScrollView>
    </Box>
  );
}

