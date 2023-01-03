import { DWN } from "../source/dwn-sdk";
import { CollectionsWrite } from "../source/dwn-sdk/interfaces/collections/messages/collections-write";
import { makeTestDWN, KeyPair, makeKeyPair, makePermissionGrantMessageBody, makeSignatureInput, TestMethodResolver } from "./helpers";
import { Request } from "../source/dwn-sdk/core/request";

import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

describe("test permission handling", () => {

  const aliceDid = 'did:test:alice';
  const bobDid = 'did:test:bob';

  let aliceKeys: KeyPair, bobKeys: KeyPair;

  let dwn: DWN;
  let testResolver: TestMethodResolver;
  let mockDB: any;
  

  beforeAll(async () => {
    testResolver = new TestMethodResolver()
    
    aliceKeys = await makeKeyPair();
    testResolver.addKey(aliceDid, aliceKeys.publicJwk);

    bobKeys = await makeKeyPair();
    testResolver.addKey(bobDid, bobKeys.publicJwk);
    
    mockDB = mockClient(DynamoDBClient);
    dwn = await makeTestDWN(mockDB, aliceKeys, aliceDid, testResolver)
  });

  test("permission request", async () => {

    expect(dwn.owner).toBe(aliceDid);

    const bobSignatureInput = makeSignatureInput(bobKeys.privateJwk, bobDid);

    const options = {
      data        :  new TextEncoder().encode(JSON.stringify({json_data: "test"})),
      dataFormat  : 'application/json',
      dateCreated : 123,
      signatureInput: bobSignatureInput,
      processing: {
        recipient: aliceDid,
        author: bobDid,
        nonce: randomUUID()
      }
    };
    const collectionsWrite = await CollectionsWrite.create(options);

    // bob tries to write to alice's collection
    let res = await dwn.processRequest(Request.createFromMessage(bobDid, collectionsWrite.toObject()));
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(401);

    const permissionGrantRequest = await makePermissionGrantMessageBody(aliceKeys, aliceDid, bobDid)

    res = await dwn.processRequest(permissionGrantRequest);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(202);

    // bob again tries again to write to alice's collection
    res = await dwn.processRequest(Request.createFromMessage(bobDid, collectionsWrite.toObject()));
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(202);
  });

});


