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

  constructor(private stream: ReadableStream<Uint8Array>) {
    // Get a reader from the underlying stream.
    this.reader = stream.getReader();
  }

  /**
   * Reads a section of the stream from the given start index up to (but not including) the end index.
   * The method ensures that enough data is buffered; if not, it continues reading from the stream.
   *
   * @param start - The starting byte index.
   * @param end - The ending byte index (non-inclusive).
   * @returns A Promise that resolves with an ArrayBuffer containing the requested bytes.
   */
  public async readSection(start: number, end: number): Promise<ArrayBuffer> {
    if (start < 0 || end < start) {
      throw new Error("Invalid start or end values.");
    }
    if (start < this.cachedPosition) {
      throw new Error("Cannot seek backwards");
    }

    let position = this.cachedPosition; // current absolute position in the stream
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    try {
      while (true) {
        if (!this.cachedChunk) {
          const { done, value } = await this.reader.read();
          if (done) break;
          if (!value) continue;

          this.cachedChunk = value;
        }
        const chunk = this.cachedChunk;
        const chunkLength = this.cachedChunk.byteLength;

        // If the entire chunk is before our start, skip it.
        if (position + chunkLength <= start) {
          position += chunkLength;
          continue;
        }

        // If we've already passed the end, we can stop reading.
        this.cachedChunk = null;
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

        this.cachedChunk = chunk;

        position += chunkLength;
        // Stop reading if we've already reached beyond the desired range.
        if (position > end) break;
      }
    } finally {
      this.reader.releaseLock();
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

  /**
   * Optional helper: resets the internal state to allow a new stream to be used.
   * Note: this method clears any cached data.
   *
   * @param newStream - A new ReadableStream of Uint8Array.
   */
  public reset(newStream: ReadableStream<Uint8Array>): void {
    this.stream = newStream;
    this.reader = newStream.getReader();
    this.cachedChunk = null;
    this.cachedPosition = 0;
  }
}
