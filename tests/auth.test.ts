import { GeneralJwsSigner, GeneralJwsVerifier } from "../source/dwn-sdk/jose/jws/general";
import sinon from 'sinon';
import { DIDResolver } from "../source/dwn-sdk/did/did-resolver";
import { makeTestJWS, makeMockResolutionResult, makeKeyPair, makeTestVerifiableCredential } from "./helpers";
import didkit from '@spruceid/didkit-wasm-node'

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

    test('didkit functions',  async () => {
      const issuerKeypair = didkit.generateEd25519Key(),
        subjectKeypair = didkit.generateEd25519Key();;

      const issuerDid = didkit.keyToDID('key', issuerKeypair), subjectDid = didkit.keyToDID('key', subjectKeypair);
      expect (issuerDid).toContain('did:key')
      expect (subjectDid).toContain('did:key')

      const issued_credential = await didkit.issueCredential(JSON.stringify(makeTestVerifiableCredential(issuerDid, subjectDid)), JSON.stringify({challenge: 'come at me bro!'}), issuerKeypair)

      const verified_credential = await didkit.verifyCredential(issued_credential, JSON.stringify({challenge: 'come at me bro!'}))

      expect(JSON.parse(verified_credential).errors.length).toEqual(0)

    });
})