import { assert, describe, it } from "vitest";
import { BatchRequestContent } from "../../src";
import { DummyRequestAdapter } from "../utils/DummyRequestAdapter";

const adapter = new DummyRequestAdapter();

describe("BatchRequestContent tests", () => {
  describe("Constructor", () => {
    it("Should create instance", () => {
      const requestContent = new BatchRequestContent(adapter);
      assert(requestContent instanceof BatchRequestContent);
    });
  });

});
