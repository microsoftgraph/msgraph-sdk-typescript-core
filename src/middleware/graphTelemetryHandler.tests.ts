import { assert } from "chai";
import { GraphTelemetryHandler } from "./graphTelemetryHandler";
import { GraphTelemetryOption } from "./graphTelemetryOption";

const options: GraphTelemetryOption = {
  graphServiceTargetVersion: "v1",
  graphProductPrefix: "graph-typescript-test",
  graphServiceLibraryClientVersion: "0.0.0",
};

describe("GraphTelemetryHandler tests", () => {
  it("should initialize", () => {
    const handler = new GraphTelemetryHandler(options);
    assert(handler);
  });
});
