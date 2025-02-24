import { assert, describe, expect, it } from "vitest";
import { coreVersion, IProgress, LargeFileUploadTask } from "../../src";
// @ts-ignore
import { DummyRequestAdapter } from "../utils/DummyRequestAdapter";
import { ErrorMappings, Parsable, ParseNode } from "@microsoft/kiota-abstractions";
import { UploadSlice } from "../../src/tasks/UploadSlice";

const adapter = new DummyRequestAdapter();

interface SampleResponse extends Parsable {
  nextExpectedRanges?: string[] | undefined;
  expirationDateTime?: Date | undefined;
  uploadUrl?: string | undefined;
}

function createPageCollectionFromDiscriminatorValue(
  parseNode: ParseNode | undefined,
): (instance?: Parsable) => Record<string, (node: ParseNode) => void> {
  return deserializeIntoPageCollection;
}

function deserializeIntoPageCollection(
  baseDeltaFunctionResponse: Partial<SampleResponse> | undefined = {},
): Record<string, (node: ParseNode) => void> {
  return {};
}

function createSampleReadableStream(): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start: controller => {
      const encoder = new TextEncoder();
      const chunk = encoder.encode("This is a 24-byte string");
      controller.enqueue(chunk);
      controller.close();
    },
  });
}

const errorMappings: ErrorMappings = {
  XXX: parseNode => createGraphErrorFromDiscriminatorValue(parseNode),
};

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
  graphError: Partial<Error> | undefined = {},
): Record<string, (node: ParseNode) => void> => {
  return {};
};

describe("LargeFileUploadTask tests", () => {
  describe("initialization", () => {
    it("should initialize", () => {
      const session: SampleResponse = {
        nextExpectedRanges: ["0-23"],
        expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), //
        uploadUrl: "https://example.com/upload",
      };
      const largeFileUploadTask = new LargeFileUploadTask(
        adapter,
        session,
        createSampleReadableStream,
        10,
        createPageCollectionFromDiscriminatorValue,
        errorMappings,
      );
      assert.isNotNull(largeFileUploadTask, "LargeFileUploadTask failed to initialize");
    });
    it("should throw an error if invalid upload session is given", () => {
      assert.throws(() => {
        new LargeFileUploadTask(
          adapter,
          {} as SampleResponse,
          createSampleReadableStream,
          10,
          createPageCollectionFromDiscriminatorValue,
          errorMappings,
        );
      }, "Upload session is invalid");
    });
  });
  describe("file upload", () => {
    it("should split the file into expected ranges observing max size", async () => {
      adapter.resetAdapter();
      const session: SampleResponse = {
        nextExpectedRanges: ["0-23"],
        expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), //
        uploadUrl: "https://example.com/upload",
      };
      const largeFileUploadTask = new LargeFileUploadTask(
        adapter,
        session,
        createSampleReadableStream,
        5,
        createPageCollectionFromDiscriminatorValue,
        errorMappings,
      );

      // Accessing the private method using bracket notation
      const uploadSlices = (largeFileUploadTask as any)["getUploadSliceRequests"]() as UploadSlice<SampleResponse>[];
      // cast the arrays to UploadSlice
      assert.equal(uploadSlices.length, 5);

      uploadSlices.forEach(slice => {
        assert.isAtMost(slice.rangeEnd - slice.rangeBegin + 1, 5, "Slice size should not be larger than 5");
      });
      for (let i = 0; i < uploadSlices.length - 1; i++) {
        assert.isTrue(
          uploadSlices[i].rangeEnd < uploadSlices[i + 1].rangeBegin,
          "Slices should be in order from largest to smallest",
        );
      }

      const decoder = new TextDecoder();
      let reconstructedString = "";
      for (const slice of uploadSlices) {
        const chunk = await (slice as any).readSection(createSampleReadableStream(), slice.rangeBegin, slice.rangeEnd);
        console.log(slice.rangeBegin, slice.rangeEnd);
        console.log("chunk", decoder.decode(chunk));
        reconstructedString += decoder.decode(chunk);
      }
      assert.equal(reconstructedString, "This is a 24-byte string", "Reconstructed string should match the original");
    });
    it("should execute multiple file upload requests", async () => {
      adapter.resetAdapter();
      const session: SampleResponse = {
        nextExpectedRanges: ["0-23"],
        expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), //
        uploadUrl: "https://example.com/upload",
      };
      const largeFileUploadTask = new LargeFileUploadTask(
        adapter,
        session,
        createSampleReadableStream,
        10,
        createPageCollectionFromDiscriminatorValue,
        errorMappings,
      );

      let progressCounter = 0;
      let lastCall = -1;
      const progressCallback: IProgress = {
        report: (progress: number) => {
          lastCall = progress;
          progressCounter++;
        },
      };

      adapter.setResponse({
        nextExpectedRanges: ["10-19"],
        expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), //
        uploadUrl: "https://example.com/upload",
      });

      adapter.setResponse({
        nextExpectedRanges: ["20-23"],
        expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), //
        uploadUrl: "https://example.com/upload",
      });
      adapter.setResponse({
        name: "Valid",
      });

      await largeFileUploadTask.upload(progressCallback);
      assert.equal(progressCounter, 3);
      assert.equal(lastCall, 23);

      const requests = adapter.getRequests();
      assert.equal(requests.length, 3);
    });
    it("should delete an upload session", () => {
      adapter.resetAdapter();
      const session: SampleResponse = {
        nextExpectedRanges: ["0-23"],
        expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), //
        uploadUrl: "https://example.com/upload",
      };
      const largeFileUploadTask = new LargeFileUploadTask(
        adapter,
        session,
        createSampleReadableStream,
        10,
        createPageCollectionFromDiscriminatorValue,
        errorMappings,
      );
      largeFileUploadTask.deleteSession();

      // check if it makes a delete call to the url
      const requests = adapter.getRequests();
      assert.equal(requests.length, 1);
      assert.equal(requests[0].httpMethod, "DELETE");
      assert.equal(requests[0].URL, session.uploadUrl);
    });
    it("should update an upload session", () => {
      adapter.resetAdapter();
      const session: SampleResponse = {
        nextExpectedRanges: ["0-23"],
        expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), //
        uploadUrl: "https://example.com/upload",
      };
      const largeFileUploadTask = new LargeFileUploadTask(
        adapter,
        session,
        createSampleReadableStream,
        10,
        createPageCollectionFromDiscriminatorValue,
        errorMappings,
      );

      largeFileUploadTask.updateSession();

      // check if it makes a get call to the url
      const requests = adapter.getRequests();
      assert.equal(requests.length, 1);
      assert.equal(requests[0].httpMethod, "GET");
      assert.equal(requests[0].URL, session.uploadUrl);
    });
    it("should resume an upload session", async () => {
      adapter.resetAdapter();
      const session: SampleResponse = {
        nextExpectedRanges: ["0-23"],
        expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), //
        uploadUrl: "https://example.com/upload",
      };
      const largeFileUploadTask = new LargeFileUploadTask(
        adapter,
        session,
        createSampleReadableStream,
        10,
        createPageCollectionFromDiscriminatorValue,
        errorMappings,
      );

      adapter.setResponse({
        nextExpectedRanges: ["20-39"],
        expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), //
        uploadUrl: "https://example.com/upload",
      });
      adapter.setResponse({
        name: "Valid",
      });

      // check if it first call to the url is a get for refreshing the session and then multiple uploads
      await largeFileUploadTask.resume();
      const requests = adapter.getRequests();
      assert.equal(requests.length, 2);
      assert.equal(requests[0].httpMethod, "GET");
      assert.equal(requests[0].URL, session.uploadUrl);

      let pos = 1;
      while (requests.length > pos) {
        assert.equal(requests[pos].httpMethod, "PUT");
        assert.equal(requests[pos].URL, session.uploadUrl);
        pos++;
      }
    });
  });
});
