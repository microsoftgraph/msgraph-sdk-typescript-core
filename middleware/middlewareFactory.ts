import { Middleware, MiddlewareFactory } from "@microsoft/kiota-http-fetchlibrary";

export function getDefaultMiddlewareChain(customFetch: (request: string, init: RequestInit) => Promise<Response> = fetch as any): Middleware[] {
	const kiotaChain = MiddlewareFactory.getDefaultMiddlewareChain(customFetch);
	// add your own middlewares here
	return kiotaChain;
}