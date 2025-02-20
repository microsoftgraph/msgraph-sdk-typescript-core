import { assert, describe, it } from "vitest";
import { LargeFileUploadTask } from "../../src";
// @ts-ignore
import { DummyRequestAdapter } from "../utils/DummyRequestAdapter";
import { ErrorMappings, Parsable, ParseNode } from "@microsoft/kiota-abstractions";

const adapter = new DummyRequestAdapter();

interface SampleResponse extends Parsable {
  nextExpectedRanges?: string[] | undefined;
  expirationDateTime?: Date | undefined;
  uploadUrl?: string | undefined;
}

export function createPageCollectionFromDiscriminatorValue(
  parseNode: ParseNode | undefined,
): (instance?: Parsable) => Record<string, (node: ParseNode) => void> {
  return deserializeIntoPageCollection;
}

export function deserializeIntoPageCollection(
  baseDeltaFunctionResponse: Partial<SampleResponse> | undefined = {},
): Record<string, (node: ParseNode) => void> {
  return {};
}

const sampleReadableStream = new ReadableStream<Uint8Array>({
  start(controller) {
    const encoder = new TextEncoder();
    const chunk = encoder.encode("This is a 20-byte string");
    controller.enqueue(chunk);
    controller.close();
  },
});

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
  it("should initialize", () => {
    const session: SampleResponse = {
      nextExpectedRanges: ["0-19"],
      expirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), //
      uploadUrl: "https://example.com/upload",
    };
    const handler = new LargeFileUploadTask(
      adapter,
      session,
      sampleReadableStream,
      10,
      createPageCollectionFromDiscriminatorValue,
      errorMappings,
    );
    assert(handler, "LargeFileUploadTask failed to initialize");
  });
  it("should throw an error if invalid upload session is given", () => {
    assert.throws(() => {
      const handler = new LargeFileUploadTask(
        adapter,
        {} as SampleResponse,
        sampleReadableStream,
        10,
        createPageCollectionFromDiscriminatorValue,
        errorMappings,
      );
    }, "Upload session is invalid");
  });

  // TODO test slice generation by range spliting

  // TODO test file upload

  // TODO test canceling an upload

  // TODO test resume an upload
});
