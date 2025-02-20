/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

/**
 * @module BatchResponseContent
 */

import { BatchResponseCollection, BatchResponse } from "./BatchItem";

/**
 * @class
 * Class that handles BatchResponseContent
 */
export class BatchResponseContent {
  /**
   * To hold the responses
   */
  private readonly responses: Map<string, BatchResponse>;

  /**
   * @public
   * @constructor
   * Creates the BatchResponseContent instance
   * @param {BatchResponseCollection} response - The response body returned for batch request from server
   * @returns An instance of a BatchResponseContent
   */
  public constructor(response: BatchResponseCollection) {
    this.responses = new Map();
    this.update(response);
  }

  /**
   * @public
   * Updates the Batch response content instance with given responses.
   * @param {BatchResponseCollection} response - The response json representing batch response message
   * @returns Nothing
   */
  public update(response: BatchResponseCollection): void {
    const responses = response.responses;
    for (let i = 0, l = responses.length; i < l; i++) {
      this.responses.set(responses[i].id, responses[i]);
    }
  }

  /**
   * @public
   * To get the response of a request for a given request id
   * @param {string} requestId - The request id value
   * @returns The Response object instance for the particular request
   */
  public getResponseById(requestId: string): BatchResponse | undefined {
    return this.responses.get(requestId);
  }

  /**
   * @public
   * To get all the responses of the batch request
   * @returns The Map object containing the response objects
   */
  public getResponses(): Map<string, BatchResponse> {
    return this.responses;
  }

  /**
   * @public
   * To get the iterator for the responses
   * @returns The Iterable generator for the response objects
   */
  public *getResponsesIterator(): IterableIterator<[string, BatchResponse]> {
    const iterator = this.responses.entries();
    let cur = iterator.next();
    while (!cur.done) {
      yield cur.value;
      cur = iterator.next();
    }
  }
}
