import { CID } from "multiformats/cid";
import { DIDMethodResolver, DIDResolutionResult } from "../source/dwn-sdk/did/did-resolver";
import { secp256k1 } from "../source/dwn-sdk/jose/algorithms/signing/secp256k1";
import { GeneralJwsSigner, GeneralJwsVerifier } from "../source/dwn-sdk/jose/jws/general";
import { GeneralJws, SignatureInput } from "../source/dwn-sdk/jose/jws/general/types";
import { PublicJwk, PrivateJwk } from "../source/dwn-sdk/jose/types";
import { generateCid } from "../source/dwn-sdk/utils/cid";
import { TextEncoder } from "util";
import { Request } from "../source/dwn-sdk/core/request";
import { RequestSchema } from "../source/dwn-sdk/core/types";
import { PermissionsGrant } from "../source/dwn-sdk/interfaces/permissions/messages/permissions-grant";
import { randomUUID } from "crypto";

// TODO: what is the correct schema for this?
export const SCHEMA_URL = 'https://schema.org';

export type KeyPair = { publicJwk: PublicJwk, privateJwk: PrivateJwk };

export async function makeKeyPair() {
    return secp256k1.generateKeyPair();
}

export async function makeTestJWS(payload: object, keyPair: KeyPair, did: string): Promise<GeneralJws> {
    const cid = await generateCid(payload);
    const { privateJwk, publicJwk } = keyPair;
    const payloadBytes = new TextEncoder().encode(JSON.stringify({descriptorCid: cid.toV1().toString()}));
    const protectedHeader = { alg: 'ES256K', kid: `${did}#key1` };

    const signer = await GeneralJwsSigner.create(payloadBytes, [{ jwkPrivate: privateJwk, protectedHeader }]);
    return signer.getJws();
}

export function makeMockResolutionResult(did: string, publicJwk: PublicJwk): DIDResolutionResult {
    
    return {
        '@context': 'https://w3id.org/did-resolution/v1',
        didResolutionMetadata : {},
        didDocument           : {
            id: did,    // TODO: not sure what to use here for the id
                verificationMethod: [{
                    controller: did,    // TODO: it is not correct to use the same did as the controller
                    id           : `${did}#key1`,
                    type         : 'JsonWebKey2020',
                    publicKeyJwk : publicJwk
                }]
        },
        didDocumentMetadata: {}
      };
}

export class TestMethodResolver implements DIDMethodResolver {

    didKeys: Map<string, PublicJwk>;

    constructor() {
        this.didKeys = new Map();
    }

    // TODO: make sure added keys conform to the did spec
    addKey(did: string, key: PublicJwk) {
        this.didKeys.set(did, key);
    }

    method(): string {
      return "test";
    }
  
    async resolve(did: string): Promise<DIDResolutionResult> {
      return makeMockResolutionResult(did, this.didKeys.get(did)!);
    }
  }

  export type DataCID = { cid: CID, data: Uint8Array }

  export async function makeDataCID(json_data: string): Promise<DataCID> {
    const dataBytes = new TextEncoder().encode(json_data);
    const cid = await generateCid(json_data);
    return { cid: cid, data: dataBytes };
  }

  export function makeTestVerifiableCredential() {
    return {
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://www.w3.org/2018/credentials/examples/v1"
        ],
        "id": "http://example.gov/credentials/3732",
        "type": [
          "VerifiableCredential",
          "UniversityDegreeCredential"
        ],
        "issuer": "did:example:123",
        "issuanceDate": "2020-03-10T04:24:12.164Z",
        "credentialSubject": {
          "id": "did:example:456",
          "degree": {
            "type": "BachelorDegree",
            "name": "Bachelor of Science and Arts"
          }
        },
        "proof": {
          "type": "EcdsaSecp256k1Signature2019",
          "created": "2020-03-10T04:24:12.164Z",
          "proofPurpose": "assertionMethod",
          "verificationMethod": "did:example:123#key1",
          "jws": "eyJhbGciOiJFUzI1NksifQ.."
        }
      }
  }

  export function makeSignatureInput(privateJwk: PrivateJwk, did: string): SignatureInput {
    const keyId = `${did}#key1`;
    return {
      jwkPrivate      : privateJwk,
      protectedHeader : {
        alg : privateJwk.alg as string,
        kid : keyId
      }
    };
  }

  export function dataAsBase64(data: any) {
    return Buffer.from(JSON.stringify(data)).toString('base64');
  }

  export function featureDetectionMessageBody(author: string, targetDID: string): RequestSchema {
    return {
      "target": targetDID,
      "messages": [
        {
          recordId: randomUUID(),
          processing: {
            nonce: randomUUID(),
            recipient: targetDID,
            author: author
          },
            descriptor: {
                method: "FeatureDetectionRead"
            }
        }
      ]
    }
  }
  export async function collectionQueryMessageBody(keyPair: KeyPair, did: string): Promise<RequestSchema> {
    const descriptor = {
      "nonce": "9b9c7f1fcabfc471ee2682890b58a427ba2c8db59ddf3c2d5ad16ccc84bb3106",
      "method": "CollectionsQuery",
      "filter": {"dataFormat": "application/json"}
    };

    const jws = await makeTestJWS(descriptor, keyPair, did);
    
    const messageBody  = {
      "target": did,
      "messages": [
        {
          "descriptor": descriptor,
          "authorization": jws
        }
      ]
    }

    return messageBody;
  }

  export async function makeWriteVCMessageBody(keyPair: KeyPair, did: string): Promise<RequestSchema> {
    const data = makeTestVerifiableCredential();
    const dataCid = await makeDataCID(JSON.stringify(data));

    const descriptor = {
      "method": "CollectionsWrite",
      "schema": SCHEMA_URL,
      "dataCid": Buffer.from(dataCid.cid.bytes).toString('base64'),
      "dateCreated": 123456789,
      "dataFormat": "application/json"
    };

    const jws = await makeTestJWS(descriptor, keyPair, did);
    
    const messageBody  = {
      "target": did,
      "messages": [
        {
          "data": Buffer.from(dataCid.data).toString('base64'),
          "descriptor": descriptor,
          "authorization": jws
        }
      ]
    }

    return messageBody;
  }

  export async function makePermissionGrantMessageBody(grantorKeys: KeyPair, grantorDid: string, granteeDid: string): Promise<RequestSchema> {
    const aliceSignatureInput = makeSignatureInput(grantorKeys.privateJwk, grantorDid);

    const permissionsGrant = await PermissionsGrant.create({
      description : 'alice gives bob permission',
      grantedBy   : grantorDid,
      grantedTo   : granteeDid,
      scope       : { method: 'CollectionsWrite' },
      signatureInput: aliceSignatureInput
    });

    return Request.createFromMessage(granteeDid, permissionsGrant.toObject());
  }
