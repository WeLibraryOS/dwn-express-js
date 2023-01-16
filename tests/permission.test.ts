import { DWN } from "../source/dwn-sdk";
import { CollectionsWrite } from "../source/dwn-sdk/interfaces/collections/messages/collections-write";
import { makeTestDWN, KeyPair, makeKeyPair, makePermissionGrantMessageBody, makeSignatureInput, TestMethodResolver, makeWriteVCMessageBody } from "./helpers";
import { Request } from "../source/dwn-sdk/core/request";

import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
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

    const request = await makeWriteVCMessageBody(bobKeys, bobDid);

    mockDB.on(QueryCommand).resolves({
      Items: []
    });

    // bob tries to write to alice's collection
    let res = await dwn.processRequest(request);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(401);

    const permissionGrantRequest = await makePermissionGrantMessageBody(aliceKeys, aliceDid, bobDid)

    res = await dwn.processRequest(permissionGrantRequest);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(202);

    mockDB.on(QueryCommand).resolves({
      Items: [{
        "descript0r_method": {
          "S": "PermissionsRequest"
        },
        "descript0r_dataFormat": {
          "S": "application/json"
        },
        "descript0r_grantedBy": {
          "S": "did:example:alice"
        },
        "descript0r_grantedTo": {
          "S": "did:key:z6MkpYCZ8tzcsJSrpw5hNMgkQ3suN6sKnop2Q1prTco3Tgx4"
        },
        "descript0r_scope_method": {
          "S": "CollectionsWrite"
        },
        "message": {
          "S": "{\"descriptor\":{\"method\":\"PermissionsRequest\",\"permissionRequestId\":\"30cc8bdf-f731-46c1-9b98-2622a331f572\",\"grantedBy\":\"did:example:alice\",\"grantedTo\":\"did:key:z6MkpYCZ8tzcsJSrpw5hNMgkQ3suN6sKnop2Q1prTco3Tgx4\",\"scope\":{\"method\":\"CollectionsWrite\",\"schema\":\"https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob_v3p0_achievementcredential_schema.json\"},\"dataFormat\":\"application/json\"},\"authorization\":{\"payload\":\"eyJkZXNjcmlwdG9yQ2lkIjoiYmFmeXJlaWI2dWlpZWJidXZ3cGJwZWFna3hocWdpNTRmdHRjeHZ6amxjYWxndmZ2a2JlcHE0Y2U0YmEifQ\",\"signatures\":[{\"protected\":\"eyJhbGciOiJFZDI1NTE5Iiwia2lkIjoiZGlkOmtleTp6Nk1rcFlDWjh0emNzSlNycHc1aE5NZ2tRM3N1TjZzS25vcDJRMXByVGNvM1RneDQifQ\",\"signature\":\"yKR9p95U6tK39U5uI81CxSojQFILr4vUZdgeVHNvM7nptqbsM_XIs9RBDMaWlqKwyUq2KwkhHAgzrstu1-hCDw\"}]}}"
        }
      }]
    });
  
    // bob again tries again to write to alice's collection
    res = await dwn.processRequest(request);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(202);
  });
});


