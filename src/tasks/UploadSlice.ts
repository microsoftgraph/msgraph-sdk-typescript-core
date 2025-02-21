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

  /**
   * Uploads a slice of the file to the server.
   *
   * @param {ReadableStream<Uint8Array>} stream - The stream of the file slice to be uploaded.
   * @returns {Promise<UploadResult<T> | undefined>} - The result of the upload operation.
   */
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

    let itemResponse = await this.requestAdapter.send<T>(requestInformation, this.parsableFactory, this.errorMappings);

    const locations = headerOptions.getResponseHeaders().get("location");

    let uploadSession: UploadSession | null = null;
    if (itemResponse) {
      const { expirationDateTime, nextExpectedRanges } = itemResponse as Partial<UploadSession>;
      if (nextExpectedRanges) {
        uploadSession = {
          expirationDateTime,
          nextExpectedRanges: (nextExpectedRanges as unknown as string[])[0].split(","),
        };
        itemResponse = undefined;
      }
    }

    return {
      itemResponse,
      location: locations ? (locations as unknown as string[])[0] : undefined,
      uploadSession,
    };
  }

  /**
   * Reads a section of the stream from the specified start to end positions.
   *
   * @param {ReadableStream<Uint8Array>} stream - The stream to read from.
   * @param {number} start - The starting byte position.
   * @param {number} end - The ending byte position.
   * @returns {Promise<ArrayBuffer>} - A promise that resolves to an ArrayBuffer containing the read bytes.
   */
  private async readSection(stream: ReadableStream<Uint8Array>, start: number, end: number): Promise<ArrayBuffer> {
    const reader = stream.getReader();
    let bytesRead = 0;
    const chunks: Uint8Array[] = [];
    const totalBytesToRead = end - start;

    try {
      while (bytesRead < totalBytesToRead) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          const remainingBytes = totalBytesToRead - bytesRead;
          if (value.length > remainingBytes) {
            chunks.push(value.slice(0, remainingBytes));
            bytesRead += remainingBytes;
          } else {
            chunks.push(value);
            bytesRead += value.length;
          }
        }
      }
    } finally {
      reader.releaseLock();
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
