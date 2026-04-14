const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const jotaiWebAliases = {
  jotai: path.resolve(__dirname, "node_modules/jotai/index.js"),
  "jotai/react": path.resolve(__dirname, "node_modules/jotai/react.js"),
  "jotai/react/utils": path.resolve(__dirname, "node_modules/jotai/react/utils.js"),
  "jotai/utils": path.resolve(__dirname, "node_modules/jotai/utils.js"),
  "jotai/vanilla": path.resolve(__dirname, "node_modules/jotai/vanilla.js"),
  "jotai/vanilla/utils": path.resolve(__dirname, "node_modules/jotai/vanilla/utils.js"),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const filePath = platform === "web" ? jotaiWebAliases[moduleName] : undefined;

  if (filePath) {
    return {
      type: "sourceFile",
      filePath,
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
