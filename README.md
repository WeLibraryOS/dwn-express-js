# Installation instructions

Link you local copy of dwn-sd-js here as described  in https://github.com/TBD54566975/dwn-sdk-js/blob/main/README.md

```
npm install
npm run start
```

## What are we trying to do here?

Store and retrieve Verifiable Credential documents

## Notes on SDK

## Config object

Describe what is the Config object used to initialize the SDK

```
export type Config = {
  DIDMethodResolvers: DIDMethodResolver[],
  interfaces?: Interface[];
  messageStore?: MessageStore;
};
```

### DIDMethodResolvers

A `DIDMethodResolver` consists of:
```
method(): string;
resolve(did: string): Promise<DIDResolutionResult>
```

A "resolver" takes a DID as input and produces a DID Document

### Interface

``` Javscript
export interface Interface {
  methodHandlers: MethodHandler[];
  schemas: { [key:string]: object };
}

export type MethodHandler = (
  ctx: Context,
  message: BaseMessageSchema,
  messageStore: MessageStore,
  didResolver: DIDResolver) => Promise<MessageReply>;
```

### MessageStore

What is this?
