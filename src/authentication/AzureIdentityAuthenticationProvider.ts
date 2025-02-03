import { GetTokenOptions, TokenCredential } from "@azure/core-auth";
import { AzureIdentityAuthenticationProvider } from "@microsoft/kiota-authentication-azure";
import { ObservabilityOptions } from "@microsoft/kiota-authentication-azure/dist/es/src/observabilityOptions";

export class GraphAzureIdentityAuthenticationProvider extends AzureIdentityAuthenticationProvider {
  // create a constructor with TokenCredential
  public constructor(
    credentials: TokenCredential,
    scopes?: string[],
    options?: GetTokenOptions | undefined,
    allowedHosts?: Set<string>,
    observabilityOptions?: ObservabilityOptions,
    isCaeEnabled?: boolean,
  ) {
    if (!allowedHosts || allowedHosts.size === 0) {
      allowedHosts = new Set([
        "graph.microsoft.com",
        "graph.microsoft.us",
        "dod-graph.microsoft.us",
        "graph.microsoft.de",
        "microsoftgraph.chinacloudapi.cn",
        "canary.graph.microsoft.com",
      ]);
    }
    super(credentials, scopes, options, allowedHosts, observabilityOptions, isCaeEnabled);
  }
}
