/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import { ErrorMappings, ResponseHandler } from "@microsoft/kiota-abstractions";

/**
 * @class
 * Class for LargeFileResponseHandler
 */
export class LargeFileResponseHandler implements ResponseHandler {
  handleResponse<NativeResponseType, ModelType>(
    _response: NativeResponseType,
    _errorMappings: ErrorMappings | undefined,
  ): Promise<ModelType | undefined> {
    return Promise.resolve(undefined);
  }
}
