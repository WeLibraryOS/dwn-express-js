import crossFetch from 'cross-fetch';
import { DIDMethodResolver, DIDResolutionResult } from './did-resolver';

/**
 * Resolver for Web DIDs.
 */
export class WebDidResolver implements DIDMethodResolver {
  // cross-platform fetch
  private fetch = crossFetch;

  method(): string {
    return 'web';
  }

  /*
    https://w3c-ccg.github.io/did-method-web/
    Replace ":" with "/" in the method specific identifier to obtain the fully qualified domain name and optional path.
    If the domain contains a port percent decode the colon.
    Generate an HTTPS URL to the expected location of the DID document by prepending https://.
    If no path has been specified in the URL, append /.well-known.
    Append /did.json to complete the URL.
    Perform an HTTP GET request to the URL using an agent that can successfully negotiate a secure HTTPS connection, which enforces the security requirements as described in 2.5 Security and privacy considerations.
    When performing the DNS resolution during the HTTP GET request, the client SHOULD utilize [RFC8484] in order to prevent tracking of the identity being resolved.
*/
  async resolve(did: string): Promise<DIDResolutionResult> {
    const didParts = did.split(':');
    let path = didParts.slice(2).join('/');
    if (path.length == 0) {
      path = '.well-known';
    }
    let urlString = `https://${didParts[2]}/${path}/did.json`;
    const resolutionUrl = new URL(urlString).toString();
    const response = await this.fetch(resolutionUrl);

    if (response.status !== 200) {
      throw new Error(`unable to resolve ${did}, got http status ${response.status}`);
    }

    const didResolutionResult = await response.json();
    return didResolutionResult;
  }
}
