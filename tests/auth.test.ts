import { GeneralJwsSigner, GeneralJwsVerifier } from "../source/dwn-sdk/jose/jws/general";
import sinon from 'sinon';
import { DIDResolver } from "../source/dwn-sdk/did/did-resolver";
import { makeTestJWS } from "./helpers";

// from /dwn-sdk-jstests/jose/jws/general.spec.ts
describe('General JWS Sign/Verify', () => {

    test('should sign and verify secp256k1 signature using a key vector correctly',  async () => {
        
      const {jws, publicJwk} = await makeTestJWS({hello: "darkness my old friend"});

        const mockResolutionResult = {
          didResolutionMetadata : {},
          didDocument           : {
            verificationMethod: [{
              id           : 'did:jank:alice#key1',
              type         : 'JsonWebKey2020',
              publicKeyJwk : publicJwk
            }]
          },
          didDocumentMetadata: {}
        };
    
        const resolverStub = sinon.createStubInstance(DIDResolver, {
          // @ts-ignore
          resolve: sinon.stub().withArgs('did:jank:alice').resolves(mockResolutionResult)
        });
    
        const verifier = new GeneralJwsVerifier(jws);
    
        const verificationResult = await verifier.verify(resolverStub);
    
        expect(verificationResult.signers.length).toEqual(1);
        expect(verificationResult.signers).toContain('did:jank:alice');
      });
})