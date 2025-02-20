/**
 * -------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
 * See License in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

/**
 * @module DummyRequestAdapter
 */

import {
  type BackingStoreFactory,
  type ErrorMappings,
  Parsable,
  type ParsableFactory,
  type PrimitiveTypesForDeserialization,
  type PrimitiveTypesForDeserializationType,
  RequestAdapter,
  type RequestInformation,
  SerializationWriterFactory,
  SerializationWriterFactoryRegistry,
} from "@microsoft/kiota-abstractions";

import { JsonSerializationWriterFactory } from "@microsoft/kiota-serialization-json";

/**
 * @class
 * @implements DummyRequestAdapter
 * Class representing DummyRequestAdapter
 */
export class DummyRequestAdapter implements RequestAdapter {
  baseUrl: string = "";
  response: any[] = [];
  requests: RequestInformation[] = [];
  serializationWriterFactory = new SerializationWriterFactoryRegistry();

  constructor() {
    const serializer = new JsonSerializationWriterFactory();
    this.serializationWriterFactory.contentTypeAssociatedFactories.set(serializer.getValidContentType(), serializer);
  }

  // set the url
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  // set a fake response
  setResponse(response: any): void {
    this.response.push(response);
  }

  // get requests
  getRequests(): RequestInformation[] {
    return this.requests;
  }

  convertToNativeRequest<T>(requestInfo: RequestInformation): Promise<T> {
    return Promise.resolve(undefined as T);
  }

  enableBackingStore(backingStoreFactory?: BackingStoreFactory): void {}

  getSerializationWriterFactory(): SerializationWriterFactory {
    return this.serializationWriterFactory;
  }

  send<ModelType extends Parsable>(
    requestInfo: RequestInformation,
    type: ParsableFactory<ModelType>,
    errorMappings: ErrorMappings | undefined,
  ): Promise<ModelType | undefined> {
    this.requests.push(requestInfo);
    return Promise.resolve(this.response.shift());
  }

  sendCollection<ModelType extends Parsable>(
    requestInfo: RequestInformation,
    type: ParsableFactory<ModelType>,
    errorMappings: ErrorMappings | undefined,
  ): Promise<ModelType[] | undefined> {
    this.requests.push(requestInfo);
    return Promise.resolve(this.response.shift());
  }

  sendCollectionOfEnum<EnumObject extends Record<string, unknown>>(
    requestInfo: RequestInformation,
    enumObject: EnumObject,
    errorMappings: ErrorMappings | undefined,
  ): Promise<EnumObject[keyof EnumObject][] | undefined> {
    this.requests.push(requestInfo);
    return Promise.resolve(this.response.shift());
  }

  sendCollectionOfPrimitive<ResponseType extends Exclude<PrimitiveTypesForDeserializationType, ArrayBuffer>>(
    requestInfo: RequestInformation,
    responseType: Exclude<PrimitiveTypesForDeserialization, "ArrayBuffer">,
    errorMappings: ErrorMappings | undefined,
  ): Promise<ResponseType[] | undefined> {
    this.requests.push(requestInfo);
    return Promise.resolve(this.response.shift());
  }

  sendEnum<EnumObject extends Record<string, unknown>>(
    requestInfo: RequestInformation,
    enumObject: EnumObject,
    errorMappings: ErrorMappings | undefined,
  ): Promise<EnumObject[keyof EnumObject] | undefined> {
    this.requests.push(requestInfo);
    return Promise.resolve(this.response.shift());
  }

  sendNoResponseContent(requestInfo: RequestInformation, errorMappings: ErrorMappings | undefined): Promise<void> {
    this.requests.push(requestInfo);
    return Promise.resolve(this.response.shift());
  }

  sendPrimitive<ResponseType extends PrimitiveTypesForDeserializationType>(
    requestInfo: RequestInformation,
    responseType: PrimitiveTypesForDeserialization,
    errorMappings: ErrorMappings | undefined,
  ): Promise<ResponseType | undefined> {
    this.requests.push(requestInfo);
    return Promise.resolve(this.response.shift());
  }
}
