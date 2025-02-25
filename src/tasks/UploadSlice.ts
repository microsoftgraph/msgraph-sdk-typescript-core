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
  type AdditionalDataHolder,
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
  public async uploadSlice(stream: ReadableStream<Uint8Array>): Promise<UploadResult<T> | UploadSession | undefined> {
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

    if (itemResponse) {
      let sessionResponse = this.isUploadSessionResponse(itemResponse);
      if (sessionResponse) {
        return sessionResponse;
      }
      const { additionalData } = itemResponse as Partial<AdditionalDataHolder>;
      if (additionalData) {
        sessionResponse = this.isUploadSessionResponse(additionalData);
        if (sessionResponse) {
          return sessionResponse;
        }
      }
    }

    return {
      itemResponse,
      location: locations ? (locations as unknown as string[])[0] : undefined,
    };
  }

  private isUploadSessionResponse(item: Parsable | AdditionalDataHolder): UploadSession | null {
    const { expirationDateTime, nextExpectedRanges } = item as Partial<UploadSession>;
    if (nextExpectedRanges) {
      return {
        expirationDateTime,
        nextExpectedRanges,
      };
    }
    return null;
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
    if (start < 0 || end < start) {
      throw new Error("Invalid start or end values.");
    }

    const reader = stream.getReader();
    let position = 0; // current absolute position in the stream
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;

        const chunk = value;
        const chunkLength = chunk.byteLength;

        // If the entire chunk is before our start, skip it.
        if (position + chunkLength <= start) {
          position += chunkLength;
          continue;
        }

        // If we've already passed the end, we can stop reading.
        if (position > end) break;

        // Calculate the start index within the current chunk.
        const startIndex = position < start ? start - position : 0;
        // Calculate the end index within the current chunk.
        // Since `end` is inclusive, we need to slice up to (end - position + 1).
        let endIndex = chunkLength;
        if (position + chunkLength - 1 > end) {
          endIndex = end - position + 1;
        }

        const sliced = chunk.slice(startIndex, endIndex);
        chunks.push(sliced);
        totalLength += sliced.byteLength;

        position += chunkLength;
        // Stop reading if we've already reached beyond the desired range.
        if (position > end) break;
      }
    } finally {
      reader.releaseLock();
    }

    // Concatenate all collected chunks into one Uint8Array.
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return result.buffer;
  }
}
