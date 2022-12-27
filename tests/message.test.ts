import { DWN } from "../source/dwn-sdk";
import createDWN from "../source/dwn-sdk-wrapper";
import { collectionQueryMessageBody, featureDetectionMessageBody, KeyPair, makeDataCID, makeKeyPair, makeTestJWS, makeTestVerifiableCredential, makeWriteVCMessageBody, SCHEMA_URL, TestMethodResolver } from "./helpers";

describe("test message handling", () => {

  const recipientDID = 'did:test:alice';
  const authorDID = 'did:test:bob';

  let dwn: DWN;
  let testResolver: TestMethodResolver;
  let keyPair: KeyPair;

  beforeAll(async () => {
    testResolver = new TestMethodResolver()
    keyPair = await makeKeyPair();
    testResolver.addKey(recipientDID, keyPair.publicJwk);
    
    dwn = await createDWN({
      DIDMethodResolvers: [testResolver],
      owner: recipientDID,
      indexObjects: [{
        data: {
          issuer: "string",
        },
        descriptor: {
          schema: "string"
        }
      }]
    });
  });

  test("feature detection", async () => {
    const messageBody  = featureDetectionMessageBody(authorDID, recipientDID)
    const res = await dwn.processRequest(messageBody);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(200);
  });

  test("collection query", async () => {
    const messageBody = await collectionQueryMessageBody(keyPair, recipientDID);
    const res = await dwn.processRequest(messageBody);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(200);
  })

  test("object storage and query", async () => {

    const messageBody = await makeWriteVCMessageBody(keyPair, recipientDID);
    
    var res = await dwn.processRequest(messageBody);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(202);

    const query_descriptor = {
      "method": "CollectionsQuery",
      "filter": {
        data: {
          issuer: "did:example:123",
        },
        schema: SCHEMA_URL
      }
    };

    const query_jws = await makeTestJWS(query_descriptor, keyPair, recipientDID);
    
    const query_message_body  = {
      "target": recipientDID,
      "messages": [
        {
          "descriptor": query_descriptor,
          "authorization": query_jws
        }
      ]
    }
    res = await dwn.processRequest(query_message_body);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].entries).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(200);
  })

});
