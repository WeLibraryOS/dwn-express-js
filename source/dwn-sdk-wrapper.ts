import { DWN } from "./dwn-sdk";
import { DIDMethodResolver, DIDResolutionResult, DIDResolver } from "./dwn-sdk/did/did-resolver";
import {Config} from "./dwn-sdk/dwn";

class VCMethodResolver implements DIDMethodResolver {

    method(): string {
      return "vc";
    }
  
    async resolve(did: string): Promise<DIDResolutionResult> {
      return {
        '@context': 'https://w3id.org/did-resolution/v1',
        didResolutionMetadata: {
          contentType: 'string'
        },
        didDocument: null,
        didDocumentMetadata: {} // DIDDocumentMetadata
      };
    }
  }
  
  const config: Config = {
    DIDMethodResolvers: [new VCMethodResolver()],
    interfaces: [],
  }

  export default async function createDWN(options = {}): Promise<DWN> {
    return DWN.create({...config, ...options});
  }