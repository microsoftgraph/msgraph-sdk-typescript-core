import { Parsable, RequestAdapter, RequestInformation } from "@microsoft/kiota-abstractions";
import { createUploadResult, UploadResult } from "./UploadResult";
import { Headers } from "@microsoft/kiota-abstractions/dist/es/src/headers";
import { HttpMethod } from "@microsoft/kiota-abstractions/dist/es/src/httpMethod";
import { HeadersInspectionOptions } from "@microsoft/kiota-http-fetchlibrary";

const binaryContentType = "application/octet-stream";

export class UploadSliceRequestBuilder<T extends Parsable> {
  constructor(
    readonly requestAdapter: RequestAdapter,
    readonly sessionUrl: string,
    readonly rangeBegin: number,
    readonly rangeEnd: number,
    readonly totalSessionLength: number,
  ) {}

  public async UploadSlice(stream: ReadableStream<Uint8Array>): Promise<UploadResult<T> | undefined> {
    const data = await this.readSection(stream, this.rangeBegin, this.rangeEnd);
    const requestInformation = this.createPutRequestInformation(data);

    const headerOptions = new HeadersInspectionOptions({ inspectResponseHeaders: true });
    requestInformation.addRequestOptions([headerOptions]);

    return this.requestAdapter.send<UploadResult<T>>(requestInformation, createUploadResult, undefined);
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

  private createPutRequestInformation(content: ArrayBuffer): RequestInformation {
    const header = new Headers();
    header.set("Content-Range", new Set([`bytes ${this.rangeBegin}-${this.rangeEnd - 1}/${this.totalSessionLength}`]));
    header.set("Content-Length", new Set([`${this.rangeEnd - this.rangeBegin}`]));

    const request = new RequestInformation();
    request.headers = header;
    request.urlTemplate = this.sessionUrl;
    request.httpMethod = HttpMethod.PUT;
    request.setStreamContent(content, binaryContentType);
    return request;
  }
}
