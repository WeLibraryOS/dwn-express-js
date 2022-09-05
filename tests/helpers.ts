import { CID } from "multiformats/cid";
import { DIDMethodResolver, DIDResolutionResult } from "../source/dwn-sdk/did/did-resolver";
import { secp256k1 } from "../source/dwn-sdk/jose/algorithms/signing/secp256k1";
import { GeneralJwsSigner, GeneralJwsVerifier } from "../source/dwn-sdk/jose/jws/general";
import { GeneralJws, SignatureInput } from "../source/dwn-sdk/jose/jws/general/types";
import { PublicJwk, PrivateJwk } from "../source/dwn-sdk/jose/types";
import { generateCid } from "../source/dwn-sdk/utils/cid";

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