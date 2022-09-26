import { GeneralJwsVerifier } from '../jose/jws/general';
import { PublicJwk } from '../jose/types';
import { DIDMethodResolver, DIDResolutionResult } from './did-resolver';

/**
 * Resolver for KEY DIDs.
 */
export class KeyDidResolver implements DIDMethodResolver {

  method(): string {
    return 'key';
  }

  async resolve(did: string): Promise<DIDResolutionResult> {
    const didParts = did.split(':');
    return {
      '@context': 'https://w3id.org/did-resolution/v1',
      didResolutionMetadata : {},
      didDocument           : {
          id: did,    // TODO: not sure what to use here for the id
              verificationMethod: [{
                  controller: did,    // TODO: it is not correct to use the same did as the controller
                  id           : `${did}#key1`,
                  type         : 'JsonWebKey2020',
                  publicKeyJwk : GeneralJwsVerifier.makeObjectFromBase64UrlString<PublicJwk>(didParts[2])
              }]
      },
      didDocumentMetadata: {}
    };
  }
}