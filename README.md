# Microsoft Graph Core SDK for Typescript

Get started with the Microsoft Graph SDK for Typescript by integrating the [Microsoft Graph API](https://docs.microsoft.com/graph/overview) into your Typescript application!

> **Note:** this package contains the core feature of the TypeScript SDK. To get the full experience checkout [the v1 SDK](https://github.com/microsoftgraph/msgraph-sdk-typescript) and [the beta SDK](https://github.com/microsoftgraph/msgraph-beta-sdk-typescript).
>
> **Note:** the Microsoft Graph Typescript SDK is currently in Pre-Release.

## 1. Installation

```shell
# this will install the core package
npm install @microsoft/msgraph-sdk-core
```

## 2. Getting started

> Note: we are working to add the getting started information for Typescript to our public documentation, in the meantime the following sample should help you getting started.

### 2.1 Register your application

Register your application by following the steps at [Register your app with the Microsoft Identity Platform](https://docs.microsoft.com/graph/auth-register-app-v2).

### 2.2 Create an AuthenticationProvider object

An instance of the **FetchClient** class handles making requests to the service. To create a new instance of this class, you need to provide an instance of **AuthenticationProvider**, which can authenticate requests to Microsoft Graph.

For an example of how to get an authentication provider, see [choose a Microsoft Graph authentication provider](https://docs.microsoft.com/graph/sdks/choose-authentication-providers?tabs=typescript).

## 3. Make requests against the service

TODO: document how the fetch client augmented with middleware handlers can be used to make arbitrary requests.

## 4. Documentation

For more detailed documentation, see:

* [Overview](https://docs.microsoft.com/graph/overview)
* [Collections](https://docs.microsoft.com/graph/sdks/paging)
* [Making requests](https://docs.microsoft.com/graph/sdks/create-requests)
* [Known issues](https://github.com/MicrosoftGraph/msgraph-sdk-typescript/issues)
* [Contributions](https://github.com/microsoftgraph/msgraph-sdk-typescript/blob/main/CONTRIBUTING.md)

## 5. Issues

For known issues, see [issues](https://github.com/MicrosoftGraph/msgraph-sdk-typescript/issues).

## 6. Contributions

The Microsoft Graph SDK is open for contribution. To contribute to this project, see [Contributing](https://github.com/microsoftgraph/msgraph-sdk-typescript/blob/main/CONTRIBUTING.md).

## 7. License

Copyright (c) Microsoft Corporation. All Rights Reserved. Licensed under the [MIT license](LICENSE).

## 8. Third-party notices

[Third-party notices](THIRD%20PARTY%20NOTICES)
