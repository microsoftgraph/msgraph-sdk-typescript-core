import { FetchHeadersInit, TelemetryHandler, appendRequestHeader } from "@microsoft/kiota-http-fetchlibrary";
import { GraphTelemetryOption } from "./graphTelemetryOption";
import { type RequestOption } from "@microsoft/kiota-abstractions";
import { coreVersion } from "version";

/**
 * Adds telemetry headers to requests made to the Graph API
 */
export class GraphTelemetryHandler extends TelemetryHandler
{
	/**
	 * Creates a new instance of the GraphTelemetryHandler class
	 */
	public constructor(graphTelemetryOption: GraphTelemetryOption) {
		const productPrefix = graphTelemetryOption.graphProductPrefix ?? "graph-javascript";
		const coreProduct = `${productPrefix}-core/${coreVersion}`;
		let product = "";
		if(graphTelemetryOption.graphServiceLibraryClientVersion) {
			const serviceLibVersion = graphTelemetryOption.graphServiceTargetVersion ? `-${graphTelemetryOption.graphServiceTargetVersion}` : "";
			product = `${productPrefix}${serviceLibVersion}/${graphTelemetryOption.graphServiceLibraryClientVersion}`;
		}
		const versionHeaderValue = product ? `${product}, ${coreProduct}` : coreProduct;
		super({
			telemetryConfigurator: (url: string, requestInit: RequestInit, requestOptions?: Record<string, RequestOption>, telemetryInformation?: unknown) => {
				
				appendRequestHeader(requestInit.headers as FetchHeadersInit, "SdkVersion", versionHeaderValue);
			},
			telemetryInfomation: undefined, //TODO remove on next kiota-typescript release
			getKey: () => "graphTelemetryOption"
		});
	}
}
