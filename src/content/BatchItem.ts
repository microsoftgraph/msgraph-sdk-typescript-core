/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

/**
 * @module BatchItem
 */

/**
 * @interface
 * Signature represents key value pair object
 */
import {
  Parsable,
  ParseNode,
  SerializationWriter,
  UntypedNode,
  createUntypedNodeFromDiscriminatorValue,
} from "@microsoft/kiota-abstractions";

/**
 * @interface
 * Signature represents payload structure for batch request and response
 */
export interface BatchItem {
  readonly id: string;
  method: string;
  url: string;
  headers?: Record<string, string> | null;
  body?: Record<string, any> | null;
  dependsOn?: string[];
  status?: number;
}

/**
 * @interface
 * Signature represents payload structure for batch response
 */
export interface BatchResponse {
  id: string;
  method: string;
  url: string;
  headers?: UntypedNode | null;
  body?: UntypedNode | null;
  dependsOn?: string[];
  status?: number;
}

/**
 * @interface
 * Signature representing Batch request body
 */
export interface BatchRequestCollection {
  requests: BatchItem[];
}

/**
 * @interface
 * Signature representing Batch response body
 */
export interface BatchResponseCollection {
  responses: BatchResponse[];
}

/**
 * Serializes the batch request body
 * @param writer
 * @param batchRequestBody
 */
export const serializeBatchRequestBody = (
  writer: SerializationWriter,
  batchRequestBody: Partial<BatchRequestCollection> | undefined | null = {},
): void => {
  if (batchRequestBody) {
    writer.writeCollectionOfObjectValues("requests", batchRequestBody.requests, serializeBatchItem);
  }
};

/**
 * Serializes the batch item
 * @param writer
 * @param batchRequestData
 */
export const serializeBatchItem = (
  writer: SerializationWriter,
  batchRequestData: Partial<BatchItem> | undefined | null = {},
): void => {
  if (batchRequestData) {
    writer.writeStringValue("id", batchRequestData.id);
    writer.writeCollectionOfPrimitiveValues("dependsOn", batchRequestData.dependsOn);
  }
};

/**
 * BatchResponseCollection ParsableFactory
 * @param _parseNode
 */
export const createBatchResponseContentFromDiscriminatorValue = (
  _parseNode: ParseNode | undefined,
): ((instance?: Parsable) => Record<string, (node: ParseNode) => void>) => {
  return deserializeIntoBatchResponseContent;
};

/**
 * Deserializes the batch response body
 * @param batchResponseBody
 */
export const deserializeIntoBatchResponseContent = (
  batchResponseBody: Partial<BatchResponseCollection> | undefined = {},
): Record<string, (node: ParseNode) => void> => {
  return {
    responses: n => {
      batchResponseBody.responses = n.getCollectionOfObjectValues(createBatchResponseFromDiscriminatorValue);
    },
  };
};

/**
 * BatchItem ParsableFactory
 * @param _parseNode
 */
export const createBatchResponseFromDiscriminatorValue = (
  _parseNode: ParseNode | undefined,
): ((instance?: Parsable) => Record<string, (node: ParseNode) => void>) => {
  return deserializeIntoBatchResponse;
};

/**
 * Deserializes the batch item
 * @param batchItem
 */
export const deserializeIntoBatchResponse = (
  batchItem: Partial<BatchResponse> | undefined = {},
): Record<string, (node: ParseNode) => void> => {
  return {
    id: n => {
      batchItem.id = n.getStringValue();
    },
    method: n => {
      batchItem.method = n.getStringValue();
    },
    url: n => {
      batchItem.url = n.getStringValue();
    },
    dependsOn: n => {
      batchItem.dependsOn = n.getCollectionOfPrimitiveValues();
    },
    headers: n => {
      batchItem.headers = n.getObjectValue<UntypedNode>(createUntypedNodeFromDiscriminatorValue);
    },
    body: n => {
      batchItem.body = n.getObjectValue<UntypedNode>(createUntypedNodeFromDiscriminatorValue);
    },
  };
};
