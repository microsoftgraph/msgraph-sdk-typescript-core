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

/**
 * @class
 * @implements DummyRequestAdapter
 * Class representing DummyRequestAdapter
 */
export class DummyRequestAdapter implements RequestAdapter {
  baseUrl: string = "";

  convertToNativeRequest<T>(requestInfo: RequestInformation): Promise<T> {
    return Promise.resolve(undefined as T);
  }

  enableBackingStore(backingStoreFactory?: BackingStoreFactory): void {}

  getSerializationWriterFactory(): SerializationWriterFactory {
    return SerializationWriterFactoryRegistry.defaultInstance;
  }

  send<ModelType extends Parsable>(
    requestInfo: RequestInformation,
    type: ParsableFactory<ModelType>,
    errorMappings: ErrorMappings | undefined,
  ): Promise<ModelType | undefined> {
    return Promise.resolve(undefined);
  }

  sendCollection<ModelType extends Parsable>(
    requestInfo: RequestInformation,
    type: ParsableFactory<ModelType>,
    errorMappings: ErrorMappings | undefined,
  ): Promise<ModelType[] | undefined> {
    return Promise.resolve(undefined);
  }

  sendCollectionOfEnum<EnumObject extends Record<string, unknown>>(
    requestInfo: RequestInformation,
    enumObject: EnumObject,
    errorMappings: ErrorMappings | undefined,
  ): Promise<EnumObject[keyof EnumObject][] | undefined> {
    return Promise.resolve(undefined);
  }

  sendCollectionOfPrimitive<ResponseType extends Exclude<PrimitiveTypesForDeserializationType, ArrayBuffer>>(
    requestInfo: RequestInformation,
    responseType: Exclude<PrimitiveTypesForDeserialization, "ArrayBuffer">,
    errorMappings: ErrorMappings | undefined,
  ): Promise<ResponseType[] | undefined> {
    return Promise.resolve(undefined);
  }

  sendEnum<EnumObject extends Record<string, unknown>>(
    requestInfo: RequestInformation,
    enumObject: EnumObject,
    errorMappings: ErrorMappings | undefined,
  ): Promise<EnumObject[keyof EnumObject] | undefined> {
    return Promise.resolve(undefined);
  }

  sendNoResponseContent(requestInfo: RequestInformation, errorMappings: ErrorMappings | undefined): Promise<void> {
    return Promise.resolve(undefined);
  }

  sendPrimitive<ResponseType extends PrimitiveTypesForDeserializationType>(
    requestInfo: RequestInformation,
    responseType: PrimitiveTypesForDeserialization,
    errorMappings: ErrorMappings | undefined,
  ): Promise<ResponseType | undefined> {
    return Promise.resolve(undefined);
  }
}
