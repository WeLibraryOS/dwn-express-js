import { DWN } from "../source/dwn-sdk";
import { collectionQueryMessageBody, featureDetectionMessageBody, KeyPair, makeDataCID, makeKeyPair, makeTestDWN, makeTestJWS, makeTestVerifiableCredential, makeWriteVCMessageBody, SCHEMA_URL, TestMethodResolver } from "./helpers";
import { AwsStub, mockClient } from "aws-sdk-client-mock";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

describe("test message handling", () => {

  const ownerDID = 'did:test:alice';
  const authorDID = 'did:test:bob';

  let dwn: DWN;
  let keyPair: KeyPair;
  let mockDB: AwsStub<object, any>;

  beforeAll(async () => {
    keyPair = await makeKeyPair();
    mockDB = mockClient(DynamoDBClient);
    dwn = await makeTestDWN(mockDB, keyPair, ownerDID)
  });

  beforeEach(() => {
    mockDB.reset();

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
  });

  test("feature detection", async () => {
    const messageBody  = featureDetectionMessageBody(authorDID, ownerDID)
    const res = await dwn.processRequest(messageBody);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(200);
  });

  test("collection query", async () => {
    const messageBody = await collectionQueryMessageBody(keyPair, ownerDID);
    const res = await dwn.processRequest(messageBody);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(200);
  })

  test("object storage and query", async () => {

    const messageBody = await makeWriteVCMessageBody(keyPair, ownerDID);
    
    var res = await dwn.processRequest(messageBody);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(202);

    const query_message_body = await collectionQueryMessageBody(keyPair, ownerDID);

    res = await dwn.processRequest(query_message_body);
    await expect(res.replies).toHaveLength(1);
    await expect(res.replies![0].entries).toHaveLength(1);
    await expect(res.replies![0].status.code).toBe(200);
  })

});
