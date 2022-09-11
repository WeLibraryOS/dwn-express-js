import { DWN } from "../source/dwn-sdk";
import createDWN from "../source/dwn-sdk-wrapper";
import { CollectionsWrite } from "../source/dwn-sdk/interfaces/collections/messages/collections-write";
import { dataAsBase64, KeyPair, makeDataCID, makeKeyPair, makeSignatureInput, makeTestJWS, makeTestVerifiableCredential, TestMethodResolver } from "./helpers";
import { v4 as uuidv4 } from 'uuid';
import { Request } from "../source/dwn-sdk/core/request";
import { PermissionsRequest } from "../source/dwn-sdk/interfaces/permissions/messages/permissions-request";
import { PermissionsGrant } from "../source/dwn-sdk/interfaces/permissions/messages/permissions-grant";

import LevelMemory from "level-mem";

describe("test permission handling", () => {

  const aliceDid = 'did:test:alice';
  const bobDid = 'did:test:bob';

  let aliceKeys, bobKeys: KeyPair;

  let dwn: DWN;
  let testResolver: TestMethodResolver;
  

  beforeAll(async () => {
    testResolver = new TestMethodResolver()
    
    aliceKeys = await makeKeyPair();
    testResolver.addKey(aliceDid, aliceKeys.publicJwk);

    bobKeys = await makeKeyPair();
    testResolver.addKey(bobDid, bobKeys.publicJwk);
    
    dwn = await createDWN({
      dbConstructor: LevelMemory,
      DIDMethodResolvers: [testResolver],
      owner: aliceDid
    });
  });

  test("permission request", async () => {

    expect(dwn.owner).toBe(aliceDid);

    const bobSignatureInput = makeSignatureInput(bobKeys.privateJwk, bobDid);

    const options = {
      data        :  new TextEncoder().encode(JSON.stringify({json_data: "test"})),
      dataFormat  : 'application/json',
      dateCreated : 123,
      nonce       : 'anyNonce',
      recordId    : uuidv4(),
      signatureInput: bobSignatureInput
    };
    const collectionsWrite = await CollectionsWrite.create(options);

    // bob tries to write to alice's collection
    let res = await dwn.processRequest(Request.createFromMessage(bobDid, collectionsWrite.toObject()));
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(401);

    // alice grants permission to bob
    const aliceSignatureInput = makeSignatureInput(aliceKeys.privateJwk, aliceDid);

    const permissionsGrant = await PermissionsGrant.create({
      description : 'alice gives bob permission',
      grantedBy   : aliceDid,
      grantedTo   : bobDid,
      scope       : { method: 'CollectionsWrite' },
      signatureInput: aliceSignatureInput
    });

    res = await dwn.processRequest(Request.createFromMessage(bobDid, permissionsGrant.toObject()));
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(202);

    // bob again tries again to write to alice's collection
    res = await dwn.processRequest(Request.createFromMessage(bobDid, collectionsWrite.toObject()));
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(202);
  });

});


