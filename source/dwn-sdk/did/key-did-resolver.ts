import { GeneralJwsVerifier } from '../jose/jws/general';
import { PublicJwk } from '../jose/types';
import { DIDMethodResolver, DIDResolutionResult } from './did-resolver';

import KeyDIDResolver from 'key-did-resolver'
import {Resolver} from 'did-resolver'

/**
 * Resolver for KEY DIDs.
 */
export class KeyDidResolver implements DIDMethodResolver {

  method(): string {
    return 'key';
  }

  async resolve(did: string): Promise<DIDResolutionResult> {
    const resolver = new Resolver(KeyDIDResolver.getResolver())
    const doc = await resolver.resolve(did)
    return {
      '@context': 'https://w3id.org/did-resolution/v1',
      didResolutionMetadata : {},
      didDocument           : doc.didDocument,
      didDocumentMetadata: {}
    };
  }
}