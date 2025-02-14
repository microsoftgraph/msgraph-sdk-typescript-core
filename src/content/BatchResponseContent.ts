/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

/**
 * @module BatchResponseContent
 */

/**
 * @interface
 * Signature represents key value pair object
 */
export interface BatchItem {
  id: string;
  method: string | undefined;
  url: string | undefined;
  headers: Record<string, string> | undefined;
  body: BodyInit;
  dependsOn: string[] | undefined;
  status: number | undefined;
  statusText: string | undefined;
}

/**
 * @interface
 * Signature representing Batch response body
 * @property {KeyValuePairObject[]} responses - An array of key value pair representing response object for every request
 * @property {string} [@odata.nextLink] - The nextLink value to get next set of responses in case of asynchronous batch requests
 */
export interface BatchResponseBody {
  responses: BatchItem[];
  "@odata.nextLink"?: string;
}

/**
 * @class
 * Class that handles BatchResponseContent
 */
export class BatchResponseContent {
  /**
   * To hold the responses
   */
  private readonly responses: Map<string, Response>;

  /**
   * Holds the next link url
   */
  private nextLink: string | undefined;

  /**
   * @public
   * @constructor
   * Creates the BatchResponseContent instance
   * @param {BatchResponseBody} response - The response body returned for batch request from server
   * @returns An instance of a BatchResponseContent
   */
  public constructor(response: BatchResponseBody) {
    this.responses = new Map();
    this.update(response);
  }

  /**
   * @private
   * Creates native Response object from the json representation of it.
   * @param {BatchItem} responseJSON - The response json value
   * @returns The Response Object instance
   */
  private createResponseObject(responseJSON: BatchItem): Response {
    const body = responseJSON.body;
    const options: ResponseInit = {
      status: responseJSON.status,
      statusText: responseJSON.statusText,
      headers: responseJSON.headers,
    };

    const headers = new Headers(options.headers);
    if (headers.has("Content-Type")) {
      const contentType = headers.get("Content-Type") ?? "";
      if (contentType.split(";")[0] === "application/json") {
        const bodyString = JSON.stringify(body);
        return new Response(bodyString, options);
      }
    }
    return new Response(body, options);
  }

  /**
   * @public
   * Updates the Batch response content instance with given responses.
   * @param {BatchResponseBody} response - The response json representing batch response message
   * @returns Nothing
   */
  public update(response: BatchResponseBody): void {
    this.nextLink = response["@odata.nextLink"];
    const responses = response.responses;
    for (let i = 0, l = responses.length; i < l; i++) {
      this.responses.set(responses[i].id, this.createResponseObject(responses[i]));
    }
  }

  /**
   * @public
   * To get the response of a request for a given request id
   * @param {string} requestId - The request id value
   * @returns The Response object instance for the particular request
   */
  public getResponseById(requestId: string): Response {
    return this.responses.get(requestId)!;
  }

  /**
   * @public
   * To get all the responses of the batch request
   * @returns The Map of id and Response objects
   */
  public getResponses(): Map<string, Response> {
    return this.responses;
  }

  /**
   * @public
   * To get the iterator for the responses
   * @returns The Iterable generator for the response objects
   */
  public *getResponsesIterator(): IterableIterator<[string, Response]> {
    const iterator = this.responses.entries();
    let cur = iterator.next();
    while (!cur.done) {
      yield cur.value;
      cur = iterator.next();
    }
  }
}
