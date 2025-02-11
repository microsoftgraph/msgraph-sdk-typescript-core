import { ErrorMappings, ResponseHandler } from "@microsoft/kiota-abstractions";

export class UploadResponseHandler implements ResponseHandler {
  handleResponse<NativeResponseType, ModelType>(
    response: NativeResponseType,
    _: ErrorMappings | undefined,
  ): Promise<ModelType | undefined> {
    if (response instanceof Response) {
      if (response.ok) {
        if (response.body != null) {
          const body = response.body as unknown as ModelType;
          return Promise.resolve(body);
        } else {
          return Promise.resolve(undefined);
        }
      }
    }
    return Promise.resolve(undefined);
  }
}
