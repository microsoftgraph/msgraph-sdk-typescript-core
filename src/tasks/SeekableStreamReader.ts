/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

/**
 * @class
 * A class that provides seekable read access to a `ReadableStream` of `Uint8Array`.
 */
export class SeekableStreamReader {
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private cachedChunk?: Uint8Array | null;
  private cachedPosition = 0;
  private cachedOffset = 0; // Track where we are within the cached chunk

  constructor(private stream: ReadableStream<Uint8Array>) {
    this.reader = stream.getReader();
  }

  public async readSection(start: number, end: number): Promise<ArrayBuffer> {
    if (start < 0 || end <= start) {
      throw new Error("Invalid range: start must be non-negative and end must be greater than start.");
    }
    if (start < this.cachedPosition) {
      throw new Error("Cannot seek backwards.");
    }

    const chunks: Uint8Array[] = [];
    let totalLength = 0;
    let position = this.cachedPosition;

    while (position < end) {
      if (!this.cachedChunk) {
        const { done, value } = await this.reader.read();
        if (done) break;
        if (!value) continue;
        this.cachedChunk = value;
        this.cachedOffset = 0; // Reset the offset since it's a new chunk
      }

      const chunk = this.cachedChunk;
      const chunkLength = chunk.byteLength;

      // Skip chunks that are entirely before `start`
      if (position + chunkLength - this.cachedOffset <= start) {
        position += chunkLength - this.cachedOffset;
        this.cachedChunk = null;
        this.cachedOffset = 0;
        continue;
      }

      // Calculate the section of the chunk to return
      const startIndex = Math.max(0, start - position) + this.cachedOffset;
      const endIndex = Math.min(chunkLength, end - position + this.cachedOffset);

      const sliced = chunk.slice(startIndex, endIndex);
      chunks.push(sliced);
      totalLength += sliced.byteLength;

      // Update position correctly
      position += sliced.byteLength;

      // Store remaining unread data for future reads
      if (endIndex < chunkLength) {
        this.cachedOffset = endIndex;
      } else {
        this.cachedChunk = null;
        this.cachedOffset = 0;
      }
    }

    this.cachedPosition = position; // Ensure position is updated

    // Combine collected chunks into a single buffer
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return result.buffer;
  }

  public async reset(newStream: ReadableStream<Uint8Array>) {
    await this.reader.cancel(); // Ensure the old reader is closed before replacing
    this.stream = newStream;
    this.reader = newStream.getReader();
    this.cachedChunk = null;
    this.cachedPosition = 0;
    this.cachedOffset = 0;
  }
}
