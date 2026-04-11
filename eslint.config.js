// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
import eslintConfigPrettier from "eslint-config-prettier/flat";

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  eslintConfigPrettier,
]);
