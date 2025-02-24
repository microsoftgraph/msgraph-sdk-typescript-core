/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

/**
 * @module LargeFileUploadTask
 **/

import {
  Parsable,
  RequestAdapter,
  RequestInformation,
  ParsableFactory,
  ParseNode,
  ErrorMappings,
  HttpMethod,
} from "@microsoft/kiota-abstractions";
import { UploadSlice } from "./UploadSlice";

/**
 * @interface
 * Signature to represent progress receiver
 * @property {number} progress - The progress value
 */
export interface IProgress {
  report(progress: number): void;
}

/**
 * @interface
 * Signature to represent an upload session, i.e the response returned by the server after for a pending upload
 *
 * @property {Date} expirationDateTime - The expiration time of the session
 * @property {string[]} nextExpectedRanges - The next expected ranges
 * @property {string} odataType - The type of the object
 * @property {string} uploadUrl - The URL to which the file upload needs to be done
 */
export interface UploadSession {
  expirationDateTime?: Date | null;
  nextExpectedRanges?: string[] | null;
  odataType?: string | null;
  uploadUrl?: string | null;
}

/**
 * @interface
 * Signature to represent the result of an upload
 */
export interface UploadResult<T> {
  itemResponse?: T | null;
  location?: string;
}

/**
 * UploadSession ParsableFactory
 * Creates a factory function to deserialize the upload session response.
 *
 * @param {ParseNode} _parseNode - The parse node to deserialize.
 * @returns {Function} - A function that takes an instance of Parsable and returns a record of deserialization functions.
 */
export const createUploadSessionFromDiscriminatorValue = (
  _parseNode: ParseNode | undefined,
): ((instance?: Parsable) => Record<string, (node: ParseNode) => void>) => {
  return deserializeIntoUploadSession;
};

/**
 * Deserializes the upload session response body.
 *
 * @param {Partial<UploadSession>} [uploadSession] - The upload session object to deserialize into.
 * @returns {Record<string, (node: ParseNode) => void>} - A record of deserialization functions.
 */
export const deserializeIntoUploadSession = (
  uploadSession: Partial<UploadSession> | undefined = {},
): Record<string, (node: ParseNode) => void> => {
  return {
    expirationDateTime: n => {
      uploadSession.expirationDateTime = n.getDateValue();
    },
    nextExpectedRanges: n => {
      uploadSession.nextExpectedRanges = n.getCollectionOfPrimitiveValues();
    },
    "@odata.type": n => {
      uploadSession.odataType = n.getStringValue();
    },
    uploadUrl: n => {
      uploadSession.uploadUrl = n.getStringValue();
    },
  };
};

/**
 * @constant
 * A default slice size for a large file
 */
const DefaultSliceSize = 320 * 1024;

/**
 * A class representing LargeFileUploadTask
 */
export class LargeFileUploadTask<T extends Parsable> {
  /**
   * @private
   * The ranges to upload
   */
  rangesRemaining: number[][] = [];

  /**
   * @private
   * The error mappings
   */
  errorMappings: ErrorMappings;

  /**
   * @private
   * The upload session
   */
  Session: UploadSession;

  /**
   * Constructs a new instance of the LargeFileUploadTask class.
   *
   * @param {RequestAdapter} requestAdapter - The request adapter to use for making HTTP requests.
   * @param {Parsable} uploadSession - The upload session information.
   * @param {ReadableStream<Uint8Array>} uploadStreamProvider - Returns an instance of an unconsumed new stream to be uploaded.
   * @param {number} [maxSliceSize=-1] - The maximum size of each file slice to be uploaded.
   * @param {ParsableFactory<T>} parsableFactory - The factory to create parsable objects.
   * @param {ErrorMappings} [errorMappings] - error mappings.
   *
   * @throws {Error} If any of the required parameters are undefined or invalid.
   */
  constructor(
    readonly requestAdapter: RequestAdapter,
    readonly uploadSession: Parsable,
    readonly uploadStreamProvider: () => ReadableStream<Uint8Array>,
    readonly maxSliceSize = -1,
    readonly parsableFactory: ParsableFactory<T>,
    errorMappings: ErrorMappings,
  ) {
    if (!uploadSession) {
      const error = new Error("Upload session is undefined, Please provide a valid upload session");
      error.name = "Invalid Upload Session Error";
      throw error;
    }
    if (!uploadStreamProvider) {
      const error = new Error("Upload stream provider is undefined, Please provide a valid upload stream");
      error.name = "Invalid Upload Stream Error";
      throw error;
    }
    if (!requestAdapter) {
      const error = new Error("Request adapter is undefined, Please provide a valid request adapter");
      error.name = "Invalid Request Adapter Error";
      throw error;
    }
    if (!parsableFactory) {
      const error = new Error("Parsable factory is undefined, Please provide a valid parsable factory");
      error.name = "Invalid Parsable Factory Error";
      throw error;
    }
    if (maxSliceSize <= 0) {
      this.maxSliceSize = DefaultSliceSize;
    }
    this.parsableFactory = parsableFactory;

    this.Session = this.extractSessionInfo(uploadSession);
    this.rangesRemaining = this.getRangesRemaining(this.Session);
    this.errorMappings = errorMappings;
  }

  /**
   * Uploads the file in a sequential order by slicing the file in terms of ranges.
   *
   * @param {IProgress} [progress] - Optional progress receiver to report upload progress.
   * @returns {Promise<UploadResult<T>>} - The result of the upload.
   * @throws {Error} If the upload fails.
   */
  public async upload(progress?: IProgress): Promise<UploadResult<T>> {
    const sliceRequests = this.getUploadSliceRequests();
    for (const request of sliceRequests) {
      try {
        const uploadResult = await this.uploadWithRetry(request);
        progress?.report(request.rangeEnd);
        const { itemResponse, location } = uploadResult as Partial<UploadResult<T>>;
        if (itemResponse || location) {
          return uploadResult as UploadResult<T>;
        }
      } catch (e) {
        console.error(e);
      }
    }
    throw new Error("Upload failed");
  }

  /**
   * Uploads a slice with retry logic.
   *
   * @param {UploadSlice<T>} uploadSlice - The upload slice to be uploaded.
   * @param {number} [maxTries=3] - The maximum number of retry attempts.
   * @returns {Promise<UploadResult<T> | UploadSession | undefined>} - The result of the upload.
   * @throws {Error} If the maximum number of retries is reached.
   */
  private async uploadWithRetry(
    uploadSlice: UploadSlice<T>,
    maxTries = 3,
  ): Promise<UploadResult<T> | UploadSession | undefined> {
    let uploadTries = 0;
    while (uploadTries < maxTries) {
      try {
        return await uploadSlice.uploadSlice(this.uploadStreamProvider());
      } catch (e) {
        console.error(e);
      }
      uploadTries++;

      if (uploadTries < maxTries) {
        // Exponential backoff
        await this.sleep(2000 * (uploadTries + 1));
      }
    }

    throw new Error("Max retries reached");
  }

  /**
   * @public
   * Resumes the current upload session
   * @param progress
   */
  public async resume(progress?: IProgress): Promise<UploadResult<T>> {
    await this.updateSession();
    return this.upload(progress);
  }

  /**
   * Refreshes the current upload session status by making a GET request to the upload URL.
   * Updates the session expiration date, next expected ranges, and remaining ranges based on the response.
   *
   * @returns {Promise<UploadSession>} - A promise that resolves to the updated upload session.
   * @throws {Error} If the request fails.
   */
  public async updateSession(): Promise<UploadSession> {
    const url = this.Session.uploadUrl;
    if (!url) {
      throw new Error("Upload url is invalid");
    }
    const requestInformation = new RequestInformation(HttpMethod.GET, url);
    const response = await this.requestAdapter.send<UploadSession>(
      requestInformation,
      createUploadSessionFromDiscriminatorValue,
      this.errorMappings,
    );

    if (response) {
      this.Session.expirationDateTime = response?.expirationDateTime;
      this.Session.nextExpectedRanges = response.nextExpectedRanges;
      if (response.uploadUrl) {
        this.Session.uploadUrl = response.uploadUrl;
      }
      this.rangesRemaining = this.getRangesRemaining(this.Session);
    }
    return response;
  }

  /**
   * Deletes the current upload session.
   * Sends a PUT request to the upload URL to cancel the session.
   *
   * @returns {Promise<void>} A promise that resolves when the session is canceled.
   */
  public async deleteSession(): Promise<void> {
    const requestInformation = new RequestInformation(HttpMethod.DELETE, this.Session.uploadUrl!);
    await this.requestAdapter.sendNoResponseContent(requestInformation, this.errorMappings);
  }

  /**
   * Extracts the upload session information from a parsable object.
   *
   * @param {Parsable} parsable - The parsable object containing the upload session information.
   * @returns {UploadSession} - The extracted upload session information.
   */
  private extractSessionInfo(parsable: Parsable): UploadSession {
    const { expirationDateTime, nextExpectedRanges, odataType, uploadUrl } = parsable as Partial<UploadSession>;
    if (!nextExpectedRanges || !uploadUrl || nextExpectedRanges.length === 0) {
      throw new Error("Upload session is invalid");
    }
    return {
      expirationDateTime: expirationDateTime ?? null,
      nextExpectedRanges: nextExpectedRanges ?? null,
      odataType: odataType ?? null,
      uploadUrl: uploadUrl ?? null,
    };
  }

  /**
   * Pauses execution for a specified number of milliseconds.
   *
   * @param {number} ms - The number of milliseconds to sleep.
   * @returns {Promise<void>} A promise that resolves after the specified time.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generates a list of upload slice requests based on the remaining ranges to be uploaded.
   *
   * @private
   * @returns {UploadSlice<T>[]} An array of UploadSlice objects representing the upload requests.
   */
  private getUploadSliceRequests(): UploadSlice<T>[] {
    const uploadSlices: UploadSlice<T>[] = [];
    const rangesRemaining = this.rangesRemaining;
    const session = this.Session;
    rangesRemaining.forEach(range => {
      let currentRangeBegin = range[0];
      while (currentRangeBegin <= range[1]) {
        const nextSliceSize = this.nextSliceSize(currentRangeBegin, range[1]);
        const uploadRequest = new UploadSlice<T>(
          this.requestAdapter,
          session.uploadUrl!,
          currentRangeBegin,
          currentRangeBegin + nextSliceSize - 1,
          range[1] + 1,
          this.parsableFactory,
          this.errorMappings,
        );
        uploadSlices.push(uploadRequest);
        currentRangeBegin += nextSliceSize;
      }
    });
    return uploadSlices;
  }

  /**
   * Calculates the size of the next slice to be uploaded.
   *
   * @param {number} currentRangeBegin - The beginning of the current range.
   * @param {number} currentRangeEnd - The end of the current range.
   * @returns {number} - The size of the next slice.
   */
  private nextSliceSize(currentRangeBegin: number, currentRangeEnd: number): number {
    const sizeBasedOnRange = currentRangeEnd - currentRangeBegin + 1;
    return sizeBasedOnRange > this.maxSliceSize ? this.maxSliceSize : sizeBasedOnRange;
  }

  /**
   * @private
   * Parses the upload session response and returns a nested number array of ranges pending upload
   * @param uploadSession
   */
  private getRangesRemaining(uploadSession: UploadSession): number[][] {
    // nextExpectedRanges: https://dev.onedrive.com/items/upload_large_files.htm
    // Sample: ["12345-55232","77829-99375"]
    // Also, second number in range can be blank, which means 'until the end'
    const ranges: number[][] = [];
    uploadSession.nextExpectedRanges?.forEach(rangeString => {
      const rangeArray = rangeString.split("-");
      ranges.push([parseInt(rangeArray[0], 10), parseInt(rangeArray[1], 10)]);
    });
    return ranges;
  }
}
