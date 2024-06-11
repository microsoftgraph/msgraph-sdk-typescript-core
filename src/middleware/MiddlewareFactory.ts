import {
  Middleware,
  MiddlewareFactory,
  UrlReplaceHandler,
  UrlReplaceHandlerOptions,
} from "@microsoft/kiota-http-fetchlibrary";
import { GraphTelemetryOption } from "./GraphTelemetryOption.js";
import { GraphTelemetryHandler } from "./GraphTelemetryHandler.js";
import { defaultUrlReplacementPairs } from "../utils/Constants.js";

export const getDefaultMiddlewares = (options: MiddlewareFactoryOptions = { customFetch: fetch }): Middleware[] => {
  let kiotaChain = MiddlewareFactory.getDefaultMiddlewares(options?.customFetch);
  const additionalMiddleware: Middleware[] = [
    new UrlReplaceHandler(
      new UrlReplaceHandlerOptions({
        enabled: true,
        urlReplacements: defaultUrlReplacementPairs,
      }),
    ),
  ];
  if (options.graphTelemetryOption) {
    additionalMiddleware.push(new GraphTelemetryHandler(options.graphTelemetryOption));
  }
  const fetchMiddleware = kiotaChain.slice(-1);
  const otherMiddlewares = kiotaChain.slice(0, kiotaChain.length - 1);
  kiotaChain = [...otherMiddlewares, ...additionalMiddleware, ...fetchMiddleware];
  return kiotaChain;
};
interface MiddlewareFactoryOptions {
  customFetch?: (request: string, init: RequestInit) => Promise<Response>;
  graphTelemetryOption?: GraphTelemetryOption;
}
