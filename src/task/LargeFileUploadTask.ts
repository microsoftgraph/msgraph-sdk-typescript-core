import { Parsable, RequestAdapter } from "@microsoft/kiota-abstractions";
import { UploadSession } from "./UploadSession";
import { UploadSliceRequestBuilder } from "./UploadSliceRequestBuilder";
import { UploadResult } from "./UploadResult";
import { IProgress } from "./IProgress";

export interface ILargeFileUploadTask<T extends Parsable> {
  Upload(progressEventHandler: IProgress): Promise<UploadResult<T>>;

  Resume(progressEventHandler: IProgress): Promise<UploadResult<T>>;

  RefreshUploadStatus(): Promise<void>;

  UpdateSession(): Promise<UploadSession>;

  DeleteSession(): Promise<UploadSession>;

  Cancel(): Promise<void>;
}

const DefaultSliceSize = 320 * 1024;

export class LargeFileUploadTask<T extends Parsable> implements ILargeFileUploadTask<T> {
  rangesRemaining: number[][] = [];
  Session: UploadSession;

  constructor(
    readonly uploadSession: Parsable,
    readonly uploadStream: ReadableStream<Uint8Array>,
    readonly maxSliceSize = -1,
    readonly requestAdapter: RequestAdapter,
  ) {
    if (!uploadStream?.locked) {
      throw new Error("Please provide stream value");
    }
    if (requestAdapter === undefined) {
      throw new Error("Request adapter is a required parameter");
    }
    if (maxSliceSize <= 0) {
      this.maxSliceSize = DefaultSliceSize;
    }

    this.Session = this.extractSessionInfo(uploadSession);
    this.rangesRemaining = this.GetRangesRemaining(this.Session);
  }

  public async Upload(progress?: IProgress, maxTries = 3): Promise<UploadResult<T>> {
    let uploadTries = 0;
    while (uploadTries < maxTries) {
      const sliceRequests = this.GetUploadSliceRequests();
      for (const request of sliceRequests) {
        const uploadResult = await request.UploadSlice(this.uploadStream);
        progress?.report(request.rangeEnd);
        if (uploadResult?.UploadSucceeded()) {
          return uploadResult;
        }
      }

      await this.UpdateSession();
      uploadTries++;

      if (uploadTries < maxTries) {
        // Exponential backoff
        await this.sleep(2000 * (uploadTries + 1));
      }
    }

    throw new Error("Max retries reached");
  }

  public Resume(_?: IProgress): Promise<UploadResult<T>> {
    throw new Error("Method not implemented.");
  }

  public RefreshUploadStatus(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public UpdateSession(): Promise<UploadSession> {
    throw new Error("Method not implemented.");
  }

  public DeleteSession(): Promise<UploadSession> {
    throw new Error("Method not implemented.");
  }

  public Cancel(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  private extractSessionInfo(parsable: Parsable): UploadSession {
    const uploadSession: UploadSession = {
      expirationDateTime: null,
      nextExpectedRanges: null,
      odataType: null,
      uploadUrl: null,
    };

    if ("expirationDateTime" in parsable) uploadSession.expirationDateTime = parsable.expirationDateTime as Date | null;
    if ("nextExpectedRanges" in parsable)
      uploadSession.nextExpectedRanges = parsable.nextExpectedRanges as string[] | null;
    if ("odataType" in parsable) uploadSession.odataType = parsable.odataType as string | null;
    if ("uploadUrl" in parsable) uploadSession.uploadUrl = parsable.uploadUrl as string | null;

    return uploadSession;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private GetUploadSliceRequests(): UploadSliceRequestBuilder<T>[] {
    const uploadSlices: UploadSliceRequestBuilder<T>[] = [];
    const rangesRemaining = this.rangesRemaining;
    const session = this.Session;
    rangesRemaining.forEach(range => {
      let currentRangeBegin = range[0];
      while (currentRangeBegin <= range[1]) {
        const nextSliceSize = this.nextSliceSize(currentRangeBegin, range[1]);
        const uploadRequest = new UploadSliceRequestBuilder<T>(
          this.requestAdapter,
          session.uploadUrl!,
          currentRangeBegin,
          currentRangeBegin + nextSliceSize - 1,
          range[1] + 1,
        );
        uploadSlices.push(uploadRequest);
        currentRangeBegin += nextSliceSize;
      }
    });
    return uploadSlices;
  }

  private nextSliceSize(currentRangeBegin: number, currentRangeEnd: number): number {
    const sizeBasedOnRange = currentRangeEnd - currentRangeBegin + 1;
    return sizeBasedOnRange > this.maxSliceSize ? this.maxSliceSize : sizeBasedOnRange;
  }

  private GetRangesRemaining(uploadSession: UploadSession): number[][] {
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
