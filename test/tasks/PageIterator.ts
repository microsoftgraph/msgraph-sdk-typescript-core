import {assert, describe, it} from "vitest";
import {PageCollection, PageIterator, PageIteratorCallback} from "../../src";
import {Parsable, ParseNode} from "@microsoft/kiota-abstractions";
// @ts-ignore
import {DummyRequestAdapter} from "./DummyRequestAdapter";

const value = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const getPageCollection = () => {
  return {
    value: [...value],
    additionalContent: "additional content",
  };
};

const getPageCollectionWithNext = () => {
  return {
    value: [...value],
    "@odata.nextLink": "nextURL",
    additionalContent: "additional content",
  };
};

export function createPageCollectionFromDiscriminatorValue(parseNode: ParseNode | undefined) : ((instance?: Parsable) => Record<string, (node: ParseNode) => void>) {
  return deserializeIntoPageCollection;
}

export function deserializeIntoPageCollection(baseDeltaFunctionResponse: Partial<PageCollection<number>> | undefined = {}) : Record<string, (node: ParseNode) => void> {
  return {
    "backingStoreEnabled": n => { baseDeltaFunctionResponse.backingStoreEnabled = true; },
    "@odata.deltaLink": n => { baseDeltaFunctionResponse.odataDeltaLink = n.getStringValue(); },
    "@odata.nextLink": n => { baseDeltaFunctionResponse.odataNextLink = n.getStringValue(); },
  }
}

const getEmptyPageCollection = () => {
  return {
    value: [],
  };
};

const getEmptyPageCollectionWithNext = () => {
  return {
    value: [],
    "@odata.nextLink": "nextURL",
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const truthyCallback: PageIteratorCallback<number> = data => {
  return true;
};

let halfWayCallbackCounter = 5;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const halfWayCallback: PageIteratorCallback<number> = data => {
  halfWayCallbackCounter--;
  return halfWayCallbackCounter !== 0;
};

const adapter = new DummyRequestAdapter();

describe("PageIterator tests", () => {
  describe("Constructor", () => {
    it("Should create instance", () => {
      const pageIterator = new PageIterator(adapter, getPageCollection(), truthyCallback, createPageCollectionFromDiscriminatorValue);
      assert(pageIterator instanceof PageIterator);
    });
  });

  describe("iterate", () => {
    it("Should iterate over a complete collection without nextLink", async () => {
      const pageIterator = new PageIterator(adapter, getPageCollection(), truthyCallback, createPageCollectionFromDiscriminatorValue);
      await pageIterator.iterate();
      assert.isTrue(pageIterator.isComplete());
    });

    it("Should not mutate the collection", async () => {
      const collection = getPageCollection();
      const pageIterator = new PageIterator(adapter, getPageCollection(), truthyCallback, createPageCollectionFromDiscriminatorValue);
      await pageIterator.iterate();
      assert.deepEqual(collection, getPageCollection());
    });

    it("Should not iterate over an empty collection", async () => {
      const pageIterator = new PageIterator(adapter, getPageCollection(), truthyCallback, createPageCollectionFromDiscriminatorValue);
      halfWayCallbackCounter = 1;
      await pageIterator.iterate();
      assert.equal(halfWayCallbackCounter, 1);
    });

    it("Should break in the middle way", async () => {
      const pageIterator = new PageIterator(adapter, getPageCollection(), halfWayCallback, createPageCollectionFromDiscriminatorValue);
      halfWayCallbackCounter = 5;
      await pageIterator.iterate();
      assert.isFalse(pageIterator.isComplete());
    });
  });


  describe("resume", () => {
    it("Should start from the place where it left the iteration", async () => {
      const pageIterator = new PageIterator(adapter, getPageCollection(), halfWayCallback, createPageCollectionFromDiscriminatorValue);
      halfWayCallbackCounter = 5;
      await pageIterator.iterate();
      assert.isFalse(pageIterator.isComplete());
      await pageIterator.resume();
      assert.isTrue(pageIterator.isComplete());
    });
  });

  describe("isComplete", () => {
    it("Should return false for incomplete iteration", async () => {
      const pageIterator = new PageIterator(adapter, getPageCollection(), halfWayCallback, createPageCollectionFromDiscriminatorValue);
      halfWayCallbackCounter = 5;
      await pageIterator.iterate();
      assert.isFalse(pageIterator.isComplete());
    });

    it("Should return true for complete iteration", async () => {
      const pageIterator = new PageIterator(adapter, getPageCollection(), halfWayCallback, createPageCollectionFromDiscriminatorValue);
      await pageIterator.iterate();
      assert.isTrue(pageIterator.isComplete());
    });
  });
});
