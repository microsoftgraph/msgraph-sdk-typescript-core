import { Parsable, ParseNode } from "@microsoft/kiota-abstractions";
import { LargeFileUploadTask, UploadSession } from "./LargeFileUploadTask";

export class UploadResult<T extends Parsable> {
  uploadSession?: UploadSession;
  uploadTask?: LargeFileUploadTask<T>;
  itemResponse?: T;
  location?: string;

  UploadSucceeded() {
    return this.itemResponse !== undefined || this.location !== undefined;
  }
}

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function createUploadResult(
  _: ParseNode | undefined,
): (instance?: Parsable) => Record<string, (node: ParseNode) => void> {
  return deserializeIntoUploadResult;
}

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function deserializeIntoUploadResult<T extends Parsable>(
  uploadResult: Partial<UploadResult<T>> | undefined = {},
): Record<string, (node: ParseNode) => void> {
  return {
    uploadSession: _ => {
      uploadResult.uploadSession = undefined;
    },
    uploadTask: _ => {
      uploadResult.uploadSession = undefined;
    },
    itemResponse: _ => {
      uploadResult.uploadSession = undefined;
    },
    location: _ => {
      uploadResult.uploadSession = undefined;
    },
  };
}
