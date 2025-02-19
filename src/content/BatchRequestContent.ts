import { RequestAdapter, RequestInformation, HttpMethod, createGuid } from "@microsoft/kiota-abstractions";
import {
  BatchItem,
  BatchRequestCollection,
  BatchResponseCollection,
  createBatchResponseContentFromDiscriminatorValue,
  serializeBatchRequestBody,
} from "./BatchItem";
import { BatchResponseContent } from "./BatchResponseContent";
import { ErrorMappings } from "@microsoft/kiota-abstractions/dist/es/src/requestAdapter";
import { createGraphErrorFromDiscriminatorValue } from "./GraphError";

/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

/**
 * @module BatchRequestContent
 */

/**
 * @interface
 * Signature represents key value pair object
 */
export class BatchRequestContent {
  /**
   * @private
   * @static
   * Limit for number of requests {@link - https://developer.microsoft.com/en-us/graph/docs/concepts/known_issues#json-batching}
   */
  private static get requestLimit() {
    return 20;
  }

  /**
   * @public
   * To keep track of requests, key will be id of the request and value will be the request json
   */
  public requests: Map<string, BatchItem>;

  /**
   * @private
   * @static
   * Executes the requests in the batch request content
   */
  private readonly requestAdapter: RequestAdapter;

  constructor(requestAdapter: RequestAdapter) {
    this.requests = new Map<string, BatchItem>();
    this.requestAdapter = requestAdapter;
  }

  /**
   * @private
   * @static
   * Validates the dependency chain of the requests
   *
   * Note:
   * Individual requests can depend on other individual requests. Currently, requests can only depend on a single other request, and must follow one of these three patterns:
   * 1. Parallel - no individual request states a dependency in the dependsOn property.
   * 2. Serial - all individual requests depend on the previous individual request.
   * 3. Same - all individual requests that state a dependency in the dependsOn property, state the same dependency.
   * As JSON batching matures, these limitations will be removed.
   * @see {@link https://developer.microsoft.com/en-us/graph/docs/concepts/known_issues#json-batching}
   *
   * @param {Map<string, BatchRequestStep>} requests - The map of requests.
   * @returns The boolean indicating the validation status
   */

  private static validateDependencies(requests: Map<string, BatchItem>): boolean {
    const isParallel = (reqs: Map<string, BatchItem>): boolean => {
      const iterator = reqs.entries();
      let cur = iterator.next();
      while (!cur.done) {
        const curReq = cur.value[1];
        if (curReq.dependsOn !== undefined && curReq.dependsOn.length > 0) {
          return false;
        }
        cur = iterator.next();
      }
      return true;
    };
    const isSerial = (reqs: Map<string, BatchItem>): boolean => {
      const iterator = reqs.entries();
      let cur = iterator.next();
      if (cur.done || cur.value === undefined) return false;
      const firstRequest: BatchItem = cur.value[1];
      if (firstRequest.dependsOn !== undefined && firstRequest.dependsOn.length > 0) {
        return false;
      }
      let prev = cur;
      cur = iterator.next();
      while (!cur.done) {
        const curReq: BatchItem = cur.value[1];
        if (
          curReq.dependsOn === undefined ||
          curReq.dependsOn.length !== 1 ||
          curReq.dependsOn[0] !== prev.value[1].id
        ) {
          return false;
        }
        prev = cur;
        cur = iterator.next();
      }
      return true;
    };
    const isSame = (reqs: Map<string, BatchItem>): boolean => {
      const iterator = reqs.entries();
      let cur = iterator.next();
      if (cur.done || cur.value === undefined) return false;
      const firstRequest: BatchItem = cur.value[1];
      let dependencyId: string;
      if (firstRequest.dependsOn === undefined || firstRequest.dependsOn.length === 0) {
        dependencyId = firstRequest.id;
      } else {
        if (firstRequest.dependsOn.length === 1) {
          const fDependencyId = firstRequest.dependsOn[0];
          if (fDependencyId !== firstRequest.id && reqs.has(fDependencyId)) {
            dependencyId = fDependencyId;
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
      cur = iterator.next();
      while (!cur.done) {
        const curReq = cur.value[1];
        if ((curReq.dependsOn === undefined || curReq.dependsOn.length === 0) && dependencyId !== curReq.id) {
          return false;
        }
        if (curReq.dependsOn !== undefined && curReq.dependsOn.length !== 0) {
          if (curReq.dependsOn.length === 1 && (curReq.id === dependencyId || curReq.dependsOn[0] !== dependencyId)) {
            return false;
          }
          if (curReq.dependsOn.length > 1) {
            return false;
          }
        }
        cur = iterator.next();
      }
      return true;
    };
    if (requests.size === 0) {
      const error = new Error("Empty requests map, Please provide at least one request.");
      error.name = "Empty Requests Error";
      throw error;
    }
    return isParallel(requests) || isSerial(requests) || isSame(requests);
  }

  /**
   * @public
   * Adds a request to the batch request content
   * @param {BatchRequestStep} request - The request value
   * @returns The id of the added request
   */
  private addRequest(request: BatchItem): string {
    const limit = BatchRequestContent.requestLimit;
    if (request.id === "") {
      const error = new Error(`Id for a request is empty, Please provide an unique id`);
      error.name = "Empty Id For Request";
      throw error;
    }
    if (this.requests.size === limit) {
      const error = new Error(`Maximum requests limit exceeded, Max allowed number of requests are ${limit}`);
      error.name = "Limit Exceeded Error";
      throw error;
    }
    if (this.requests.has(request.id)) {
      const error = new Error(`Adding request with duplicate id ${request.id}, Make the id of the requests unique`);
      error.name = "Duplicate RequestId Error";
      throw error;
    }
    this.requests.set(request.id, request);
    return request.id;
  }

  /**
   * @public
   * Receives a request information object, converts it and adds it to the batch request execution chain
   * @param requestInformation
   */
  public addBatchRequest(requestInformation: RequestInformation): BatchItem {
    const batchItem = this.toBatchItem(requestInformation);
    this.addRequest(batchItem);
    return batchItem;
  }

  private toBatchItem(requestInformation: RequestInformation): BatchItem {
    if (requestInformation.pathParameters && requestInformation.pathParameters.baseurl === undefined) {
      requestInformation.pathParameters.baseurl = this.requestAdapter.baseUrl;
    }

    // TODO replace url from path parameters

    const content = requestInformation.content ? new TextDecoder().decode(requestInformation.content) : undefined;
    let body: Map<string, any> | undefined;
    if (content !== undefined) {
      body = new Map<string, any>(Object.entries(JSON.parse(content) as { [s: string]: any }));
    }

    let headers: Record<string, any> | undefined;
    if (headers !== undefined) {
      headers = Object.fromEntries(requestInformation.headers.entries()) as unknown as Record<string, string>;
    }

    const uriString = requestInformation.URL;
    const url = uriString.replace(this.requestAdapter.baseUrl, "");

    const method = requestInformation.httpMethod?.toString();

    return {
      id: createGuid(),
      method: method!,
      url,
      headers,
      body,
    };
  }

  public readonly getContent = (): BatchRequestCollection => {
    const content = {
      requests: Array.from(this.requests.values()),
    };
    if (!BatchRequestContent.validateDependencies(this.requests)) {
      const error = new Error("Invalid dependency chain found in the requests, Please provide valid dependency chain");
      error.name = "Invalid Dependency Chain Error";
      throw error;
    }
    return content;
  };

  /**
   * @public
   * @async
   * Executes the batch request
   * @param errorMappings - The error mappings to be used while deserializing the response
   */
  public async postAsync(errorMappings?: ErrorMappings): Promise<BatchResponseContent | undefined> {
    const requestInformation = new RequestInformation();
    requestInformation.httpMethod = HttpMethod.POST;
    requestInformation.urlTemplate = "{+baseurl}/$batch";

    const content = this.getContent();
    requestInformation.setContentFromParsable(
      this.requestAdapter,
      "application/json",
      content,
      serializeBatchRequestBody,
    );

    requestInformation.headers.add("Content-Type", "application/json");

    if (!errorMappings) {
      errorMappings = {
        XXX: parseNode => createGraphErrorFromDiscriminatorValue(parseNode),
      };
    }

    const result = await this.requestAdapter.send<BatchResponseCollection>(
      requestInformation,
      createBatchResponseContentFromDiscriminatorValue,
      errorMappings,
    );

    if (result === undefined) {
      return undefined;
    } else {
      return new BatchResponseContent(result);
    }
  }
}
