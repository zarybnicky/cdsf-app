import { Button, ButtonText } from "@/components/ui/button";
import { FormControl, FormControlLabel, FormControlLabelText } from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import React from "react";

export function LoginForm({ onSubmit }: {
  onSubmit: (credentials: {email: string; password: string}) => void;
}) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = React.useCallback(() => {
    onSubmit({ email, password });
  }, []);

  return (
    <VStack className="w-full max-w-[300px] rounded-md bg-background-0 p-4">
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
