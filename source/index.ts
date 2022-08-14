import { DWN } from "dwn-sdk";
import { MessageReply } from "dwn-sdk/dist/esm/core";
import { BaseMessageSchema } from "dwn-sdk/dist/esm/core/types";
import { DIDMethodResolver, DIDResolutionResult, DIDResolver } from "dwn-sdk/dist/esm/did/did-resolver";
import {Config} from "dwn-sdk/dist/esm/dwn";
import { Interface } from "dwn-sdk/dist/esm/interfaces/types";
import { MessageStore } from "dwn-sdk/dist/esm/store/message-store";
import { Context } from "dwn-sdk/dist/esm/types";
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

const schemas = {} as { [key: string]: any };
schemas['FeatureDetectionRead'] = true;

function FeatureDetectionRead(
  ctx: Context,
  message: BaseMessageSchema,
  messageStore: MessageStore,
  didResolver: DIDResolver): Promise<MessageReply> {
  return Promise.resolve(new MessageReply({status: {code: 200, message: 'OK'}}));
}

const methodHandlers = [] 
methodHandlers['FeatureDetectionRead'] = FeatureDetectionRead;

const config: Config = {
  DIDMethodResolvers: [new VCMethodResolver()],
  interfaces: [{
    methodHandlers: methodHandlers,
    schemas: schemas
  }]
}

// TODO: maybe wrapp this in a class
let dwn: DWN;

// define a route handler for the default home page
app.get("/ping", (req, res) => {
  res.json({ message: "DID Express JS" });
});

app.post("/", (req, res) => {
  res.json(dwn.processRequest(req.body));
});

// start the Express server
app.listen(port, async () => {
  console.log(`server started at http://localhost:${port}`);
  dwn = await DWN.create(config)
});

export default app;