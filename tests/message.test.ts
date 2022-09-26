import { DWN } from "../source/dwn-sdk";
import createDWN from "../source/dwn-sdk-wrapper";
import { collectionQueryMessageBody, featureDetectionMessageBody, KeyPair, makeDataCID, makeKeyPair, makeTestJWS, makeTestVerifiableCredential, TestMethodResolver } from "./helpers";
import LevelMemory from "level-mem";

// TODO: what is the correct schema for this?
const SCHEMA_URL = 'https://schema.org';

describe("test message handling", () => {

  const testDid = 'did:test:alice';

  let dwn: DWN;
  let testResolver: TestMethodResolver;
  let keyPair: KeyPair;

  beforeAll(async () => {
    testResolver = new TestMethodResolver()
    keyPair = await makeKeyPair();
    testResolver.addKey(testDid, keyPair.publicJwk);
    dwn = await createDWN({
      injectDB: new LevelMemory(),
      DIDMethodResolvers: [testResolver],
      owner: testDid,
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
    const messageBody  = featureDetectionMessageBody(testDid)
    const res = await dwn.processRequest(messageBody);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(200);
  });

  test("collection query", async () => {
    const messageBody = await collectionQueryMessageBody(keyPair, testDid);
    const res = await dwn.processRequest(messageBody);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(200);
  })

  test("object storage and query", async () => {

    const data = makeTestVerifiableCredential();
    const dataCid = await makeDataCID(JSON.stringify(data));

    const descriptor = {
      "nonce": "9b9c7f1fcabfc471ee2682890b58a427ba2c8db59ddf3c2d5ad16ccc84bb3106",
      "method": "CollectionsWrite",
      "schema": SCHEMA_URL,
      "recordId": "b6464162-84af-4aab-aff5-f1f8438dfc1e",
      "dataCid": Buffer.from(dataCid.cid.bytes).toString('base64'),
      "dateCreated": 123456789,
      "dataFormat": "application/json"
    };

    const jws = await makeTestJWS(descriptor, keyPair, testDid);
    
    const messageBody  = {
      "target": testDid,
      "messages": [
        {
          "data": Buffer.from(dataCid.data).toString('base64'),
          "descriptor": descriptor,
          "authorization": jws
        }
      ]
    }
    var res = await dwn.processRequest(messageBody);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(202);

    const query_descriptor = {
      "nonce": "9b9c7f1fcabfc471ee2682890b58a427ba2c8db59ddf3c2d5ad16ccc84bb3106",
      "method": "CollectionsQuery",
      "filter": {
        data: {
          issuer: "did:example:123",
        },
        schema: SCHEMA_URL
      }
    };

    const query_jws = await makeTestJWS(query_descriptor, keyPair, testDid);
    
    const query_message_body  = {
      "target": testDid,
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
