import { Middleware, MiddlewareFactory } from "@microsoft/kiota-http-fetchlibrary";
import { GraphTelemetryOption } from "./graphTelemetryOption";
import { GraphTelemetryHandler } from "./graphTelemetryHandler";

export function getDefaultMiddlewareChain(options: MiddlewareFactoryOptions = {customFetch: fetch as any}): Middleware[] {
	let kiotaChain = MiddlewareFactory.getDefaultMiddlewareChain(options?.customFetch);
	if (options.graphTelemetryOption) {
		const fetchMiddleware = kiotaChain.slice(-1);
		const otherMiddlewares = kiotaChain.slice(0, kiotaChain.length -1);
		kiotaChain = [...otherMiddlewares, new GraphTelemetryHandler(options.graphTelemetryOption), ...fetchMiddleware];
	}
	return kiotaChain;
}
interface MiddlewareFactoryOptions {
	customFetch?: (request: string, init: RequestInit) => Promise<Response>;
	graphTelemetryOption?: GraphTelemetryOption;
}