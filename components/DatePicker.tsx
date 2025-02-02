import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";

export function DateComponent() {
  const [date, setDate] = React.useState(new Date(1598051730000));
  const [mode, setMode] = React.useState<"date" | "time">("date");
  const [show, setShow] = React.useState(false);

  const onChange = (_event: any, selectedDate?: Date) => {
    setShow(false);
    if (selectedDate) setDate(selectedDate);
  };

  const showMode = (currentMode: "date" | "time") => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => showMode("date");
  const showTimepicker = () => showMode("time");

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
