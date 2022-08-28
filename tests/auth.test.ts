import { GeneralJwsSigner, GeneralJwsVerifier } from "../source/dwn-sdk/jose/jws/general";
import sinon from 'sinon';
import { DIDResolver } from "../source/dwn-sdk/did/did-resolver";
import { makeTestJWS, makeMockResolutionResult, makeKeyPair } from "./helpers";

// from /dwn-sdk-jstests/jose/jws/general.spec.ts
describe('General JWS Sign/Verify', () => {

    test('should sign and verify secp256k1 signature using a key vector correctly',  async () => {

      const keyPair = await makeKeyPair();
        
      const jws = await makeTestJWS({hello: "darkness my old friend"}, keyPair, 'did:vc:alice');

        const mockResolutionResult = makeMockResolutionResult('did:vc:alice', keyPair.publicJwk);
    
        const resolverStub = sinon.createStubInstance(DIDResolver, {
          // @ts-ignore
          resolve: sinon.stub().withArgs('did:vc:alice').resolves(mockResolutionResult)
        });
    
        const verifier = new GeneralJwsVerifier(jws);
    
        const verificationResult = await verifier.verify(resolverStub);
    
        expect(verificationResult.signers.length).toEqual(1);
        expect(verificationResult.signers).toContain('did:vc:alice');
      });
})