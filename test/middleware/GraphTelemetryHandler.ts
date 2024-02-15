import { assert, describe, it } from "vitest";
import { GraphTelemetryHandler } from "../../src/middleware/GraphTelemetryHandler";
import { GraphTelemetryOption } from "../../src/middleware/GraphTelemetryOption";

const options: GraphTelemetryOption = {
  graphServiceTargetVersion: "v1",
  graphProductPrefix: "graph-typescript-test",
  graphServiceLibraryClientVersion: "0.0.0",
};

describe("GraphTelemetryHandler tests", () => {
  it("should initialize", () => {
    const handler = new GraphTelemetryHandler(options);
    assert(handler, "GraphTelemetryHandler failed to initialize");
  });
});
