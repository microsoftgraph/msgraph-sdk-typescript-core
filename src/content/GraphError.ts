import {
  createUntypedNodeFromDiscriminatorValue,
  Parsable,
  ParseNode,
  UntypedNode,
} from "@microsoft/kiota-abstractions";

export interface GraphError {
  /**
   * Stores additional data not described in the OpenAPI description found when deserializing. Can be used for serialization as well.
   */
  additionalData?: Record<string, unknown>;
  /**
   * Stores model information.
   */
  backingStoreEnabled?: boolean | null;
  /**
   * The error property
   */
  error?: UntypedNode | null;
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
    error: n => {
      graphError.error = n.getObjectValue<UntypedNode>(createUntypedNodeFromDiscriminatorValue);
    },
  };
};
