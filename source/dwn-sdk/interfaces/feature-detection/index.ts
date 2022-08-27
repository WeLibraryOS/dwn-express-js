import { DWN } from "../../../dwn-sdk";
import { MessageReply } from "../../../dwn-sdk/core";
import { BaseMessageSchema } from "../../../dwn-sdk/core/types";
import { DIDResolver } from "../../../dwn-sdk/did/did-resolver";
import { MessageStore } from "../../../dwn-sdk/store/message-store";
import { Context } from "../../../dwn-sdk/types";

function FeatureDetectionRead (
    ctx: Context,
    message: BaseMessageSchema,
    messageStore: MessageStore,
    didResolver: DIDResolver): Promise<MessageReply> {
  
      const interfaces: {[id: string] : any} = {};
  
      for( const {name, methodHandlers} of DWN.interfaces) {
        const methodsPresent = {}
        for (const methodName in methodHandlers) {
          methodsPresent[methodName] = true;
        }
        interfaces[name!] = methodsPresent;
      };
  
      const entries = [
        {
          descriptor: {
            method: 'FeatureDetectionRead',
            type: "FeatureDetection",
            interfaces: interfaces
        }}
      ];
    return Promise.resolve(new MessageReply({entries: entries, status: {code: 200, message: 'OK'}}));
  }

export const FeatureDetectionInterface = {
    'name': 'feature-detection',
    methodHandlers: {'FeatureDetectionRead': FeatureDetectionRead},
    schemas: {'FeatureDetectionRead': {
        type: 'object',
        properties: {
          type: {type: "string"},
          interfaces: {type: "object"}
        }
      },
    },
    messages: []
  }