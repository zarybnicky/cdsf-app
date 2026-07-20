const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const jotaiWebAliases = {
  jotai: path.resolve(__dirname, "node_modules/jotai/index.js"),
  "jotai/react": path.resolve(__dirname, "node_modules/jotai/react.js"),
  "jotai/react/utils": path.resolve(
    __dirname,
    "node_modules/jotai/react/utils.js",
  ),
  "jotai/utils": path.resolve(__dirname, "node_modules/jotai/utils.js"),
  "jotai/vanilla": path.resolve(__dirname, "node_modules/jotai/vanilla.js"),
  "jotai/vanilla/utils": path.resolve(
    __dirname,
    "node_modules/jotai/vanilla/utils.js",
  ),
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

const enhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, server) => {
  const metroMiddleware = enhanceMiddleware(middleware, server);

  return async (request, response, next) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (request.method !== "GET" || requestUrl.pathname !== "/api/1/events") {
      return metroMiddleware(request, response, next);
    }

    try {
      const upstreamResponse = await fetch(
        `https://www.csts.cz${requestUrl.pathname}${requestUrl.search}`,
      );
      response.statusCode = upstreamResponse.status;
      response.setHeader(
        "content-type",
        upstreamResponse.headers.get("content-type") ?? "application/json",
      );
      response.end(Buffer.from(await upstreamResponse.arrayBuffer()));
    } catch {
      response.statusCode = 502;
      response.end();
    }
  };
};

module.exports = config;
