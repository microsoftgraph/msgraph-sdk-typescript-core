import { describe, it, assert } from "vitest";
import { coreVersion } from "src";
describe("version variable", () => {
  it("should be written after build", () => {
    assert(coreVersion, "version is not written");
  });
});
