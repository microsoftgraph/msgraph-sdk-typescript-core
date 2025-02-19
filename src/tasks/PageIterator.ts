/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

/**
 * @module PageIterator
 */

import { Parsable, RequestAdapter } from "@microsoft/kiota-abstractions";
import { RequestInformation } from "@microsoft/kiota-abstractions/dist/es/src/requestInformation";
import { HttpMethod } from "@microsoft/kiota-abstractions/dist/es/src/httpMethod";
import type { ParsableFactory } from "@microsoft/kiota-abstractions/dist/es/src/serialization";
import { ErrorMappings } from "@microsoft/kiota-abstractions/dist/es/src/requestAdapter";
import { Headers } from "@microsoft/kiota-abstractions/dist/es/src/headers";
import { createGraphErrorFromDiscriminatorValue } from "../content";

/**
 * Signature representing PageCollection
 * @property {any[]} value - The collection value
 * @property {string} [@odata.nextLink] - The nextLink value
 * @property {string} [@odata.deltaLink] - The deltaLink value
 * @property {any} Additional - Any number of additional properties (This is to accept the any additional data returned by in the response to the nextLink request)
 */
export interface PageCollection<T> {
  value: T[];
  odataNextLink?: string;
  odataDeltaLink?: string;
  [Key: string]: any;
}

/**
 * Signature representing callback for page iterator
 * @property {Function} callback - The callback function which should return boolean to continue the continue/stop the iteration.
 */
export type PageIteratorCallback<T> = (data: T) => boolean;

/**
 * @class
 * Class for PageIterator
 */
export class PageIterator<T extends Parsable, C extends Parsable> {
  /**
   * @private
   * Member holding the GraphClient instance
   */
  private readonly requestAdapter: RequestAdapter;

  /**
   * @private
   * Member holding the current page
   */
  private currentPage?: PageCollection<T>;

  /**
   * @private
   * Member holding a complete/incomplete status of an iterator
   */
  private complete: boolean;

  /**
   * @private
   * Member holding the current position on the collection
   */
  private cursor: number;

  /**
   * @private
   * Member holding the headers that can be added to the request
   */
  private readonly headers: Headers;

  /**
   * @private
   * Member holding the factory to create the parsable object
   */
  private readonly parsableFactory: ParsableFactory<C>;

  /**
   * @private
   * Member holding the error mappings
   */
  private readonly errorMappings?: ErrorMappings;

  /*
   * @private
   * Member holding the callback for iteration
   */
  private readonly callback: PageIteratorCallback<T>;

  /**
   * @public
   * @constructor
   * Creates new instance for PageIterator
   * @returns An instance of a PageIterator
   * @param adapter - The request adapter
   * @param pageResult - The page collection result
   * @param callback - The callback function to be called on each item
   * @param parsableFactory - The factory to create the parsable object
   * @param errorMappings - The error mappings
   */
  public constructor(
    adapter: RequestAdapter,
    pageResult: C,
    callback: PageIteratorCallback<T>,
    parsableFactory: ParsableFactory<C>,
    errorMappings?: ErrorMappings,
  ) {
    this.requestAdapter = adapter;
    const parsedValue = this.castPageCollection(pageResult);
    if (!parsedValue.value || !Array.isArray(parsedValue.value)) {
      throw new Error("The current page does not have a property of type value or contains invalid items");
    }
    this.currentPage = parsedValue;

    this.cursor = 0;
    this.complete = false;
    this.errorMappings = errorMappings;
    this.parsableFactory = parsableFactory;
    this.callback = callback;

    if (!this.errorMappings) {
      this.errorMappings = {
        XXX: parseNode => createGraphErrorFromDiscriminatorValue(parseNode),
      };
    }

    this.headers = new Headers();
    this.headers.set("Content-Type", new Set(["application/json"]));
  }

  private castPageCollection(pageResult: C): PageCollection<T> {
    const result: PageCollection<T> = { value: [] };
    for (const key in pageResult) {
      if (Object.prototype.hasOwnProperty.call(pageResult, key)) {
        result[key] = pageResult[key];
      }
    }
    return result;
  }

  /**
   * @public
   * Getter to get the deltaLink in the current response
   * @returns A deltaLink which is being used to make delta requests in future
   */
  public getOdataDeltaLink(): string | undefined {
    const deltaLink = this.currentPage?.["@odata.deltaLink"] as string | undefined;
    return this.currentPage?.odataDeltaLink ?? deltaLink;
  }

  /**
   * @public
   * Getter to get the nextLink in the current response
   * @returns A nextLink which is being used to make requests in future
   */
  public getOdataNextLink(): string | undefined {
    const nextLink = this.currentPage?.["@odata.nextLink"] as string | undefined;
    return this.currentPage?.odataNextLink ?? nextLink;
  }

  /**
   * @public
   * @async
   * Iterates over the collection and kicks callback for each item on iteration. Fetches next set of data through nextLink and iterates over again
   * This happens until the nextLink is drained out or the user responds with a red flag to continue from callback
   */
  public async iterate() {
    const keepIterating = true;

    while (keepIterating) {
      const advance = this.enumerate();
      if (!advance) {
        return;
      }

      const nextLink = this.getOdataNextLink();
      if ((nextLink !== undefined || nextLink !== "") && this.cursor >= (this.currentPage?.value.length ?? 0)) {
        this.complete = true;
        return;
      }

      const nextPage = await this.next();
      if (!nextPage) {
        return;
      }
      this.currentPage = nextPage;
    }
  }

  /**
   * @private
   * @async
   * Helper to make a get request to fetch next page with nextLink url and update the page iterator instance with the returned response
   * @returns A promise that resolves to a response data with next page collection
   */
  public async next(): Promise<PageCollection<T> | undefined> {
    const requestInformation = new RequestInformation();
    requestInformation.httpMethod = HttpMethod.GET;
    requestInformation.urlTemplate = this.getOdataNextLink();
    requestInformation.headers.addAll(this.headers);

    const graphRequest = await this.requestAdapter.send<C>(
      requestInformation,
      this.parsableFactory,
      this.errorMappings,
    );
    if (graphRequest != null) {
      return this.castPageCollection(graphRequest);
    }

    return Promise.resolve(undefined);
  }

  /**
   * @public
   * @async
   * To resume the iteration
   * Note: This internally calls the iterate method, It's just for more readability.
   */
  public async resume() {
    return this.iterate();
  }

  /**
   * @public
   * To get the completeness status of the iterator
   * @returns Boolean indicating the completeness
   */
  public isComplete(): boolean {
    return this.complete;
  }

  /**
   * @private
   * Iterates over a collection by enqueuing entries one by one and kicking the callback with the enqueued entry
   * @returns A boolean indicating the continue flag to process next page
   */
  private enumerate() {
    let keepIterating = true;

    const pageItems = this.currentPage?.value;
    if (pageItems === undefined || pageItems.length === 0) {
      return false;
    }

    // continue iterating from cursor
    for (let i = this.cursor; i < pageItems.length; i++) {
      keepIterating = this.callback(pageItems[i]);
      this.cursor = i + 1;
      if (!keepIterating) {
        break;
      }
    }

    return keepIterating;
  }
}
