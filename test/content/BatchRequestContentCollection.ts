import { assert, describe, it } from "vitest";
import { BatchRequestContentCollection } from "../../src";
// @ts-ignore
import { DummyRequestAdapter } from "../utils/DummyRequestAdapter";
import { ErrorMappings, Headers, HttpMethod, RequestInformation } from "@microsoft/kiota-abstractions";
// @ts-ignore
import { createGraphErrorFromDiscriminatorValue } from "../tasks/PageIterator";

const adapter = new DummyRequestAdapter();

const errorMappings: ErrorMappings = {
  XXX: parseNode => createGraphErrorFromDiscriminatorValue(parseNode),
};

describe("BatchRequestContentCollection tests", () => {
  describe("Constructor", () => {
    it("Should create instance", () => {
      const requestContentCollection = new BatchRequestContentCollection(adapter, errorMappings, 5);
      assert(requestContentCollection instanceof BatchRequestContentCollection);
    });
  });
  describe("AddRequest", () => {
    it("Should add request", () => {
      const requestContentCollection = new BatchRequestContentCollection(adapter, errorMappings, 5);

      const requestInfo = new RequestInformation(HttpMethod.GET, "{+baseurl}/me");
      requestInfo.headers = new Headers();
      requestInfo.headers.add("Content-Type", "application/json");
      const batchItem = requestContentCollection.addBatchRequest(requestInfo);

      assert.isNotNull(batchItem);
      assert.isDefined(batchItem.id);
      assert.isTrue(batchItem.id.length > 0);
      assert.equal(requestContentCollection.batchRequests.length, 1);
      assert.equal(batchItem.method, requestInfo.httpMethod?.toString());
      assert.equal(batchItem.url, requestInfo.URL);
    });
  });
  describe("postAsync", () => {
    it("Should throw error on max number of items", async () => {
      const requestContentCollection = new BatchRequestContentCollection(adapter, errorMappings, 2);

      // create a loop of 50
      for (let i = 0; i < 50; i++) {
        const requestInfo = new RequestInformation(HttpMethod.GET, "{+baseurl}/me");
        requestContentCollection.addBatchRequest(requestInfo);
      }

      try {
        await requestContentCollection.postAsync();
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        assert.equal(error.message, "Batch limit exceeded, Please provide a batch limit of 2 or less");
      }
    });
  });
});
