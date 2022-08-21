import { DWN } from "./dwn-sdk";
import { MessageReply } from "./dwn-sdk/core";
import { BaseMessageSchema } from "./dwn-sdk/core/types";
import { DIDMethodResolver, DIDResolutionResult, DIDResolver } from "./dwn-sdk/did/did-resolver";
import {Config} from "./dwn-sdk/dwn";
import { Interface } from "./dwn-sdk/interfaces/types";
import { MessageStore } from "./dwn-sdk/store/message-store";
import { Context } from "./dwn-sdk/types";
import express, { Application, Request, Response, NextFunction } from "express";


const app: Application = express();
app.use(express.json());
const port = 8080; // default port to listen

class VCMethodResolver implements DIDMethodResolver {

  method(): string {
    return "vc";
  }

  async resolve(did: string): Promise<DIDResolutionResult> {
    return {
      '@context': 'https://w3id.org/did-resolution/v1',
      didResolutionMetadata: {
        contentType: 'string'
      },
      didDocument: null,
      didDocumentMetadata: {} // DIDDocumentMetadata
    };
  }
}

function FeatureDetectionRead (
  ctx: Context,
  message: BaseMessageSchema,
  messageStore: MessageStore,
  didResolver: DIDResolver): Promise<MessageReply> {

    const interfaces: string[] = []
    for(var index in DWN.interfaces) {
      interfaces.push(index.toString());
    }

    const entries = [
      {
        descriptor: {
          method: 'FeatureDetectionRead',
          type: "FeatureDetection",
          interfaces: { 
            collections: {
            CollectionsQuery: true
          } }  
      }}
    ];
  return Promise.resolve(new MessageReply({entries: entries, status: {code: 200, message: 'OK'}}));
}

const config: Config = {
  DIDMethodResolvers: [new VCMethodResolver()],
  interfaces: [{
    methodHandlers: {'FeatureDetectionRead': FeatureDetectionRead},
    schemas: {},  // TODO: add schema here
    messages: []
  }]
}

// TODO: maybe wrapp this in a class
let dwn: DWN;

// define a route handler for the default home page
app.get("/ping", (req, res) => {
  res.json({ message: "DID Express JS" });
});

app.post("/", async (req, res) => {
  const response = await dwn.processRequest(req.body);
  res.json(response);
});

// start the Express server
app.listen(port, async () => {
  console.log(`server started at http://localhost:${port}`);
  dwn = await DWN.create(config)
});

export default app;