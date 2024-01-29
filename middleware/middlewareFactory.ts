import { Middleware, MiddlewareFactory, UrlReplaceHandler, UrlReplaceHandlerOptions } from "@microsoft/kiota-http-fetchlibrary";
import { GraphTelemetryOption } from "./graphTelemetryOption";
import { GraphTelemetryHandler } from "./graphTelemetryHandler";
import { defaultUrlReplacementPairs } from "../constants";

export function getDefaultMiddlewareChain(options: MiddlewareFactoryOptions = {customFetch: fetch as any}): Middleware[] {
	let kiotaChain = MiddlewareFactory.getDefaultMiddlewareChain(options?.customFetch);
	let additionalMiddleware: Middleware[] = [new UrlReplaceHandler(
		new UrlReplaceHandlerOptions({
			enabled: true,
			urlReplacements: defaultUrlReplacementPairs
		})
	)];
	if (options.graphTelemetryOption) {
		additionalMiddleware.push(new GraphTelemetryHandler(options.graphTelemetryOption));
	}
	const fetchMiddleware = kiotaChain.slice(-1);
	const otherMiddlewares = kiotaChain.slice(0, kiotaChain.length -1);
	kiotaChain = [...otherMiddlewares, ...additionalMiddleware, ...fetchMiddleware];
	return kiotaChain;
}
interface MiddlewareFactoryOptions {
	customFetch?: (request: string, init: RequestInit) => Promise<Response>;
	graphTelemetryOption?: GraphTelemetryOption;
}