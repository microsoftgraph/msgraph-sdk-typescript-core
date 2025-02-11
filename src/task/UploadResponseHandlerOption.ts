import { ResponseHandler, ResponseHandlerOption } from "@microsoft/kiota-abstractions";
import { UploadResponseHandler } from "./UploadResponseHandler";

export class UploadResponseHandlerOption extends ResponseHandlerOption {
  public responseHandler?: ResponseHandler = new UploadResponseHandler();
}
