import { BaseBearerTokenAuthenticationProvider } from "@microsoft/kiota-abstractions";
import { Middleware } from "@microsoft/kiota-http-fetchlibrary";
import { GraphHttpClient } from "./GraphHttpClient";
import { getDefaultMiddlewares, GraphTelemetryOption } from "../middleware";

/**
 * Factory class for creating instances of `GraphHttpClient`.
 */
export class GraphClientFactory {
  /**
   * Creates an instance of `GraphHttpClient`, with the provided middlewares and custom fetch implementation both parameters are optional.
   * if no middlewares are provided, the default middlewares will be used.
   * @param {GraphTelemetryOption} graphTelemetryOption - The telemetry options for the Graph client.
   * @param {(request: string, init: RequestInit) => Promise<Response>} customFetch - The custom fetch function to use for HTTP requests.
   * @param {BaseBearerTokenAuthenticationProvider} [authenticationProvider] - Optional authentication provider for bearer token.
   * @param {Middleware[]} [middlewares] - Optional array of middleware to use in the HTTP pipeline.
   * @returns {GraphHttpClient} - A new instance of `GraphHttpClient`.
   * @example
   * ```Typescript
   * // Example usage of GraphClientFactory.create method with graphTelemetryOption , customFetch and middlewares parameters provided
   *  GraphClientFactory.create(graphTelemetryOption, customFetch, [middleware1, middleware2]);
   * ```
   * @example
   * ```Typescript
   * // Example usage of GraphClientFactory.create method with only graphTelemetryOption and customFetch parameter provided
   * GraphClientFactory.create(graphTelemetryOption, customFetch);
   * ```
   * @example
   * ```Typescript
   * // Example usage of GraphClientFactory.create method with only graphTelemetryOption and middlewares parameter provided
   * GraphClientFactory.create(graphTelemetryOption, undefined, [middleware1, middleware2]);
   * ```
   * @example
   * ```Typescript
   * // Example usage of GraphClientFactory.create method with only graphTelemetryOption parameter provided
   * GraphClientFactory.create(graphTelemetryOption);
   * ```
   */
  public static create(
    graphTelemetryOption: GraphTelemetryOption,
    customFetch: ((request: string, init: RequestInit) => Promise<Response>) | undefined,
    authenticationProvider?: BaseBearerTokenAuthenticationProvider,
    middlewares?: Middleware[],
  ): GraphHttpClient {
    const middleware =
      middlewares ||
      getDefaultMiddlewares(
        {
          customFetch,
          graphTelemetryOption,
        },
        authenticationProvider,
      );
    return new GraphHttpClient(graphTelemetryOption, customFetch, ...middleware);
  }
}
