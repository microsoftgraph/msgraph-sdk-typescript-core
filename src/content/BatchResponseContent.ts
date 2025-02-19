/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

/**
 * @module BatchResponseContent
 */

import { UntypedBatchResponse, BatchResponseCollection, BatchResponse } from "./BatchItem";
import {
  UntypedNode,
  isUntypedString,
  isUntypedBoolean,
  isUntypedNull,
  isUntypedNumber,
  isUntypedArray,
  isUntypedObject,
} from "@microsoft/kiota-abstractions";

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
      this.responses.set(responses[i].id, this.convertFromBatchItem(responses[i]));
    }
  }

  /**
   * @private
   * Converts the untyped batch item to typed batch response
   * @param batchItem
   */
  private convertFromBatchItem(batchItem: UntypedBatchResponse): BatchResponse {
    return {
      id: batchItem.id,
      headers: this.getUntypedNodeValue(batchItem.headers) as Record<string, string> | null,
      body: this.getUntypedNodeValue(batchItem.body) as Record<string, unknown> | null,
      status: batchItem.status,
    };
  }

  /**
   * @private
   * Unwraps the untyped node value
   * @param untypedValue
   */
  private getUntypedNodeValue(untypedValue: UntypedNode | null | undefined): unknown {
    if (!untypedValue) {
      return null;
    }
    if (
      isUntypedString(untypedValue) ||
      isUntypedBoolean(untypedValue) ||
      isUntypedNull(untypedValue) ||
      isUntypedNumber(untypedValue)
    ) {
      return untypedValue.getValue();
    } else if (isUntypedArray(untypedValue)) {
      return untypedValue.getValue().map((item: UntypedNode) => this.getUntypedNodeValue(item));
    } else if (isUntypedObject(untypedValue)) {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(untypedValue.getValue())) {
        result[key] = this.getUntypedNodeValue(value);
      }
      return result;
    }
    throw new Error("Unsupported untyped node type");
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
