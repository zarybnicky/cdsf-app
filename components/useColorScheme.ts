import { useColorScheme as useColorSchemeCore } from "react-native";

export const useColorScheme = () => {
  const colorScheme = useColorSchemeCore();
  return colorScheme && colorScheme !== "unspecified" ? colorScheme : "light";
};
