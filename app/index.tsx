import React from "react";
import Gradient from "@/assets/Icons/Gradient";
import DocumentData from "@/assets/Icons/DocumentData";
import LightBulbPerson from "@/assets/Icons/LightbulbPerson";
import Rocket from "@/assets/Icons/Rocket";
import Logo from "@/assets/Icons/Logo";
import { Box } from "@/components/ui/box";
import { ScrollView } from "react-native";
import { Text } from "@/components/ui/text";
import { Link } from "expo-router";
import { VStack } from "@/components/ui/vstack";
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAtom, useAtomValue } from "jotai";
import { athletesAtom, logInAtom } from "@/store";

const FeatureCard = ({ iconSvg: IconSvg, name, desc }: any) => {
  return (
    <Box
      className="flex-column border border-w-1 border-outline-700 md:flex-1 m-2 p-4 rounded"
      key={name}
    >
      <Box className="items-center flex flex-row">
        <Text>
          <IconSvg />
        </Text>
        <Text className="text-typography-white font-medium ml-2 text-xl">
          {name}
        </Text>
      </Box>
      <Text className="text-typography-400 mt-2">{desc}</Text>
    </Box>
  );
};

export default function Home() {
  return (
    <Box className="flex-1 bg-black h-[100vh]">
      <ScrollView
        style={{ height: "100%" }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Box className="absolute h-[500px] w-[500px] lg:w-[700px] lg:h-[700px]">
          <Gradient />
        </Box>
        <Box className="flex flex-1 items-center my-16 mx-5 lg:my-24 lg:mx-32">
          <Box className="gap-10 base:flex-col sm:flex-row justify-between sm:w-[80%] md:flex-1">
            <Box className="bg-background-template py-2 px-6 rounded-full items-center flex-column md:flex-row md:self-start">
              <Text className="text-typography-white font-normal">
                Get started by editing
              </Text>
              <Text className="text-typography-white font-medium ml-2">
                ./App.tsx
              </Text>
            </Box>
            <Link href="/tabs">
              <Box className="bg-background-template py-2 px-6 rounded-full items-center flex-column sm:flex-row md:self-start">
                <Text className="text-typography-white font-normal">
                  Explore Tab Navigation
                </Text>
              </Box>
            </Link>
          </Box>
          <Box className="flex-1 justify-center items-center h-[20px] w-[300px] lg:h-[160px] lg:w-[400px]">
            <Logo />
          </Box>

          <App />

          <Box className="flex-column md:flex-row">
            <FeatureCard
              iconSvg={DocumentData}
              name="Docs"
              desc="Find in-depth information about gluestack features and API."
            />
            <FeatureCard
              iconSvg={LightBulbPerson}
              name="Learn"
              desc="Learn about gluestack in an interactive course with quizzes!"
            />
            <FeatureCard
              iconSvg={Rocket}
              name="Deploy"
              desc="Instantly drop your gluestack site to a shareable URL with vercel."
            />
          </Box>
        </Box>
      </ScrollView>
    </Box>
  );
}

function DateComponent() {
  const [date, setDate] = React.useState(new Date(1598051730000));
  const [mode, setMode] = React.useState<'date' | 'time'>('date');
  const [show, setShow] = React.useState(false);

  const onChange = (_event: any, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate)
      setDate(selectedDate);
  };

  const showMode = (currentMode: 'date' | 'time') => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => showMode('date');
  const showTimepicker = () => showMode('time');

  return (
    <VStack>
      <Button onPress={showDatepicker}>Show date picker</Button>
      <Button onPress={showTimepicker}>Show time picker!</Button>
      <Text>selected: {date.toLocaleString()}</Text>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={mode}
          is24Hour={true}
          onChange={onChange}
        />
      )}
    </VStack>
  );
}

function App () {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');

  const [isLoggedIn, logInOut] = useAtom(logInAtom);
  const athletes = useAtomValue(athletesAtom);

  const handleSubmit = async () => {
    setErrorMessage('');

    if (isLoggedIn) {
      logInOut(null);
    } else {
      const response = await logInOut({ email, password });
      if (response >= 400) {
        setErrorMessage(response.toString());
      }
    }
  };

  return isLoggedIn ? (
    <VStack className="w-full max-w-[300px] rounded-md bg-background-0 p-4">
      Logged in

      Athletes: {athletes.length}

      <Button className="w-fit self-end mt-4" size="sm" onPress={handleSubmit}>
        <ButtonText>Log out</ButtonText>
      </Button>
    </VStack>
  ): (
    <VStack className="w-full max-w-[300px] rounded-md bg-background-0 p-4">
      {errorMessage || null}

      <FormControl size="md" isRequired={true}>
        <FormControlLabel>
          <FormControlLabelText>E-mail</FormControlLabelText>
        </FormControlLabel>
        <Input className="my-1">
          <InputField
            type="text"
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
          />
        </Input>
      </FormControl>

      <FormControl size="md" isRequired={true} >
        <FormControlLabel>
          <FormControlLabelText>Password</FormControlLabelText>
        </FormControlLabel>
        <Input className="my-1">
          <InputField
            type="password"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
          />
        </Input>
      </FormControl>

      <Button className="w-fit self-end mt-4" size="sm" onPress={handleSubmit}>
        <ButtonText>Submit</ButtonText>
      </Button>
    </VStack>
  );
}
