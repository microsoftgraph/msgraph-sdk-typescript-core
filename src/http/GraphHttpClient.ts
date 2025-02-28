import { HttpClient, type Middleware } from "@microsoft/kiota-http-fetchlibrary";
import { GraphTelemetryOption, getDefaultMiddlewares } from "../middleware/index.js";
import { BaseBearerTokenAuthenticationProvider } from "@microsoft/kiota-abstractions";

/**
 * Specialized version of the HTTP client for the Graph API that bootstraps telemetry, /me replacement, and other aspects
 */
export class GraphHttpClient extends HttpClient {
  /**
   * Creates a new instance of the GraphHttpClient class
   * @param graphTelemetryOption The options for telemetry
   * @param customFetch The custom fetch implementation to use
   * @param authenticationProvider The authentication provider to use
   * @param middlewares The middlewares to use
   */
  public constructor(
    graphTelemetryOption: GraphTelemetryOption,
    customFetch?: (request: string, init: RequestInit) => Promise<Response>,
    authenticationProvider?: BaseBearerTokenAuthenticationProvider,
    ...middlewares: Middleware[]
  ) {
    super(
      customFetch,
      ...((middlewares ?? []).length > 0
        ? middlewares
        : getDefaultMiddlewares(authenticationProvider, {
            customFetch,
            graphTelemetryOption,
          })),
    );
  }
}
