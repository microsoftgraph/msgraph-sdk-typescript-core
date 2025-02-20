import { assert, describe, it } from "vitest";
import { BatchRequestContent, BatchResponseContent } from "../../src";
// @ts-ignore
import { DummyRequestAdapter } from "../utils/DummyRequestAdapter";
import { RequestInformation, HttpMethod } from "@microsoft/kiota-abstractions";
import { Headers } from "@microsoft/kiota-abstractions/dist/es/src/headers";

const adapter = new DummyRequestAdapter();

describe("BatchRequestContent tests", () => {
  describe("Constructor", () => {
    it("Should create instance", () => {
      const requestContent = new BatchRequestContent(adapter);
      assert(requestContent instanceof BatchRequestContent);
    });
  });
  describe("AddRequest", () => {
    it("Should add request", () => {
      const requestContent = new BatchRequestContent(adapter);

      const requestInfo = new RequestInformation(HttpMethod.GET, "{+baseurl}/me");
      requestInfo.headers = new Headers();
      requestInfo.headers.add("Content-Type", "application/json");
      const batchItem = requestContent.addBatchRequest(requestInfo);

      assert.isNotNull(batchItem);
      assert.isDefined(batchItem.id);
      assert.isTrue(batchItem.id.length > 0);
      assert.equal(requestContent.requests.size, 1);
      assert.equal(batchItem.method, requestInfo.httpMethod?.toString());
      assert.equal(batchItem.url, requestInfo.URL);
    });
    it("Should respect maximum number of steps", () => {
      const requestContent = new BatchRequestContent(adapter);

      // create a loop of 20
      for (let i = 0; i < 20; i++) {
        const requestInfo = new RequestInformation(HttpMethod.GET, "{+baseurl}/me");
        requestContent.addBatchRequest(requestInfo);
      }

      assert.throws(
        () => {
          const requestInfo = new RequestInformation(HttpMethod.GET, "{+baseurl}/me");
          requestContent.addBatchRequest(requestInfo);
        },
        Error,
        "Maximum requests limit exceeded, Max allowed number of requests are 20",
      );
    });
    it("Get content validates depends on", () => {
      const requestContent = new BatchRequestContent(adapter);

      const requestInfo = new RequestInformation(HttpMethod.GET, "{+baseurl}/me");
      const batchItem = requestContent.addBatchRequest(requestInfo);

      const requestInfo2 = new RequestInformation(HttpMethod.GET, "{+baseurl}/me/messages");
      const batchItem2 = requestContent.addBatchRequest(requestInfo2);

      batchItem2.dependsOn = [batchItem.id];

      assert.doesNotThrow(() => requestContent.getContent());

      batchItem2.dependsOn = ["random"];
      assert.throws(
        () => {
          requestContent.getContent();
        },
        Error,
        "Invalid dependency chain found in the requests, Please provide valid dependency chain",
      );
    });
  });

  describe("PostRequest", () => {
    it("Should post a serialized batch of objects", () => {
      const requestContent = new BatchRequestContent(adapter);

      const requestInfo = new RequestInformation(HttpMethod.GET, "{+baseurl}/me");
      const request = requestContent.addBatchRequest(requestInfo);

      const requestInfo2 = new RequestInformation(HttpMethod.GET, "{+baseurl}/me/messages");
      requestContent.addBatchRequest(requestInfo2);

      adapter.setResponse({ responses: { id: request.id, status: 200, body: { responses: [] } } });

      const result = requestContent.postAsync();
      assert.isNotNull(result);
    });
  });

  describe("ResponseContent", () => {
    it("Can fetch a response by Id", () => {
      const requestContent = new BatchResponseContent({
        responses: [
          { id: "1", status: 200, headers: {} },
          { id: "2", status: 204, headers: {} },
        ],
      });

      const response = requestContent.getResponseById("1");
      assert.isNotNull(response);
      assert.equal(response?.status, 200);
    });
  });
});
