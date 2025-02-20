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
  isUntypedString,
  isUntypedBoolean,
  isUntypedNull,
  isUntypedNumber,
  isUntypedArray,
  isUntypedObject,
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
}

/**
 * @interface
 * Signature represents unwrapped payload structure for batch response
 */
export interface BatchResponse {
  id: string;
  headers?: Record<string, string> | null;
  body?: Record<string, unknown> | null;
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
    writer.writeStringValue("method", batchRequestData.method);
    writer.writeStringValue("url", batchRequestData.url);
    const headers: UntypedNode = {
      getValue: (): unknown => batchRequestData.headers,
      value: batchRequestData.headers,
    };
    writer.writeObjectValue("headers", headers);
    const body: UntypedNode = {
      getValue: (): unknown => batchRequestData.body,
      value: batchRequestData.body,
    };
    writer.writeObjectValue("body", body);
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
 * @param batchResponse
 */
export const deserializeIntoBatchResponse = (
  batchResponse: Partial<BatchResponse> | undefined = {},
): Record<string, (node: ParseNode) => void> => {
  return {
    id: n => {
      batchResponse.id = n.getStringValue();
    },
    headers: n => {
      const headers: UntypedNode = n.getObjectValue<UntypedNode>(createUntypedNodeFromDiscriminatorValue);
      batchResponse.headers = getUntypedNodeValue(headers) as Record<string, string> | null;
    },
    body: n => {
      const body: UntypedNode = n.getObjectValue<UntypedNode>(createUntypedNodeFromDiscriminatorValue);
      batchResponse.body = getUntypedNodeValue(body) as Record<string, unknown> | null;
    },
    status: n => {
      batchResponse.status = n.getNumberValue();
    },
  };
};

/**
 * @private
 * Unwraps the untyped node value
 * @param untypedValue
 */
const getUntypedNodeValue = (untypedValue: UntypedNode | null | undefined): unknown => {
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
    return untypedValue.getValue().map((item: UntypedNode) => getUntypedNodeValue(item));
  } else if (isUntypedObject(untypedValue)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(untypedValue.getValue())) {
      result[key] = getUntypedNodeValue(value);
    }
    return result;
  }
  throw new Error("Unsupported untyped node type");
};
