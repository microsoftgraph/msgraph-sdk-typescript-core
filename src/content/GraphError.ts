/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

/**
 * @module GraphError
 */

/**
 * @interface
 * Signature represents key value pair object
 */
import { Parsable, ParseNode, AdditionalDataHolder, BackedModel, ApiError } from "@microsoft/kiota-abstractions";

/**
 * @interface
 * Signature represents the structure of an error response
 */
export interface GraphError extends ApiError, AdditionalDataHolder, BackedModel {
  /**
   * Stores additional data not described in the OpenAPI description found when deserializing. Can be used for serialization as well.
   */
  additionalData?: Record<string, unknown>;
  /**
   * Stores model information.
   */
  backingStoreEnabled?: boolean | null;
}

/**
 * Creates a new instance of the appropriate class based on discriminator value
 * @param _parseNode
 */
export const createGraphErrorFromDiscriminatorValue = (
  _parseNode: ParseNode | undefined,
): ((instance?: Parsable) => Record<string, (node: ParseNode) => void>) => {
  return deserializeIntoGraphError;
};

/**
 * Deserializes the batch item
 * @param graphError
 */
export const deserializeIntoGraphError = (
  graphError: Partial<GraphError> | undefined = {},
): Record<string, (node: ParseNode) => void> => {
  return {
    backingStoreEnabled: _n => {
      graphError.backingStoreEnabled = true;
    },
  };
};
