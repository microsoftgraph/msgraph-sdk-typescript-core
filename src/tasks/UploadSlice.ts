/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import {
  ErrorMappings,
  Headers,
  HttpMethod,
  Parsable,
  ParsableFactory,
  RequestAdapter,
  RequestInformation,
} from "@microsoft/kiota-abstractions";
import { HeadersInspectionOptions } from "@microsoft/kiota-http-fetchlibrary";
import { UploadResult, UploadSession } from "./LargeFileUploadTask";

const binaryContentType = "application/octet-stream";

/**
 * @class
 * Class for UploadSlice
 */
export class UploadSlice<T extends Parsable> {
  constructor(
    readonly requestAdapter: RequestAdapter,
    readonly sessionUrl: string,
    readonly rangeBegin: number,
    readonly rangeEnd: number,
    readonly totalSessionLength: number,
    readonly parsableFactory: ParsableFactory<T>,
    readonly errorMappings: ErrorMappings,
  ) {}

  public async uploadSlice(stream: ReadableStream<Uint8Array>): Promise<UploadResult<T> | undefined> {
    const data = await this.readSection(stream, this.rangeBegin, this.rangeEnd);
    const requestInformation = new RequestInformation(HttpMethod.PUT, this.sessionUrl);
    requestInformation.headers = new Headers([
      ["Content-Range", new Set([`bytes ${this.rangeBegin}-${this.rangeEnd - 1}/${this.totalSessionLength}`])],
      ["Content-Length", new Set([`${this.rangeEnd - this.rangeBegin}`])],
    ]);
    requestInformation.setStreamContent(data, binaryContentType);

    const headerOptions = new HeadersInspectionOptions({ inspectResponseHeaders: true });
    requestInformation.addRequestOptions([headerOptions]);

    const itemResponse = await this.requestAdapter.send<T>(
      requestInformation,
      this.parsableFactory,
      this.errorMappings,
    );

    const locations = headerOptions.getResponseHeaders().get("location");

    let uploadSession: UploadSession | null = null;
    if (itemResponse && ("expirationDateTime" in itemResponse || "additionalData" in itemResponse)) {
      uploadSession = {};
      if ("expirationDateTime" in itemResponse)
        uploadSession.expirationDateTime = itemResponse.expirationDateTime as Date | null;
      if ("nextExpectedRanges" in itemResponse)
        uploadSession.nextExpectedRanges = itemResponse.nextExpectedRanges as string[] | null;
    }

    return {
      itemResponse,
      location: locations ? (locations as unknown as string[])[0] : undefined,
      uploadSession,
    };
  }

  private async readSection(stream: ReadableStream<Uint8Array>, start: number, end: number): Promise<ArrayBuffer> {
    const reader = stream.getReader();
    let bytesRead = 0;
    const chunks: Uint8Array[] = [];

    while (bytesRead < end - start + 1) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      bytesRead += value.length;
    }

    const result = new Uint8Array(bytesRead);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result.buffer;
  }
}
