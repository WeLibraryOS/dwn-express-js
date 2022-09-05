import type { Context } from './types';
import type { DIDMethodResolver } from './did/did-resolver';
import type { Interface, MethodHandler } from './interfaces/types';
import type { BaseMessageSchema, RequestSchema } from './core/types';
import type { MessageStore } from './store/message-store';

import { addSchema } from './validation/validator';
import { CollectionsInterface, PermissionsInterface, FeatureDetectionInterface } from './interfaces';
import { DIDResolver } from './did/did-resolver';
import { Message, MessageReply, Request, Response } from './core';
import { MessageStoreLevel } from './store/message-store-level';

export class DWN {
  static interfaces: Interface[] = [
    CollectionsInterface,
    PermissionsInterface,
    FeatureDetectionInterface
  ];

  static methodHandlers: {[method: string]: MethodHandler};

  DIDResolver: DIDResolver;
  messageStore: MessageStore;
  owner?: string;

  private constructor(config: Config) {
    this.DIDResolver = new DIDResolver(config.DIDMethodResolvers);
    this.messageStore = config.messageStore!;
    this.owner = config.owner;
  }

  static async create(config: Config): Promise<DWN> {
    config.messageStore = config.messageStore || new MessageStoreLevel();
    config.DIDMethodResolvers = config.DIDMethodResolvers || [];
    config.interfaces = config.interfaces || [];


    DWN.methodHandlers = {}
    DWN.interfaces = DWN.interfaces.concat(config.interfaces || []);

    for (const { methodHandlers, schemas } of DWN.interfaces) {

      // TODO: what about schemas for CollectionsInterface and PermissionsInterface
      for (const methodName in methodHandlers) {
        DWN.methodHandlers[methodName] = methodHandlers[methodName];
      }

      for (const schemaName in schemas) {
        addSchema(schemaName, schemas[schemaName]);
      }
    }


    const dwn = new DWN(config);
    await dwn.open();

    return dwn;
  }

  private async open(): Promise<void> {
    return this.messageStore.open();
  }

  async close(): Promise<void> {
    return this.messageStore.close();
  }

  async processRequest(rawRequest: any): Promise<Response> {
    let request: RequestSchema;

    try {
      request = Request.parse(rawRequest);
    } catch (e) {
      return new Response({
        status: { code: 400, message: e.message }
      });
    }

    const response = new Response();
    const context: Context = { tenant: request.target, owner: this.owner };

    for (const message of request.messages) {
      const result = await this.processMessage(message, context);
      response.addMessageResult(result);
    }

    return response;
  }

  /**
   * TODO: add docs, Issue #70 https://github.com/TBD54566975/dwn-sdk-js/issues/70
   * @param message
   */
  async processMessage(rawMessage: object, ctx: Context): Promise<MessageReply> {
    let message: BaseMessageSchema;

    try {
      message = Message.parse(rawMessage);
    } catch (e) {
      return new MessageReply({
        status: { code: 400, message: e.message }
      });
    }

    const interfaceMethod = DWN.methodHandlers[message.descriptor.method];

    return await interfaceMethod(ctx, message, this.messageStore, this.DIDResolver);
  }
};

export type Config = {
  DIDMethodResolvers: DIDMethodResolver[],
  interfaces?: Interface[];
  messageStore?: MessageStore;
  owner?: string; // DID of the DWN owner
};